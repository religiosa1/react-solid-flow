
export interface ResourceLike<T> {
  /** Is new data currently loading */
  loading?: boolean;
  /** Resolved resource data for sync access */
  data: Awaited<T> | undefined;
  /** Rejected resource error */
  error: unknown;
}

export type ResourceState = "unresolved" | "pending" | "ready" | "refreshing" | "errored";

export class Resource<T> implements ResourceLike<T> {
  loading: boolean;
  data: Awaited<T> | undefined;
  error: unknown;

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
  /** last resolved value
  *
  * This can be useful if you want to show the out-of-date data while the new
  * data is loading.
  */
  latest: Awaited<T> | undefined;

  constructor(init?: Partial<ResourceLike<T>>, previous?: { latest?: Awaited<T>}) {
    this.data = init?.data;
    this.error = init?.error;
    this.loading = !!init?.loading;

    if (this.data !== undefined) {
      this.latest = this.data;
    } else {
      this.latest = previous?.latest;
    }

    this.state = Resource.getState(this);
  }

  static from<T>(data: Promise<T> | Awaited<T> | undefined, pend?: boolean): Resource<T> {
    const isAsync = data instanceof Promise;
    return new Resource(isAsync ? {
      loading: true
    } : {
      data,
      loading: !!pend,
    });
  }

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
  static getState(r: ResourceLike<unknown>): ResourceState {
    if (r.data !== undefined && r.loading) {
      return "refreshing";
    }
    if (r.loading) {
      return "pending";
    }
    if (r.error !== undefined) {
      return "errored";
    }
    if (r.data !== undefined) {
      return "ready";
    }
    return "unresolved";
  }
}