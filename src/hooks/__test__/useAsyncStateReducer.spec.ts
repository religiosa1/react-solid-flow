import { describe, it, expect } from "vitest";

import { asyncStateReducer } from "../useAsyncStateReducer";

const initialState = {
  loading: false,
  result: null,
  error: null,
  promise: null
}

describe("useAsyncStateReducer", () => {
  it("incorrect dispatches does not resolve in state update", () => {
    //@ts-expect-error
    const result = asyncStateReducer("test", { type: "foo" });
    expect(result).toBe("test");
  });

  it("doesn't allow nullish error dispatches", () => {
    const result = asyncStateReducer(initialState, { type: "ERROR", payload: null });
    expect(result.error).not.toBeNull();
    result.promise?.catch(() => {});
  });

  it("handles incorrect state transitions from initial loading inactive state", () => {
    const result = asyncStateReducer(initialState, { type: "RESULT", payload: 123 });
    expect(result.promise).toBeInstanceOf(Promise);
  });
});