import { Reducer, useReducer } from "react";

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

export function useAsyncState<T>(initialValue?: Promise<T> | Awaited<T>) {
  const initialState: AsyncState<T> = initialValue === undefined ? ({
    loading: false,
    error: null,
    result: null,
    promise: null,
  }) : initialValue instanceof Promise ? ({
    loading: true,
    error: null,
    result: null,
    promise: initialValue,
  }) : ({
    loading: false,
    error: null,
    result: initialValue,
    promise: Promise.resolve(initialValue),
  });

  return useReducer(
    asyncStateReducer as Reducer<AsyncState<T>, Action<T>>,
    initialState
  );
}

type Action<T> = {
  type: "LOADING";
  payload: Promise<T>;
} | {
  type: "ERROR";
  payload?: unknown;
} | {
  type: "RESULT";
  payload: Awaited<T>;
} | {
  type: "SYNC-RESULT";
  payload: Awaited<T>;
}

export function asyncStateReducer<T>(state: AsyncState<T>, action: Action<T>): AsyncState<T> {
  switch (action.type) {
  case "LOADING":
    return {
      loading: true,
      result: null,
      error: null,
      promise: action.payload,
    };
  case "ERROR":
    return {
      ...state,
      loading: false,
      result: null,
      error: action.payload,
    };
  case "RESULT":
    return {
      ...state,
      loading: false,
      result: action.payload,
      error: null,
    };
  case "SYNC-RESULT":
    return {
      loading: false,
      result: action.payload,
      error: null,
      promise: Promise.resolve(action.payload),
    };
  default:
    return state;
  }
}