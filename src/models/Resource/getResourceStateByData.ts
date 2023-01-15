import { ResourceLike, ResourceState } from "./Resource";
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