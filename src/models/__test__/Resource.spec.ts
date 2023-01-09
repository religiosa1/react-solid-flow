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

describe("createResource", () => {
  let storage: ResourceStorage;
  beforeEach(() => {
    storage = new ResourceStorage();
  });

  it("creates a resource with sync data", () => {
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

describe("nextResource", () => {
  it("correctly updates core data", () => {
    let res = nextResource(createResource<string>(), {
      data: "test1",
      loading: true,
      error: "test2",
    });
    expect(res.data).toBe("test1");
    expect(res.loading).toBe(true);
    expect(res.error).toBe("test2");
  });

  it("keeps latest data in the state", () => {
    let res = nextResource(createResource<string>(), {
      data: "test1",
      loading: false,
      error: undefined,
    });
    res = nextResource(res, {
      data: undefined,
      loading: true,
      error: undefined,
    });
    res = nextResource(res, {
      data: undefined,
      loading: false,
      error: "test2",
    });
    res.promise.catch(() => {});
    expect(res.latest).toBe("test1");
  });

  it("keeps the same promise if loading state keeps to be false", () => {
    let res = nextResource(createResource<string>(), {
      data: undefined,
      loading: false,
      error: undefined,
    });
    const prms1 = res.promise;
    res = nextResource(res, {
      data: "test",
      loading: false,
      error: undefined,
    });
    const prms2 = res.promise;
    expect(prms1).toBe(prms2);
  });

  it("updates resource state name", () => {
    let res = nextResource(createResource<string>(), {
      data: undefined,
      loading: true,
      error: undefined,
    });
    expect(res.state).toBe("pending")
    res = nextResource(res, {
      data: "test",
      loading: false,
      error: undefined,
    });
    expect(res.state).toBe("ready")
  });

  it("keeps the same promise if loading state keeps to be true", () => {
    let res = nextResource(createResource<string>(), {
      data: undefined,
      loading: true,
      error: undefined,
    });
    const prms1 = res.promise;
    res = nextResource(res, {
      data: "test",
      loading: true,
      error: undefined,
    });
    const prms2 = res.promise;
    expect(prms1).toBe(prms2);
  });

  it("creates a new promise, if loading was swiched from false to true", () => {
    let res = nextResource(createResource<string>(), {
      data: undefined,
      loading: false,
      error: undefined,
    });
    const prms1 = res.promise;
    res = nextResource(res, {
      data: undefined,
      loading: true,
      error: undefined,
    });
    const prms2 = res.promise;
    expect(prms1).not.toBe(prms2);
  });

  it("resolves the promise, if advanced from loaded state with data", async () => {
    let res = nextResource(createResource<string>(), {
      data: undefined,
      loading: true,
      error: undefined,
    });
    res = nextResource(res, {
      data: "test1",
      loading: false,
      error: undefined,
    });

    await expect(res.promise).resolves.toBe("test1");
  });

  it("rejects the promise, if advanced from loaded state with data", async () => {
    let res = nextResource(createResource<boolean>(), {
      data: undefined,
      loading: true,
      error: undefined,
    });
    res = nextResource(res, {
      data: undefined,
      loading: false,
      error: "test2",
    });

    await expect(res.promise).rejects.toThrow("test2");
  });
});

describe("resource", () => {
  it("resource throws a promise on call, if it is in the loading state", () => {
    const res = nextResource(createResource(), {
      data: undefined,
      loading: true,
      error: undefined,
    });
    expect(() => res()).toThrow(Promise);
  });

  it("resource throws an error on call, if it is has some error", () => {
    const res = nextResource(createResource(), {
      data: undefined,
      loading: false,
      error: "test",
    });
    expect(() => res()).toThrow("test");
  });

  it("resource throws a promise if it's loading and has an error simultaneously", () => {
    const res = nextResource(createResource(), {
      data: undefined,
      loading: true,
      error: true,
    });
    expect(() => res()).toThrow(Promise);
  });

  it("if someone tampered with the resource promise, it still behaves ok", async () => {
    const res = nextResource(createResource(), {
      data: undefined,
      loading: true,
      error: false,
    });
    //@ts-expect-error
    res.promise = null;
    try {
      res();
    } catch(e) {
      // throws a promise, that rejects
      await expect(e).rejects.toThrow("incorrect resource state");
    }
  });
})