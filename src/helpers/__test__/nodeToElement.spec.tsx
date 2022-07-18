import { describe, it, expect } from "vitest";
import { nodeToElement } from "../nodeToElement";
import { isValidElement } from "react";

describe("nodeToElement helper", () => {
  it("returns null on nullish input", () => {
    const result = nodeToElement(undefined);
    expect(result).toBe(null);
    const result2 = nodeToElement(null);
    expect(result2).toBe(null);
  });

  it("return original element, if it's an element", () => {
    const span = <span />
    const result = nodeToElement(span);
    expect(result).toBe(span);
  });

  it("turns strings and different nodes into an element", () => {
    const item = "test";
    const result = nodeToElement(item);
    expect(isValidElement(item)).toBe(false);
    expect(isValidElement(result)).toBe(true);
  });
});