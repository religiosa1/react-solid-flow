import { describe, it, expect } from "vitest";
import { nextResource, createResource, getResourceStateByData, Resource } from "../Resource";
import { defaultStorage, PromiseControls } from "../ResourceStorage";

describe("resource", () => {
  let storage: Map<Promise<any>, PromiseControls>;
  beforeEach(() => {
    storage = new Map<Promise<any>, PromiseControls>();
  });
  afterEach(() => {
    storage.clear();
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

  describe("resource", () => {
    it("returns data on resolved resource", () => {
      const res = nextResource(createResource(), {
        data: "1234",
        loading: false,
        error: undefined,
      });
      const data = res();
      expect(data).toBe("1234");
    });

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

  describe("createResource", () => {
    const stripData = <T>(res: Resource<T>) => ({
      data: res.data,
      loading: res.loading,
      latest: res.latest,
      error: res.error,
      promise: res.promise
    });

    it("creates a resource with sync data", () => {
      const res = createResource("test", storage);
      expect(stripData(res)).toEqual({
        data: "test",
        loading: false,
        error: undefined,
        latest: undefined,
        promise: expect.any(Promise),
      });

      expect(res.promise).toBeInstanceOf(Promise);
      expect(storage.has(res.promise)).toBeFalsy();
      expect(res.promise).resolves.toBe("test");
    });

    it("creates a resource with async data", () => {
      const res = createResource(new Promise(() => {}), storage);
      expect(stripData(res)).toEqual({
        data: undefined,
        loading: true,
        error: undefined,
        latest: undefined,
        promise: expect.any(Promise),
      });
      expect(storage.has(res.promise)).toBeTruthy();
    });

    it("creates an empty resource", () => {
      const res = createResource(undefined, storage);
      expect(stripData(res)).toEqual({
        data: undefined,
        loading: false,
        error: undefined,
        latest: undefined,
        promise: expect.any(Promise),
      });
      expect(storage.has(res.promise)).toBeTruthy();
    });

    it("correctly fills the default storage", () => {
      const res = createResource(new Promise(() => {}));
      expect(stripData(res)).toEqual({
        data: undefined,
        loading: true,
        error: undefined,
        latest: undefined,
        promise: expect.any(Promise),
      });
      expect((defaultStorage as WeakMap<any, any>).has(res.promise)).toBeTruthy();
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

    it("resolves the promise on sync data updates", async () => {
      let res = nextResource(createResource<string>(undefined, storage), {
        data: undefined,
        loading: false,
        error: undefined,
      }, storage);
      res = nextResource(res, {
        data: "test1",
        loading: false,
        error: undefined,
      }, storage);
      expect(storage.has(res.promise)).toBeTruthy();
      await expect(res.promise).resolves.toBe("test1");
      expect(storage.has(res.promise)).toBeFalsy();
    });

    it("rejects the promise, if advanced from loaded state with data", async () => {
      let res = nextResource(createResource<boolean>(undefined, storage), {
        data: undefined,
        loading: true,
        error: undefined,
      }, storage);
      res = nextResource(res, {
        data: undefined,
        loading: false,
        error: "test2",
      }, storage);
      expect(storage.has(res.promise)).toBeTruthy();
      await expect(res.promise).rejects.toThrow("test2");
      expect(storage.has(res.promise)).toBeFalsy();
    });

    it("rejects the promise on sync errors", async () => {
      let res = nextResource(createResource<boolean>(undefined, storage), {
        data: undefined,
        loading: false,
        error: undefined,
      }, storage);
      res = nextResource(res, {
        data: undefined,
        loading: false,
        error: "test2",
      }, storage);
      expect(storage.has(res.promise)).toBeTruthy();
      await expect(res.promise).rejects.toThrow("test2");
      expect(storage.has(res.promise)).toBeFalsy();
    });
  });

  describe("resource promise", () => {
    // TODO double resolve/reject avoidance test?

    const getAllPossibleResourcePromises = (base: Resource<string>) => ({
      refreshing: nextResource(base, { data: "1234567", loading: true,  error: undefined }).promise,
      pending:    nextResource(base, { data: undefined, loading: true,  error: undefined }).promise,
      ready:      nextResource(base, { data: "1234567", loading: false, error: undefined }).promise,
      errored:    nextResource(base, { data: undefined, loading: false, error: "1234567" }).promise,
      unresolved: nextResource(base, { data: undefined, loading: false, error: undefined }).promise,
    });

    it("from unresolved state only refreshing result in promise renewal", () => {
      const res = nextResource(createResource<string>(), {
        data: undefined,
        loading: false,
        error: undefined,
      });
      const prmss = getAllPossibleResourcePromises(res);

      expect(prmss.pending).toBe(res.promise);
      expect(prmss.ready).toBe(res.promise);
      expect(prmss.refreshing).not.toBe(res.promise);
      expect(prmss.errored).toBe(res.promise);
      expect(prmss.unresolved).toBe(res.promise);
    });

    it("from pending state only unresolved and refreshing renew the promise", () => {
      const res = nextResource(createResource<string>(), {
        data: undefined,
        loading: true,
        error: undefined,
      });
      const prmss = getAllPossibleResourcePromises(res);

      expect(prmss.pending).toBe(res.promise);
      expect(prmss.ready).toBe(res.promise);
      expect(prmss.refreshing).not.toBe(res.promise);
      expect(prmss.errored).toBe(res.promise);
      expect(prmss.unresolved).not.toBe(res.promise);
    });

    it("from refreshing state only pending and unresolved renew a promise", () => {
      const res = nextResource(createResource<string>(), {
        data: "23123",
        loading: true,
        error: undefined,
      });
      const prmss = getAllPossibleResourcePromises(res);

      expect(prmss.pending).not.toBe(res.promise);
      expect(prmss.ready).toBe(res.promise);
      expect(prmss.refreshing).toBe(res.promise);
      expect(prmss.errored).toBe(res.promise);
      expect(prmss.unresolved).not.toBe(res.promise);
    });

    it("any state derived from ready or errored has a new promise", () => {
      const resReady = nextResource(createResource<string>(), {
        data: "1asdf",
        loading: false,
        error: undefined,
      });
      const prmssReady = getAllPossibleResourcePromises(resReady);

      const resErrored = nextResource(createResource<string>(), {
        data: undefined,
        loading: false,
        error: "adsf",
      });
      const prmssErrored = getAllPossibleResourcePromises(resErrored);

      const notTheSame = (target: Promise<string>) =>
        (collection: Record<string, Promise<string>>) =>
          Object.values(collection).every(item => item !== target);

      expect(prmssReady).toSatisfy(notTheSame(resReady.promise));
      expect(prmssErrored).toSatisfy(notTheSame(resErrored.promise));
    });
  });
});
