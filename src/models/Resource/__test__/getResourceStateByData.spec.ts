import { describe, it, expect } from "vitest";
import { getResourceStateByData } from "../getResourceStateByData";

/*
 * | state      | data  | loading | error |
 * |:-----------|:-----:|:-------:|:-----:|
 * | unresolved | No    | No      | No    |
 * | pending    | No    | Yes     | No*   |
 * | ready      | Yes   | No      | No    |
 * | refreshing | Yes   | Yes     | No*   |
 * | errored    | No*   | No      | Yes   |
 */
describe("getResourceStateByData", () => {
  // we're using falsy values where possible, to check that they're told apart
  // from undefined correctly
  it("determines unresolved state", () => {
    expect(getResourceStateByData({
      data: undefined,
      loading: false,
      error: undefined,
    })).toBe("unresolved");
  });

  it("determines pending state", () => {
    expect(getResourceStateByData({
      data: undefined,
      loading: true,
      error: undefined,
    })).toBe("pending");
  });

  it("incorrectly reset error + loading still results in pending state", () => {
    // Though this example is impossible in this code, we still have this test
    // in case it was called on some 3d party implementation of Resource-like object.
    expect(getResourceStateByData({
      data: undefined,
      loading: true,
      error: false,
    })).toBe("pending");
  });

  it("determines ready state", () => {
    expect(getResourceStateByData({
      data: false,
      loading: false,
      error: undefined,
    })).toBe("ready");
  });

  it("determines refreshing state", () => {
    expect(getResourceStateByData({
      data: false,
      loading: true,
      error: undefined,
    })).toBe("refreshing");
  });

  it("determines refreshing state with incorrectly set error", () => {
    expect(getResourceStateByData({
      data: false,
      loading: true,
      error: false,
    })).toBe("refreshing");
  });

  it("determines errored state", () => {
    expect(getResourceStateByData({
      data: null,
      loading: false,
      error: false,
    })).toBe("errored");
  });

  it("data + error results in errored state", () => {
    expect(getResourceStateByData({
      data: true,
      loading: false,
      error: false,
    })).toBe("errored");
  });
});
