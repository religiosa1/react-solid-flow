import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import { useAsyncState } from "../useAsyncState";

describe("useAsyncState", () => {
	it("Awaits promise resolve updating state to 'loading'", async () => {
		const { result } = renderHook(() => useAsyncState());

		expect(result.current.loading).toBeFalsy();
		expect(result.current.result).toBe(null);
		expect(result.current.error).toBe(null);
		expect(result.current.promise).toBe(null);

		const prms = new Promise(() => {});
		act(() => result.current.set(prms));
		expect(result.current.loading).toBeTruthy();
		expect(result.current.result).toBe(null);
		expect(result.current.error).toBe(null);
		expect(result.current.promise).toBe(prms);
	});

	it("Stores result in state after resolve", async () => {
		const { result } = renderHook(() => useAsyncState<boolean>());
		expect(result.current.loading).toBeFalsy();
		const prms = Promise.resolve(true);
		act(() => result.current.set(prms));
		await waitFor(() => {
			expect(result.current.loading).toBeFalsy();
			expect(result.current.result).toBe(true);
			expect(result.current.error).toBe(null);
			expect(result.current.promise).toBe(prms);
		});
	});

	it("Keeps error on rejection", async () => {
		const { result } = renderHook(() => useAsyncState<boolean>());
		const rej = "REJECTION";
		const prms = Promise.reject(rej);
		act(() => result.current.set(prms));
		await waitFor(() => {
			expect(result.current.loading).toBeFalsy();
			expect(result.current.result).toBe(null);
			expect(result.current.error).toBe(rej);
			expect(result.current.promise).toBe(prms);
		});
	});

	it("Avoids race condition, correctly updating state", async () => {
		const { result } = renderHook(() => useAsyncState());
		const rv1 = "rv1";
		const rv2 = "rv2";
		let res1: (val: string) => void;
		let res2: (val: string) => void;
		const prms1 = new Promise(res => { res1 = res });
		const prms2 = new Promise(res => { res2 = res });
		act(() => {
			result.current.set(prms1);
			result.current.set(prms2);
			res2!(rv2);
			res1!(rv1);
		})
		await waitFor(() => {
			expect(result.current.loading).toBeFalsy();
			expect(result.current.result).toBe(rv2);
			expect(result.current.error).toBe(null);
			expect(result.current.promise).toBe(prms2);
		});
	});

	it("Does not update state after resolution in unmounted component", async () => {
		const { result, unmount } = renderHook(() => useAsyncState());
		expect(result.current.loading).toBeFalsy();
		let resolve: (value: boolean) => void;
		const prms = new Promise(res => { resolve = res });
		act(() => result.current.set(prms));
		unmount();
		resolve!(true)
		await waitFor(() => {
			expect(result.current.loading).toBeTruthy();
			expect(result.current.result).toBe(null);
			expect(result.current.error).toBe(null);
			expect(result.current.promise).toBe(prms);
		})
	});

	it("Does not update state after rejection in unmounted component", async () => {
		const { result, unmount } = renderHook(() => useAsyncState());
		expect(result.current.loading).toBeFalsy();
		let reject: (res: any) => void;
		const prms = new Promise((_, rej) => { reject = rej });
		act(() => { result.current.set(prms); });
		unmount();
		reject!(true);
		await waitFor(() => {
			expect(result.current.loading).toBeTruthy();
			expect(result.current.result).toBe(null);
			expect(result.current.error).toBe(null);
			expect(result.current.promise).toBe(prms);
		});
	});

	it("Allows to pass initial value as promimse", async () => {
		let resolve: (value: boolean) => void;
		const prms = new Promise((res) => { resolve = res });
		const { result } = renderHook(() => useAsyncState(prms));
		expect(result.current.loading).toBeTruthy();
		expect(result.current.result).toBe(null);
		await act(async () => {
			resolve(true);
			await prms;
		});
		expect(result.current.loading).toBeFalsy();
		expect(result.current.result).toBe(true);
	});

	it("Allows to pass initial value as a function for defered init", async () => {
		const { result } = renderHook(() => useAsyncState(() => 1));
		await waitFor(() => expect(result.current.result).toBe(1));
	});

	it("Change of initial value doesn't trigger rerender", async () => {
		const { result, rerender } = renderHook((val: number) => useAsyncState(Promise.resolve(val)), {
			initialProps: 1
		});
		await waitFor(() => expect(result.current.result).toBe(1));
		await act(() => { rerender(2) });
		expect(result.current.result).toBe(1);
	});

	it("Allows to pass initial value as a regular sync value", async () => {
		const { result } = renderHook(() => useAsyncState(true));
		expect(result.current.loading).toBe(false);
		expect(result.current.result).toBe(true);
	});

	it("Allows setting of a sync value", async () => {
		const { result } = renderHook(() => useAsyncState());
		act(() => result.current.set(1));
		expect(result.current.loading).toBeFalsy();
		expect(result.current.error).toBe(null);
		expect(result.current.result).toBe(1);
		expect(result.current.promise).toBeInstanceOf(Promise);
	});

	it("calls onComplete callback on succesfull resolve", async () => {
		const onCompleted = vi.fn((res: boolean, context: string) => {});
		let resolve: (value: boolean) => void;
		const prms = new Promise<boolean>((res) => { resolve = res });
		renderHook(() => useAsyncState(prms, {
			onCompleted,
			context: "hi Mom"
		}));
		await act(async () => {
			resolve(true);
			await prms;
		});
		expect(onCompleted).toBeCalledTimes(1);
		expect(onCompleted).toBeCalledWith(true, "hi Mom");
	});

	it("calls onError callback on rejection", async () => {
		const onError = vi.fn((res: unknown, context: string) => {});
		let reject: (val: string) => void;
		const prms = new Promise<boolean>((_, rej) => { reject = rej });
		renderHook(() => useAsyncState(prms, {
			onError,
			context: "hi Mom"
		}));
		await act(async () => {
			reject("test");
			await prms.catch(() => {});
		});
		expect(onError).toBeCalledTimes(1);
		expect(onError).toBeCalledWith("test", "hi Mom");
	});
});