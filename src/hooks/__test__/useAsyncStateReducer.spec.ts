import { describe, it, expect } from "vitest";

import { asyncStateReducer } from "../useAsyncStateReducer";

describe("useAsyncStateReducer", () => {
  it("incorrect dispatches does not resolve in state update", () => {
    //@ts-expect-error
    const result = asyncStateReducer("test", { type: "foo" });
    expect(result).toBe("test");
  });
});