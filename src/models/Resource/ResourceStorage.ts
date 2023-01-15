export interface PromiseControls {
  resolve(val: any): void;
  reject(val: any): void;
}

/** Resource promise storage interface
 *
 * For correct work inside of a Suspense, we must keep the same promise,
 * which means, we keep all them in the storage with their resolve and reject
 * functions to be called whenever it's needed.
 *
 * Intended purpose is to use a WeakMap, but it can be overriden with something
 * else that you feel is suitable, just be sure you won't leak memory here.
 */
export interface IResourceStorage {
  set: (item: Promise<any>, value: PromiseControls) => any;
  get: (item: Promise<any>) => PromiseControls | undefined;
  delete: (item: Promise<any>) => any;
}

export class ResourceStorage extends WeakMap<
  Promise<any>,
  PromiseControls
> implements IResourceStorage {}

export const defaultStorage: IResourceStorage = new ResourceStorage();