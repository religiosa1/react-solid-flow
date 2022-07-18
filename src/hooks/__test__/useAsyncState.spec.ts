import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useAsyncState } from "../useAsyncState";

describe("useAsyncState", () => {
  it("incorrect dispatches does not resolve in state update", () => {
    const { result } = renderHook(() => useAsyncState());
    const [ state, dispatch ] = result.current;
    //@ts-expect-error
    act(() => dispatch("foo"));
    expect(state).toBe(result.current[0]);
  });
});