import { Resource } from "../models/Resource";
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
  return Resource.from(value);
}

type Action<T> =
  | { type: "PEND" /* -> "pending" | "refreshing" */ }
  | { type: "RESOLVE" /* -> "ready" */, payload: Awaited<T> }
  | { type: "SYNC-RESULT" /* -> "ready" */, payload: Awaited<T> }
  | { type: "REJECT" /* -> "errored" */, payload: any }

export function resourceReducer<T>(resource: Resource<T>, action: Action<T>): Resource<T> {
  switch (action?.type) {
    case "PEND":
      return new Resource({
        loading: true,
        error: undefined,
        data: resource.data,
      }, resource);
    case "RESOLVE":
      return new Resource({
        ...resource,
        loading: false,
        error: undefined,
        data: action.payload,
      }, resource);
    case "SYNC-RESULT":
      return new Resource({
        loading: false,
        error: undefined,
        data: action.payload,
      }, resource);
    case "REJECT":
      return new Resource<T>({
        loading: false,
        error: action.payload ?? new NullishError(
          "resource rejected with a nullish error",
          { cause: action.payload }
        ),
        data: undefined,
      }, resource);
    default:
      return resource;
  }
}
