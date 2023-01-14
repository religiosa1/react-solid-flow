import { Resource, createResource, nextResource } from "../models/Resource";
import { useReducer, Reducer} from "react";
import { NullishError } from "../models/NullishError";

export function useResourceReducer<T>(
  initialValue?: Awaited<T> | (() => Awaited<T>)
) {
  return useReducer(
    resourceReducer as Reducer<Resource<T>, Action<T>>,
    initialValue,
    resourceInitializer,
  );
}

function resourceInitializer<T>(val?: Awaited<T> | (() => Awaited<T>)): Resource<T> {
  const value = val instanceof Function ? val() : val;
  return createResource(value);
}

type Action<T> =
  | { type: "PEND" /* -> "pending" | "refreshing" */ }
  | { type: "RESOLVE" /* -> "ready" */, payload: Awaited<T> }
  | { type: "SYNC-RESULT" /* -> "ready" */, payload: Awaited<T> }
  | { type: "REJECT" /* -> "errored" */, payload: any }

export function resourceReducer<T>(state: Resource<T>, action: Action<T>): Resource<T> {
  switch (action?.type) {
    case "PEND":
      return nextResource(state, {
        loading: true,
        error: undefined,
        data: state.data,
      });
    case "RESOLVE":
      return nextResource(state, {
        loading: false,
        error: undefined,
        data: action.payload,
      });
    case "SYNC-RESULT":
      return nextResource(state, {
        loading: false,
        error: undefined,
        data: action.payload,
      });
    case "REJECT":
      return nextResource(state, {
        loading: false,
        error: action.payload ?? new NullishError(),
        data: undefined,
      });
    default:
      return state;
  }
}
