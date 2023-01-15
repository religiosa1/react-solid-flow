
import type { Resource } from "./Resource";
import { defaultStorage  } from "./ResourceStorage";

import { renew } from "./promiseHelpers";
import { createResourceStub } from "./resourceStub";

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