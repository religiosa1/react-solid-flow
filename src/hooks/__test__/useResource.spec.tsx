import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useResource } from "../useResource";
import { act } from "react-dom/test-utils";
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

    it("errors in sync fetchers update sync, resulting in errored state", async () => {
      const { result } = renderHook(() => useResource(
        () => { throw new Error("test"); },
        [],
      ));
      expect(result.current[0].state).toBe("errored");
      expect(result.current[0].error.message).toBe("test");
      await expect(result.current[0].promise).rejects.toThrow("test");
    });

    it("errors in async fetchers result in errored state", async () => {
      const { result } = renderHook(() => useResource(
        async () => {
          await pause(t);
          throw new Error("TEST");
        },
        [],
      ));
      await act(() => vi.advanceTimersToNextTimer());
      expect(result.current[0].state).toBe("errored");
      await expect(result.current[0].promise).rejects.toThrow("TEST");
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
  })

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
    });
  });
});