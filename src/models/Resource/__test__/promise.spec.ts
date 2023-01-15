import { Resource } from "..";
import { createResource } from "../createResource";
import { nextResource } from "../nextResource";

describe("resource promise", () => {
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