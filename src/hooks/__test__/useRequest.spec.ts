import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import { useRequest, UseRequestCbOpts } from "../useRequest";

describe("useRequest", () => {
  it("Memoize asyncFunction", async () => {
    const fn1 = vi.fn(async () => 1);
    const fn2 = vi.fn(async () => 2);
    const { rerender } = renderHook((fn) => useRequest(fn, []), {
      initialProps: fn1
    });
    await act(() => rerender(fn2));
    await waitFor(() => {
      expect(fn1).toBeCalled();
      expect(fn2).not.toBeCalled();
    });
  });

  it("reruns asyncFunction, if its params change", async () => {
    const fn = vi.fn(async (param: number) => param);
    const { rerender } = renderHook((param: number) => useRequest(fn, [param]), { initialProps: 1 });
    expect(fn).toHaveBeenLastCalledWith(1, { signal: expect.any(AbortSignal) });
    await act(() => rerender(2));
    expect(fn).toHaveBeenLastCalledWith(2, { signal: expect.any(AbortSignal) });
  });

  it("Updates state, on asyncFunction resolution", async() => {
    const fn = vi.fn(async (param: number) => param);
    const { result } = renderHook((p) => useRequest(fn, [p]), {
      initialProps: 1
    });
    await waitFor(() => {
      expect(result.current.result).toBe(1);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
    });
    /** @see useAsyncState */
  });

  it("Skips memoization if skipFnMemoization is supplied", async () => {
    const fn1 = vi.fn(async () => {});
    const fn2 = vi.fn(async () => {});
    const { rerender } = renderHook((fn) => useRequest(fn, [], { skipFnMemoization: true }), {
      initialProps: fn1
    });
    await act(() => rerender(fn2));
    await waitFor(() => {
      expect(fn1).toBeCalled();
      expect(fn2).toBeCalled();
    });
  });

  it("Supplies AbortSignal to asyncFn and aborts it on reruns", async () => {
    const fn = vi.fn(async (param: number, { signal }: UseRequestCbOpts) => {});
    const { rerender } = renderHook((param: number) => useRequest(fn, [param]), {
      initialProps: 1
    });

    expect(fn.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(fn.mock.calls[0][1].signal.aborted).toBeFalsy();

    await act(() => rerender(2));
    await waitFor(() => {
      expect(fn.mock.calls[0][1].signal.aborted).toBeTruthy();

      expect(fn.mock.calls[1][1].signal).toBeInstanceOf(AbortSignal);
      expect(fn.mock.calls[1][1].signal.aborted).toBeFalsy();
    });
  });

  it("Skips initial run if corresponding flag is provided", async () => {
    const fn = vi.fn(async (param: number) => param);
    const { rerender } = renderHook(
      (param: number) => useRequest(fn, [param], { skipFirstRun: true }),
      { initialProps: 1 }
    );
    expect(fn).not.toBeCalled();
    await act(() => rerender(2));
    expect(fn).toBeCalledWith(2, expect.anything());
  });

  it("Runs immediately if no skip initial run flag is provided", async () => {
    const fn = vi.fn(async (param: number) => param);
    await act(() => {
      renderHook(
        (param: number) => useRequest(fn, [param], { skipFirstRun: false }),
        { initialProps: 1 }
      );
    });
    expect(fn).toBeCalled();
    expect(fn).toBeCalledWith(1, expect.anything());
  });
});