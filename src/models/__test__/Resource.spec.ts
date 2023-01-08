import { describe, it, expect } from "vitest";
import { nextResource, createResource, getResourceStateByData } from "../Resource";
import { defaultStorage, ResourceStorage } from "../ResourceStorage";

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
      error: true,
    })).toBe("pending");
  });

  it("determines ready state", () => {
    expect(getResourceStateByData({
      data: true,
      loading: false,
      error: undefined,
    })).toBe("ready");
  });

  it("determines refreshing state", () => {
    expect(getResourceStateByData({
      data: true,
      loading: true,
      error: undefined,
    })).toBe("refreshing");
  });

  it("determines refreshing state with incorrectly set error", () => {
    expect(getResourceStateByData({
      data: true,
      loading: true,
      error: true,
    })).toBe("refreshing");
  });

  it("determines errored state", () => {
    expect(getResourceStateByData({
      data: null,
      loading: false,
      error: true,
    })).toBe("errored");
  });

  it("data + error results in errored state", () => {
    expect(getResourceStateByData({
      data: true,
      loading: false,
      error: true,
    })).toBe("errored");
  });
});

describe("createResource", () => {
  let storage: ResourceStorage;
  beforeEach(() => {
    storage = new ResourceStorage();
  });

  it("creates a resource with sync data", async () => {
    const res = createResource("test", storage);
    expect(res.data).toBe("test");
    expect(res.loading).toBe(false);
    expect(res.error).toBeUndefined();
    expect(res.latest).toBeUndefined();
    expect(res.promise).toBeInstanceOf(Promise);
    expect(storage.has(res.promise)).toBeFalsy();
    expect(res.promise).resolves.toBe("test");
  });

  it("creates a resource with async data", () => {
    const res = createResource(new Promise(() => {}), storage);
    expect(res.data).toBeUndefined();
    expect(res.loading).toBe(true);
    expect(res.error).toBeUndefined();
    expect(res.latest).toBeUndefined();
    expect(res.promise).toBeInstanceOf(Promise);
    expect(storage.has(res.promise)).toBeTruthy();
  });

  it("correctly fills the default storage", () => {
    const res = createResource(new Promise(() => {}));
    expect(res.data).toBeUndefined();
    expect(res.loading).toBe(true);
    expect(res.error).toBeUndefined();
    expect(res.latest).toBeUndefined();
    expect(res.promise).toBeInstanceOf(Promise);
    expect((defaultStorage as WeakMap<any, any>).has(res.promise)).toBeTruthy();
  });


  it("creates an empty resource", () => {
    const res = createResource(undefined, storage);
    expect(res.data).toBeUndefined();
    expect(res.loading).toBe(false);
    expect(res.error).toBeUndefined();
    expect(res.latest).toBeUndefined();
    expect(res.promise).toBeInstanceOf(Promise);
    expect(storage.has(res.promise)).toBeTruthy();
  });
});

describe("advanceResource", () => {
  // TODO nextResource test cases!!!
});

describe("resource", () => {
  it("resource throws a promise on call, if it is in the loading state", () => {
    const res = nextResource(
      createResource(),
      { data: undefined, loading: true, error: undefined
    });
    expect(() => res()).toThrow(Promise);
  });

  it("resource throws an error on call, if it is has some error", () => {
    const res = nextResource(
      createResource(),
      { data: undefined, loading: false, error: "test"
    });
    expect(() => res()).toThrow("test");
  });

  it("resource throws a promise if it's loading and has an error simultaneously", () => {
    const res = nextResource(
      createResource(),
      { data: undefined, loading: true, error: true
    });
    expect(() => res()).toThrow(Promise);
  });

  it("if someone tampered with the resource's promise, it still behaves ok", () => {
    const res = nextResource(
      createResource(),
      { data: undefined, loading: true, error: false
    });
    //@ts-expect-error
    res.promise = null;
    expect(() => res()).toThrow(Promise);
  });
})