import { getResourceStateByData } from "./getResourceStateByData";
import { Resource } from "./Resource";

export type ResourceStub<T> = Omit<Resource<T>, "promise"> & {
  promise: Resource<T>['promise'] | undefined
};

/** resource without the promise stuff */
export function createResourceStub<T>(data?: {
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