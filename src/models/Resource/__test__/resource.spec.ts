import { describe, it } from "vitest";
import { createResource } from "../createResource";
import { nextResource } from "../nextResource";

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