
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

// interface AsyncStateInactive<T> {
//   loading: false;
//   error: null;
//   result: null;
//   promise: null;
// }

// interface AsyncStateLoading<T> {
//   loading: true;
//   error: null;
//   result: null;
//   promise: Promise<T>;
// }

// interface AsynsStateRejected<T> {
//   loading: false;
//   error: NonNullable<unknown>;
//   result: null;
//   promise: Promise<T>;
// }

// interface AsynsStateResolved<T> {
//   loading: false;
//   error: null;
//   result: Awaited<T>;
//   promise: Promise<T>;
// }

// export type AsyncState<T> =
//   | AsyncStateInactive<T>
//   | AsyncStateLoading<T>
//   | AsynsStateRejected<T>
//   | AsynsStateResolved<T>;