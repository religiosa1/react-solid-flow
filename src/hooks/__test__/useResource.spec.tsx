import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useResource } from "../useResource";

import { pause } from "../../helpers/pause";

const t = 5;
const fetcher = vi.fn(async(
  item: number,
  opts: { signal: AbortSignal }
) => {
  await pause(t, opts);
  return item;
});

describe("useResource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => { vi.useRealTimers() });

  describe("useResource resolve/reject", () => {
    it("loads the data through the fetcher", async () => {
      const { result } = renderHook(() => useResource(
        fetcher,
        [1],
      ));
      const [ resource ] = result.current;
      expect(resource.data).toBeUndefined();
      expect(resource.state).toBe("pending");
      expect(fetcher).toBeCalledWith(1, expect.objectContaining({
        refetching: false,
        signal: expect.any(AbortSignal),
      }));
      await act(() => vi.advanceTimersToNextTimer());
      expect(result.current[0].data).toBe(1);
      expect(result.current[0].state).toBe("ready");
    });

    it("initially ready if initial value is provided", () => {
      const { result } = renderHook(() => useResource(
        fetcher,
        [1],
        { initialValue: 10 },
      ));
      const [ resource ] = result.current;
      expect(resource.data).toBe(10);
      expect(resource.state).toBe("refreshing");
    });

    it("resolves sync if fetcher returns a non-promise value", async () => {
      const { result } = renderHook(() => useResource(
        () => 5,
        [],
      ));
      const [ resource ] = result.current;
      expect(resource.state).toBe("ready");
      expect(resource.data).toBe(5);
    });
  });

  describe("dependency tracking and memoization", () => {
    it("refetches data when the deps change", async () => {
      const { result, rerender } = renderHook((arg: number) => useResource(
        fetcher,
        [arg],
      ), {initialProps: 1});
      await act(() => vi.advanceTimersToNextTimer());
      expect(result.current[0].data).toBe(1);
      act(() => rerender(5));
      expect(result.current[0].state).toBe("refreshing");
      await act(() => vi.advanceTimersToNextTimer());
      expect(result.current[0].data).toBe(5);
      expect(fetcher).toBeCalledTimes(2);
    });

    it("doesn't refetch on next renders, if deps are the same", async () => {
      const { result, rerender } = renderHook((arg: number) => useResource(
        fetcher,
        [arg],
      ), {initialProps: 1});
      await act(() => vi.advanceTimersToNextTimer());
      expect(result.current[0].state).toBe("ready");
      act(() => rerender(1));
      await act(() => vi.advanceTimersToNextTimer());
      expect(result.current[0].state).toBe("ready");
      expect(fetcher).toBeCalledTimes(1);
    });

    it("memoize the fetcher func", () => {
      const fn1 = vi.fn(() => 1);
      const { result, rerender } = renderHook((f: () => number) => useResource(
        f,
        [],
      ), { initialProps: fn1 });
      expect(fn1).toBeCalled();
      const fn2 = vi.fn(() => 2)
      act(() => rerender(fn2));
      const [resource] = result.current;
      expect(resource.data).toBe(1);
      expect(fn2).not.toBeCalled();
    });

    it("doesn't memoize the fetcher func, if the corresponding option is provided", () => {
      const fn1 = vi.fn(() => 1);
      const { result, rerender } = renderHook((f: () => number) => useResource(
        f,
        [],
        { skipFnMemoization: true }
      ), { initialProps: fn1 });
      expect(fn1).toBeCalled();
      const fn2 = vi.fn(() => 2)
      act(() => rerender(fn2));
      const [resource] = result.current;
      expect(resource.data).toBe(2);
      expect(fn2).toBeCalled();
    });

    it("allows to skip initial call with skipFirstRun flag", () => {
      const { rerender } = renderHook((a: number) => useResource(
        fetcher,
        [a],
        { skipFirstRun: true }
      ), { initialProps: 1 });
      vi.advanceTimersToNextTimer();
      expect(fetcher).not.toBeCalled();
      act(() => rerender(2));
      expect(fetcher).toBeCalledTimes(1);
    });
  });

  describe("abortions, race conditions and no unmounted state updates", () => {
    it("aborts unresolved fetchers via AbortSignal", async () => {
      const handler = vi.fn();
      const fetcher = vi.fn(async (v: number, { signal }: {signal: AbortSignal}) => {
        signal.addEventListener("abort", handler, { once: true });
        await pause(t, { signal });
        return v;
      });
      const { rerender } = renderHook((v) => useResource(
        fetcher,
        [v]
      ), { initialProps: 1 });
      act(() => rerender(2));
      await act(() => vi.advanceTimersByTime(3*t));
      expect(fetcher).toBeCalledTimes(2);
      expect(handler).toBeCalledTimes(1);
    });

    it("doesn't let the promise race, always tracking only the last promise", async () => {
      vi.useFakeTimers();
      async function fetcher(n: number) {
        // the less is n the longer it takes to resolve -- we won't this promise
        // to resolve last
        await pause(3 * t - n * t);
        return n;
      }
      const { result, rerender } = renderHook((v) => useResource(
        fetcher,
        [v]
      ), { initialProps: 1 });
      rerender(2);
      await act(() => vi.advanceTimersByTime(4*t));
      const [resource] = result.current;
      expect(resource.state).toBe("ready");
      expect(resource.data).toBe(2);
      vi.useRealTimers();
    });

    it("calls abort on unmount", async () => {
      const handler = vi.fn();
      const fetcher = vi.fn(async ({ signal }: {signal: AbortSignal}) => {
        signal.addEventListener("abort", handler, { once: true });
        await pause(3*t, { signal });
      });

      const { unmount } = renderHook(() => useResource(
        fetcher,
        []
      ));
      unmount();
      expect(handler).toBeCalledTimes(1);
    });
  });

  describe("special options",  () => {
    it("calls onCompleted if it's provided when the resource is resolved", async () => {
      const onCompleted = vi.fn();
      renderHook(() => useResource(
        fetcher,
        [1],
        { onCompleted }
      ));
      await act(() => vi.advanceTimersToNextTimer());
      expect(onCompleted).toBeCalledTimes(1);
      expect(onCompleted).toBeCalledWith(1);
    });

    it("calls onError if it's provided when the resource is rejected", async () => {
      const err = new Error("test");
      const onError = vi.fn();
      renderHook(() => useResource(
        async () => {
          await pause(t);
          throw err;
        },
        [],
        { onError }
      ));
      try {
        await act(() => vi.advanceTimersToNextTimer());
      } catch(e) {
        expect(onError).toBeCalledTimes(1);
        expect(onError).toBeCalledWith(err);
      }
    });

    it("allows to skip automatic invocation of fetcher with skip flag", async () => {
      const { result, rerender } = renderHook(([skip, value]) => useResource(
        fetcher,
        [value],
        { skip }
      ), { initialProps: [ true, 1 ] as [ boolean, number ] });
      const [ resource ] = result.current;
      expect(resource.data).toBeUndefined();
      expect(resource.state).toBe("unresolved");
      expect(fetcher).not.toBeCalled();
      rerender([true, 2]);
      expect(fetcher).not.toBeCalled();
      rerender([false, 3]);
      expect(fetcher).toBeCalledTimes(1);
      await act(() => vi.advanceTimersToNextTimer());
      expect(result.current[0].data).toBe(3);
      expect(result.current[0].state).toBe("ready");
    });

    it("allows to manually call refetch when skip is supplied", async () => {
      const { result, rerender } = renderHook((value) => useResource(
        fetcher,
        [value],
        { skip: true  }
      ), { initialProps: 1 });
      const [ , controls ] = result.current;
      await act(() => {
        controls.refetch(2);
        vi.advanceTimersToNextTimer()
      });
      const [ resource ] = result.current;
      expect(resource.data).toBe(2);
      expect(resource.state).toBe("ready");
    });
  });

  describe("controls", () => {
    it("allows to modify data directly", async () => {
      const { result } = renderHook(() => useResource(
        fetcher,
        [3]
      ));
      const [_, controls] = result.current;
      await act(() => controls.mutate(5));
      const [ resource ] = result.current;
      expect(resource.data).toBe(5);
      expect(resource.state).toBe("ready");
    });

    it("allows to refetch the data", async () => {
      const { result } = renderHook(() => useResource(
        fetcher,
        [3]
      ));
      await act(() => vi.advanceTimersToNextTimer());
      const [_, controls] = result.current;
      await act(async () => {
        const prms = controls.refetch(10);
        vi.advanceTimersToNextTimer();
        return prms;
      });
      const [ resource ] = result.current;
      expect(resource.data).toBe(10);
      expect(fetcher).toBeCalledTimes(2);
      expect(fetcher).toHaveBeenLastCalledWith(10, expect.objectContaining({
        signal: expect.any(AbortSignal),
        refetching: true,
      }))
    });

    it("throws syncronous refetch error", () => {
      const { result } = renderHook(() => useResource(
        () => { throw new Error("test") },
        [],
        { skipFirstRun: true }
      ));
      const [_, controls] = result.current;

      act(() => {
        expect(() => controls.refetch()).toThrow("test");
      });
    });

    it("allows to abort current fetch call", async () => {
      const handler = vi.fn();
      const fetcher = vi.fn(async ({ signal }: {signal: AbortSignal}) => {
        signal.addEventListener("abort", handler, { once: true });
        await pause(t, { signal });
      });
      const { result } = renderHook(() => useResource(fetcher));
      expect(handler).not.toBeCalled();
      const [, controls] = result.current;
      await act(() => controls.abort());
      expect(handler).toBeCalledTimes(1);
      expect(result.current[0].state).toBe("pending");
    });

    it("abort with reason other then AbortError will result in errored state", async () => {
      const handler = vi.fn();
      const fetcher = vi.fn(async ({ signal }: {signal: AbortSignal}) => {
        signal.addEventListener("abort", handler, { once: true });
        await pause(t, { signal });
      });
      const { result } = renderHook(() => useResource(fetcher));
      const [, controls] = result.current;
      await act(() => controls.abort("test"));
      expect(handler).toBeCalledTimes(1);
      expect(result.current[0].state).toBe("errored");
      expect(result.current[0].error).toBe("test");
    });
  });
});