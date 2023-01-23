import { describe, expect, it, vi } from "vitest";
import { Resource } from "../Resource";

describe("useResource", () => {
  describe("Resource.constructor", () => {
    it("creates an empty resource", () => {
      const res = new Resource();
      expect(res).toEqual({
        state: "unresolved",
        data: undefined,
        loading: false,
        error: undefined,
        latest: undefined,
      });
    });

    it("correctly sets core data", () => {
      const res = new Resource({
        data: "test1",
        loading: true,
        error: "test2",
      });
      expect(res.data).toBe("test1");
      expect(res.loading).toBe(true);
      expect(res.error).toBe("test2");
    });

    it("keeps latest data from previous resource", () => {
      let res = new Resource({
        data: "test1",
        loading: false,
        error: undefined,
      });
      res = new Resource({
        data: undefined,
        loading: true,
      }, res);
      res = new Resource({
        ...res,
        data: undefined,
        loading: false,
        error: "test2",
      }, res);
      expect(res.latest).toBe("test1");
    });

    it("updates resource state name with getState function", () => {
      const speGetState = vi.spyOn(Resource, "getState");
      let res = new Resource<string>({
        data: undefined,
        loading: true,
        error: undefined,
      });
      expect(res.state).toBe("pending");
      expect(speGetState).toBeCalledTimes(1);
      res = new Resource({
        data: "test",
        loading: false,
        error: undefined,
      }, res);
      expect(res.state).toBe("ready");
      expect(speGetState).toBeCalledTimes(2);
    });
  });

  describe("Resource.from", () => {
    it("creates a resource from sync data", () => {
      const res = Resource.from("test");
      expect(res).toEqual({
        data: "test",
        loading: false,
        error: undefined,
        latest: "test",
        state: "ready"
      });
      expect(res).toBeInstanceOf(Resource);
    });

    it("creates a resource with async data", () => {
      const res = Resource.from(Promise.resolve());
      expect(res).toEqual({
        data: undefined,
        loading: true,
        error: undefined,
        latest: undefined,
        state: "pending",
      });
      expect(res).toBeInstanceOf(Resource);
    });
  });

  /*
   * | state      | data  | loading | error |
   * |:-----------|:-----:|:-------:|:-----:|
   * | unresolved | No    | No      | No    |
   * | pending    | No    | Yes     | No*   |
   * | ready      | Yes   | No      | No    |
   * | refreshing | Yes   | Yes     | No*   |
   * | errored    | No*   | No      | Yes   |
   */
  describe("Resource.getState", () => {
    // we're using falsy values where possible, to check that they're told apart
    // from undefined correctly
    it("determines unresolved state", () => {
      expect(Resource.getState({
        data: undefined,
        loading: false,
        error: undefined,
      })).toBe("unresolved");
    });

    it("determines pending state", () => {
      expect(Resource.getState({
        data: undefined,
        loading: true,
        error: undefined,
      })).toBe("pending");
    });

    it("incorrectly reset error + loading still results in pending state", () => {
      // Though this example is impossible in this code, we still have this test
      // in case it was called on some 3d party implementation of Resource-like object.
      expect(Resource.getState({
        data: undefined,
        loading: true,
        error: false,
      })).toBe("pending");
    });

    it("determines ready state", () => {
      expect(Resource.getState({
        data: false,
        loading: false,
        error: undefined,
      })).toBe("ready");
    });

    it("determines refreshing state", () => {
      expect(Resource.getState({
        data: false,
        loading: true,
        error: undefined,
      })).toBe("refreshing");
    });

    it("determines refreshing state with incorrectly set error", () => {
      expect(Resource.getState({
        data: false,
        loading: true,
        error: false,
      })).toBe("refreshing");
    });

    it("determines errored state", () => {
      expect(Resource.getState({
        data: null,
        loading: false,
        error: false,
      })).toBe("errored");
    });

    it("data + error results in errored state", () => {
      expect(Resource.getState({
        data: true,
        loading: false,
        error: false,
      })).toBe("errored");
    });
  });
});
