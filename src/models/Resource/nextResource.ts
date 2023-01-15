import { AbortError } from "../AbortError";
import { reject, renew, resolve } from "./promiseHelpers";
import { Resource, ResourceState } from "./Resource";
import { defaultStorage } from "./ResourceStorage";
import { createResourceStub } from "./resourceStub";

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
  * | pending    | New        | Old     | New*       | Old   | Old     |
  * | refreshing | New        | New*    | Old        | Old   | Old     |
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
