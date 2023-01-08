export interface AsyncState<T> {
  /** Pending state */
  loading: boolean;
  /** Contains error, if async state rejected */
  error: unknown | null;
  /** Contains result, if async state succesfully resolved */
  result: Awaited<T> | null;
  /** Original promise */
  promise: Promise<T> | null;
}
