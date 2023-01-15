
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