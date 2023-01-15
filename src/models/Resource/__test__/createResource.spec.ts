import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { Resource, defaultStorage, PromiseControls } from "..";
import { createResource } from "../createResource";

describe("createResource", () => {
  let storage: Map<Promise<any>, PromiseControls>;
  beforeEach(() => {
    storage = new Map<Promise<any>, PromiseControls>();
  });
  afterEach(() => {
    storage.clear();
  });

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