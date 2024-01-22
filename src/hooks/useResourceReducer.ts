import { Resource } from "../models/Resource";
import { useReducer, Reducer } from "react";
import { NullishError } from "../models/NullishError";
import type { Initializer } from "../models/Initializer";

export function useResourceReducer<T>(
  initialValue?: Initializer<Awaited<T>>,
  skipFirstRun?: boolean,
) {
  return useReducer(
    resourceReducer as Reducer<Resource<T>, Action<T>>,
    [initialValue, skipFirstRun] as const,
    resourceInitializer,
  );
}

function resourceInitializer<T>(init: readonly [
  val: Initializer<Awaited<T>> | undefined,
  skip: boolean | undefined,
]): Resource<T> {
  const [val, skip = false] = init;
  const value = (typeof val === "function") ? val() : val;
  return Resource.from(value, !skip);
}

type Action<T> =
  | { type: "PEND" /* -> "pending" | "refreshing" */ }
  | { type: "RESOLVE" /* -> "ready" */, payload: Awaited<T> }
  | { type: "SYNC-RESULT" /* -> "ready" */, payload: Awaited<T> }
  | { type: "REJECT" /* -> "errored" */, payload: any }

export function resourceReducer<T>(resource: Resource<T>, action: Action<T>): Resource<T> {
  const type = action?.type;
  switch (type) {
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
          { cause: action.payload },
        ),
        data: undefined,
      }, resource);
    default:
      assertExhaustiveState(type);
  }
}

function assertExhaustiveState(_: never): never {
  throw new Error("Invalid action type");
}
