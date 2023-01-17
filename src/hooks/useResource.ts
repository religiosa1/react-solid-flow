import { useCallback, useEffect, useRef } from "react";
import type { Resource } from "../models/Resource";
import { useResourceReducer } from "./useResourceReducer";

export type ResourceReturn<T, TArgs extends readonly any[]> = [
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
  initialValue?: Awaited<T> | (() => Awaited<T>);
  /** resolve callback */
  onCompleted?: (data: Awaited<T>) => void;
  /** rejection callback */
  onError?: (error: unknown) => void;
  /** Skip first run (before params change)  */
  skipFirstRun?: boolean;
  /** Skip calls of fetcher (can still be called manually with refresh)
   *
   * Can be useful if you're waiting for some of deps to be in certain state
   * before calling the fetcher or if you want to trigger the fetcher only
   * manually on some event.
   */
  skip?: boolean;
  /** Don't memoize getter, rerun it every time it changes */
  skipFnMemoization?: boolean;
};

export interface FetcherOpts {
  refetching: boolean;
  signal: AbortSignal;
}

export function useResource<T, TArgs extends readonly any[]>(
  fetcher:
    | ((...args: [ ...TArgs, FetcherOpts ]) => Promise<T> | T)
    | ((...args: [ ...TArgs ]) => Promise<T> | T),
  deps: [...TArgs] = [] as unknown as [...TArgs],
  {
    initialValue,
    onCompleted,
    onError,
    skipFirstRun = false,
    skip = false,
    skipFnMemoization,
  }: ResourceOptions<T> = {}
): ResourceReturn<T, TArgs> {
  // it's actually initialized in the effect bellow, so we don't create empty controllers
  // on each render
  const controller = useRef<AbortController>();
  const skipFirst = useRef<boolean>(skipFirstRun);

  const [ resource, dispatch ] = useResourceReducer(initialValue);

  const mutate = useCallback((val: Awaited<T>) => {
    controller.current?.abort();
    controller.current = new AbortController();
    dispatch({ type: "SYNC-RESULT", payload: val })
  }, [dispatch]);

  const fetcherFn = useCallback(
    (refetching: boolean, ...args: [ ...TArgs ]) => {
      let val: Promise<T> | T;
      const cont = controller.current;
      try {
        val = fetcher(...args, {
          signal: cont?.signal!,
          refetching,
        });
        if (val instanceof Promise) {
          handler(val);
        } else {
          dispatch({ type: "SYNC-RESULT", payload: val as Awaited<T>})
        }
        return val;
      } catch(e) {
        dispatch({type: "REJECT", payload: e});
        if (refetching) {
          throw e;
        }
        return undefined as T;
      }

      async function handler(val: Promise<T>) {
        dispatch({ type: "PEND" });
        try {
          const result = await val;
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
    },
    skipFnMemoization ? [ fetcher ] : []
  );

  const refetch = useCallback((...args: TArgs) => {
    controller.current?.abort();
    controller.current = new AbortController();
    return fetcherFn(true, ...args);
  }, [fetcherFn]);

  useEffect(() => {
    skipFirst.current = skipFirstRun;
    if (!controller.current) {
      controller.current = new AbortController();
    }
  }, [ skipFirstRun ]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (skip) {
      return;
    }

    fetcherFn(false, ...deps);

    return () => {
      controller.current?.abort();
      controller.current = new AbortController();
    }
  // onCompleted and onError are intentionally ommited, as we don't want to
  // retrigger the fetching, if someone forgot to memoize it
  }, [ ...deps, skip, fetcherFn ])

  return [ resource, { mutate, refetch } ];
}