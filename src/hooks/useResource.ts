import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Resource } from "../models/Resource";
import { useResourceReducer } from "./useResourceReducer";

type ResourceReturn<T, TArgs extends readonly any[]> = [
  Readonly<Resource<T>>,
  {
    /** Manually set the value.
     *
     * If fetcher was currently pending, it's aborted.
     */
    mutate: (v: Awaited<T>) => void;
    refetch: (...args: TArgs) => Promise<T> | T;
  }
];

export type ResourceOptions<T> = {
  /** Initial value for the resource */
  initialValue?: Promise<T> | Awaited<T> | (() => Promise<T> | Awaited<T>);
  /** resolve callback */
  onCompleted?: (data: Awaited<T>) => void;
  /** rejection callback */
  onError?: (error: unknown) => void;
  /** Skip first run (before params change)  */
  skipFirstRun?: boolean;
  /** Don't memoize getter, rerun it every time it changes */
  skipFnMemoization?: boolean;
};

export interface FetcherOpts {
  refetching: boolean;
  signal: AbortSignal;
}

export function useResource<T, TArgs extends readonly any[]>(
  // FIXME signature, deps is not the same as args
  fetcher:
    | ((...args: [ ...TArgs, FetcherOpts ]) => Promise<T> | T)
    | ((...args: [ ...TArgs ]) => Promise<T> | T),
  deps: TArgs = [] as unknown as TArgs,
  {
    initialValue,
    onCompleted,
    onError,
    skipFirstRun = false,
    skipFnMemoization,
  }: ResourceOptions<T> = {}
): ResourceReturn<T, TArgs> {
  const controller = useRef<AbortController>();
  const skip = useRef<boolean>(skipFirstRun);

  const [ resource, dispatch ] = useResourceReducer(initialValue);

  const mutate = useCallback((val: Awaited<T>) => {
    controller.current?.abort();
    controller.current = new AbortController();
    dispatch({ type: "SYNC-RESULT", payload: val })
  }, [dispatch]);

  const fetcherFn = useCallback(
    (...args: [ ...TArgs, FetcherOpts ]) => fetcher(...args),
    skipFnMemoization ? [ fetcher ] : []
  );

  const refetch = useCallback((...args: TArgs) => {
    controller.current?.abort();
    controller.current = new AbortController();
    return fetcherFn(...args, {
      signal: controller.current.signal,
      refetching: true
    });
  }, [fetcherFn]);

  const controls = useMemo(() => ({ mutate, refetch }), [ mutate, refetch ]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }

    async function handler() {
      dispatch({ type: "PEND" });
      const cont = controller.current;
      try {
        const result = await fetcherFn(...deps, {
          signal: cont?.signal!,
          refetching: false,
        });;
        // As fetcher can completely ignore AbortController we're checking
        // for race conditions separately, by checking that AbortController
        // instance hasn't changed between calls.
        if (cont !== controller.current) { return; }
        dispatch({ type: "RESOLVE", payload: result });
        onCompleted?.(result);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") { return; }
        if (cont !== controller.current) { return; }
        dispatch({ type: "REJECT", payload: e });
        onError?.(e);
      }
    }
    handler();

    return () => {
      controller.current?.abort();
      controller.current = new AbortController();
    }
  // onCompleted and onError are intentionally ommited, as we don't want to
  // retrigger the fetching, if someone forgot to memoize it.
  }, [ ...deps, fetcherFn, dispatch ])

  return useMemo(() => [ resource, controls ], [ resource, controls ]);
}