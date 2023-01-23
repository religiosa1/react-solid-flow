import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderProp } from "../renderProp";

describe("renderProp helper", () => {
  it("returns render prop call result if it's a function", () => {
    const span = <span>123</span>;
    const f = vi.fn(() => span);
    const result = renderProp(f);
    expect(result).toBe(span);
  });

  it("calls render props as-is if it is not a function", () => {
    const span = <span>123</span>;
    const result = renderProp(span);
    expect(result).toBe(span);
  });

  it("passes supplied arguments to the render prop function", () => {
    const f = vi.fn((val: number, val2: number) => <span>{val + val2}</span>);
    renderProp(f, 2, 3);
    expect(f).toBeCalledWith(2, 3);
  });
});