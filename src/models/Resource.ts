import { defaultStorage, IResourceStorage, PromiseControls } from "./ResourceStorage";
import { AbortError } from "./AbortError";

export interface ResourceLike<T> {
  /** Is new data currently loading */
  loading?: boolean;
  /** Resolved resource data for sync access
   *
   * Don't use it inside of a suspense, use function-accessor instead. This
   * field just resolves in undefined, without suspending the suspense.
   */
  data: Awaited<T> | undefined;
  /** Rejected resource error */
  error: any;
}

export type ResourceState = "unresolved" | "pending" | "ready" | "refreshing" | "errored";
export interface Resource<T> extends ResourceLike<T> {
  /** State name
   *
   * | state      | data  | loading | error |
   * |:-----------|:-----:|:-------:|:-----:|
   * | unresolved | No    | No      | No    |
   * | pending    | No    | Yes     | No    |
   * | ready      | Yes   | No      | No    |
   * | refreshing | Yes   | Yes     | No    |
   * | errored    | No    | No      | Yes   |
   */
  state: ResourceState;
  loading: boolean;
  /** last resolved value
  *
  * This can be useful if you want to show the out-of-date data while the new
  * data is loading.
  */
  latest: Awaited<T> | undefined;
  /** A promise that resolves/rejects with the resource.
   *
   * It is NOT the same promise as the one, that was provided by the fetcher,
   * this is resource promise (mostly required for Suspense), it resolves/rejects
   * with reosurce itselfs and automatically renews when it makes sense for
   * the Suspense to not trigger reloading, depending on state transitions.
   */
  promise: Promise<T>;
  /** accessor for Suspense
   *
   * If you're using the resource in a Suspense, you __must__ call it inside,
   * the suspense. Just reading data won't cut it, as it won't suspend it.
   *
   * @example
   * ```tsx
   * const resource = useResource(fetcher);
   *
   * <Suspense fallback="loading...">
   *   {resource().someData}
   * </Suspense>
   * ```
   */
  (): T;
}

//------------------------------------------------------------------------------

/**
 * Determine resource-like state, based on its fields values.
 *
 * | state      | data  | loading | error |
 * |:-----------|:-----:|:-------:|:-----:|
 * | unresolved | No    | No      | No    |
 * | pending    | No    | Yes     | No*   |
 * | ready      | Yes   | No      | No    |
 * | refreshing | Yes   | Yes     | No*   |
 * | errored    | No*   | No      | Yes   |
 *
 * Values marked with * are expected to equal the specified value,
 * but actually ignored, when determining the status.
 */
export function getResourceStateByData(i: ResourceLike<any>): ResourceState {
  if (i.data !== undefined && i.loading) {
    return "refreshing";
  }
  if (i.loading) {
    return "pending";
  }
  if (i.error !== undefined) {
    return "errored";
  }
  if (i.data !== undefined) {
    return "ready";
  }
  return "unresolved";
}

/** Create a new resource */
export function createResource<T>(
  data?: Promise<T> | Awaited<T>,
  storage = defaultStorage
): Resource<T> {
  const isAsync = data instanceof Promise;
  const res = createResourceStub<T>(isAsync ? { loading: true } : { data });

  if (isAsync || data === undefined) {
    renew(storage, res);
  } else {
    // sync-ready, requires no controls as promise is already resolved
    res.promise = Promise.resolve(data);
  }

  return res as Resource<T>;
}


/**
 * Creating a new derived resource, representing a change in state of existing
 * resource.
 *
 * Sets its core data to its new values and performs all of the required
 * side-effects (promises resolution/rejecting/renewal, setting latest data etc.)
 *
 * @param previous source resource
 * @param data data to patch into the resource
 * @returns new resource
 */
export function nextResource<T>(previous: Resource<T>, data: {
  data?: Awaited<T>,
  loading: boolean,
  error?: any,
}, storage = defaultStorage): Resource<T> {
  const current = createResourceStub<T>(data);

  if (current.data !== undefined) {
    current.latest = current.data;
  } else {
    current.latest = previous.latest;
  }

  if (shouldRenew(current, previous)) {
    renew(storage, current);
    // some incorrect but technically possible with some direct modifications
    // and malintent state changes can result in hang up promises in storage
    // so we're cancelling them and clearing them out of storage
    // TODO explicit test cases
    if (previous.state === "pending" || previous.state === "refreshing") {
      reject(storage, previous, new AbortError());
    }
  } else {
    // otherwise, reusing the old promise, so Suspense is happy
    current.promise = previous.promise;
  }

  if (current.state === "ready") {
    resolve(storage, current);
  } else if (current.state === "errored") {
    reject(storage, current);
  }
  return current as Resource<T>;
}

 /**
  * Should the promise renew in the derived state?
  *
  * | from state | unresolved | pending | refreshing | ready | errored |
  * |:-----------|:----------:|:-------:|:-----------|:-----:|:--------|
  * | unresolved | Old        | Old     | New        | Old   | Old     |
  * | pending    | New*       | Old     | New*       | Old   | Old     |
  * | refreshing | New*       | New*    | Old        | Old   | Old     |
  * | ready      | New        | New     | New        | New   | New     |
  * | errored    | New        | New     | New        | New   | New     |
  *
  * Transitions marked with * also require previous promise cancellation
  */
function shouldRenew(
  current: { state: ResourceState },
  previous: { state: ResourceState }
): boolean {
  if (previous.state === "unresolved") {
    return current.state === "refreshing";
  }
  if (previous.state === "ready" || previous.state === "errored") {
    return true;
  }
  // previous state was pending or refreshing
  return (
    current.state === "unresolved"
    || (current.state === "refreshing" && previous.state === "pending")
    || (current.state === "pending" && previous.state === "refreshing")
  );
}

/*----------------------------------------------------------------------------*/

type ResourceStub<T> = Omit<Resource<T>, "promise"> & {
  promise: Resource<T>['promise'] | undefined
};

/** resource without the promise stuff */
function createResourceStub<T>(data?: {
  data?: Awaited<T> | undefined,
  loading?: boolean;
  error?: any;
}) {
  const res: ResourceStub<T> = function(this: ResourceStub<T>) {
    if (res.loading) {
      if (!(res.promise instanceof Promise)) {
        throw Promise.reject(new Error("incorrect resource state"));
      }
      throw res.promise;
    }
    if (res.error) {
      throw res.error;
    }
    return res.data!;
  };
  res.data = data?.data
  res.loading = !!data?.loading;
  res.error = data?.error;
  res.latest = undefined;
  res.promise = undefined;
  res.state = getResourceStateByData(res);
  return res;
}

function renew<T>(storage: IResourceStorage, res: ResourceStub<T>): void {
  if (res.promise) {
    storage.delete(res.promise);
  }
  let controls: PromiseControls;
  const promise = new Promise<T>((resolve, reject) => {
    controls = { resolve, reject };
  });
  res.promise = promise;
  storage.set(promise, controls!);
  // making all resolve/reject automatically remove the promise from storage
  // in case someone will call controls from the storage directly
  const clear = () => storage.delete(promise);
  promise.then(clear, clear);
}

function resolve<T>(storage: IResourceStorage, res: ResourceStub<T>) {
  if (!res?.promise) {
    return;
  }
  const controls = storage.get(res.promise);
  if (controls?.resolve instanceof Function) {
    controls.resolve(res.data);
  }
}

function reject<T>(storage: IResourceStorage, res: ResourceStub<T>, error?: any) {
  if (!res?.promise) {
    return;
  }
  const controls = storage.get(res.promise);
  if (controls?.reject instanceof Function) {
    controls.reject(error ?? res.error);
  }
}