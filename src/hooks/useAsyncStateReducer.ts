import { Reducer, useReducer } from "react";
import { AsyncState } from "../models/AsyncState";
import { NullishError } from "../models/NullishError";

type AsyncStateInit<T> = (() => Promise<T> | Awaited<T>) | Promise<T> | Awaited<T>;

export function useAsyncStateReducer<T>(
  initialValue?: AsyncStateInit<T>
) {
  return useReducer(
    asyncStateReducer as Reducer<AsyncState<T>, Action<T>>,
    initialValue,
    asyncStateInitializer
  );
}

function asyncStateInitializer<T>(init?: AsyncStateInit<T>): AsyncState<T> {
  const initialValue = init instanceof Function ? init() : init;
  if (initialValue === undefined) {
    return {
      loading: false,
      error: null,
      result: null,
      promise: null,
    };
  }
  if (initialValue instanceof Promise) {
    return {
      loading: true,
      error: null,
      result: null,
      promise: initialValue,
    };
  }
  return {
    loading: false,
    error: null,
    result: initialValue,
    promise: Promise.resolve(initialValue),
  };
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
      loading: false,
      result: null,
      error: action.payload != null ? action.payload : new NullishError(),
      promise: state.promise instanceof Promise ? state.promise : Promise.reject(action.payload),
    };
  case "RESULT":
    return {
      loading: false,
      result: action.payload,
      error: null,
      promise: state.promise instanceof Promise ? state.promise : Promise.resolve(action.payload),
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