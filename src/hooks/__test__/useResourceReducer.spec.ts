import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useResourceReducer } from "../useResourceReducer";
import { NullishError } from "../../models/NullishError";

describe("useResourceReducer", () => {
  it("returns the initial state", () => {
    const { result } = renderHook(() => useResourceReducer<boolean>());
    const [ resource, dispatch ] = result.current;
    expect(resource.loading).toBe(true);
    expect(resource.data).toBeUndefined();
    expect(resource.error).toBeUndefined();
    expect(resource.latest).toBeUndefined();
    expect(resource.state).toBe('pending');
    expect(dispatch).toBeInstanceOf(Function);
  });

  it("accepts static sync initializer", () => {
    const { result } = renderHook(() => useResourceReducer<boolean>(true));
    const [ resource ] = result.current;
    expect(resource.loading).toBe(true);
    expect(resource.data).toBe(true);
    expect(resource.state).toBe('refreshing');
  });

  it("accepts defered sync initializer", () => {
    const { result } = renderHook(() => useResourceReducer<boolean>(() => false));
    const [ resource ] = result.current;
    expect(resource.loading).toBe(true);
    expect(resource.data).toBe(false);
    expect(resource.state).toBe('refreshing');
  });

  it("allows to change state to pending", () => {
    const { result } = renderHook(() => useResourceReducer<boolean>());
    const [ , dispatch ] = result.current;
    act(() => dispatch({ type: "PEND" }));
    const [ resource ] = result.current;
    expect(resource.loading).toBe(true);
    expect(resource.data).toBeUndefined();
    expect(resource.error).toBeUndefined();
    expect(resource.latest).toBeUndefined();
    expect(resource.state).toBe('pending');
  });

  it("allows to resolve pending state", async () => {
    const { result } = renderHook(() => useResourceReducer<boolean>());
    const [ , dispatch ] = result.current;
    act(() => {
      dispatch({ type: "PEND" });
      dispatch({ type: "RESOLVE", payload: true });
    });
    const [ resource ] = result.current;
    expect(resource.loading).toBe(false);
    expect(resource.data).toBe(true);
    expect(resource.error).toBeUndefined();
    expect(resource.latest).toBe(true);
    expect(resource.state).toBe('ready');
  });

  it("'ready' -> 'refreshing' by the next 'PEND' call", () => {
    const { result } = renderHook(() => useResourceReducer<boolean>());
    const [ , dispatch ] = result.current;
    act(() => {
      dispatch({ type: "PEND" });
      dispatch({ type: "RESOLVE", payload: true });
      dispatch({ type: "PEND" });
    });
    const [ resource ] = result.current;
    expect(resource.loading).toBe(true);
    expect(resource.data).toBe(true);
    expect(resource.error).toBeUndefined();
    expect(resource.latest).toBe(true);
    expect(resource.state).toBe('refreshing');
  });

  it("allows to reject pending state", async () => {
    const { result } = renderHook(() => useResourceReducer<boolean>());
    const [ , dispatch ] = result.current;
    act(() => {
      dispatch({ type: "PEND" });
      dispatch({ type: "REJECT", payload: true });
    });
    const [ resource ] = result.current;
    expect(resource.loading).toBe(false);
    expect(resource.data).toBeUndefined();
    expect(resource.error).toBe(true);
    expect(resource.latest).toBeUndefined();
    expect(resource.state).toBe('errored');
  });

  it("puts a special error type into Error on nullish rejects", async () => {
    const { result } = renderHook(() => useResourceReducer<boolean>());
    const [ , dispatch ] = result.current;
    act(() => {
      dispatch({ type: "REJECT", payload: null });
    });
    const [ resource ] = result.current;
    expect(resource.error).toBeInstanceOf(NullishError);
    expect(resource.error.cause).toBeNull();
  });

  it("does nothing  on wrong dispatch types", async () => {
    const { result } = renderHook(() => useResourceReducer<boolean>());
    const [ , dispatch ] = result.current;
    const [ initial ] = result.current;
    act(() => {
      //@ts-expect-error fake dispatch
      dispatch({ type: "FAKE", payload: true });
    });
    const [ resource ] = result.current;
    expect(resource).toBe(initial);
  });
});