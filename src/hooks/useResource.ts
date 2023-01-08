import { useCallback, useMemo } from "react";
import type { Resource } from "../models/Resource";
import { useResourceReducer } from "./useResourceReducer";

type ResourceReturn<T> = [
  Readonly<Resource<T>>,
  {
    mutate: (v: Awaited<T>) => void;
    refetch: (info: unknown) => Promise<T> | T;
  }
];

export type ResourceOptions<T, TContext = never> = {
  initialValue?: Promise<T> | Awaited<T> | (() => Promise<T> | Awaited<T>);
  /** resolve callback */
  onCompleted?: (data: Awaited<T>, context: TContext) => void;
  /** rejection callback */
  onError?: (error: unknown, context: TContext) => void;
  // deferStream?: boolean;
  // storage?: (init: T | undefined) => [Accessor<T | undefined>, Setter<T | undefined>];
  // ssrLoadFrom?: "initial" | "server";
};

export function useResource<T, TArgs extends readonly any[], TContext = never>(
  // FIXME signature, deps is not the same as args
  fetcher: (...args: [ ...TArgs, {
    value: Awaited<T> | undefined;
    refetching: boolean;
    signal: AbortSignal;
  }]) => Promise<T> | T,
  deps: TArgs = [] as unknown as TArgs,
  options?: ResourceOptions<T, TContext>
): ResourceReturn<T> {
  const controller = new AbortController();
  const [ resource, dispatch ] = useResourceReducer(options?.initialValue);

  // TODO all the async / effect stuff here

  const mutate = useCallback((val: Awaited<T>) => {
    dispatch({ type: "SYNC-RESULT", payload: val })
  }, []);

  const refetch = useCallback((...deps: TArgs) => {
    return fetcher(...deps, {
      value: resource.data,
      refetching: true,
      signal: controller.signal,
    });
  }, [...deps]);

  const controls = useMemo(() => ({ mutate, refetch }), [ mutate, refetch ]);
  return useMemo(() => [ resource, controls ], [ resource, controls ]);
}