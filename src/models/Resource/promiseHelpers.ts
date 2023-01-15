import { IResourceStorage, PromiseControls } from "./ResourceStorage";
import { ResourceStub } from "./resourceStub";

export function renew<T>(storage: IResourceStorage, res: ResourceStub<T>): void {
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

export function resolve<T>(storage: IResourceStorage, res: ResourceStub<T>) {
  if (!res?.promise) {
    return;
  }
  const controls = storage.get(res.promise);
  if (controls?.resolve instanceof Function) {
    controls.resolve(res.data);
  }
}

export function reject<T>(storage: IResourceStorage, res: ResourceStub<T>, error?: any) {
  if (!res?.promise) {
    return;
  }
  const controls = storage.get(res.promise);
  if (controls?.reject instanceof Function) {
    controls.reject(error ?? res.error);
  }
}