import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAsyncState, UseAsyncStateReturn } from "./useAsyncState";

export interface UseRequestCbOpts {
  signal: AbortSignal;
}

interface UseRequestOpts<T, Args extends readonly any[]> {
  /** initial value (before the first callback call, null otherwise) */
  initialValue?: Promise<T> | Awaited<T>;
  /** Skip first run (before params change)  */
  skipFirstRun?: boolean;
  /** Don't memoize getter, rerun it every time it changes */
  skipFnMemoization?: boolean;
  /** Callback called on succesful getter resolve */
  onCompleted?: (data: Awaited<T>, context: Args) => void;
  /** Callback called on getter error */
  onError?: (error: unknown, context: Args) => void;
}

type UseRequestReturn<T, Args extends readonly any[]> = UseAsyncStateReturn<T> & {
  /** immediately rerun the getter function */
  execute: (...args: Args) => void;
  /** read data inside of a Suspense */
  read: () => Awaited<T>;
};

/** Hook for creating an async callback, storing its result as async state.
 * Callback will be memoized and rerun each time its dependencies change.
 * Additionally, an { signal: AbortSignal } is passed to getter, so it can
 * cancel its unfinished operations on reruns.
 *
 * @param getter function to return the data (sync/async)
 * @param deps dependencies, passed to getter as arguments to be passed
 */
export function useRequest<T, Args extends readonly any[]>(
  getter:
    ((...args: [ ...Args, UseRequestCbOpts ]) => Promise<T> | Awaited<T>) |
    ((...args: [ ...Args ]) => Promise<T> | Awaited<T>),
  params: [ ...Args ],
  {
    initialValue,
    skipFirstRun = false,
    skipFnMemoization = false,
    onCompleted,
    onError,
  }: UseRequestOpts<T, Args> = {},
): UseRequestReturn<T, Args> {
  const controller = useRef<AbortController>();
  const firstRun = useRef<boolean>(skipFirstRun);

  const asyncState = useAsyncState<T, Args>(initialValue, {
    onCompleted,
    onError,
    context: params
  });

  const fn = useCallback(
    (...params: Args) => {
      controller.current?.abort();
      controller.current = new AbortController();
      const prms = getter(...params, { signal: controller.current.signal });
      asyncState.set(prms);
    },
    skipFnMemoization ? [ getter ] : [],
  );

  useEffect(
    () => {
      if (!firstRun.current || !skipFirstRun) {
        fn(...params);
      }
      if (firstRun.current) {
        firstRun.current = false;
      }
      return () => controller.current?.abort();
    },
    [ fn, ...params ],
  );

  const read = useCallback(() => {
    if (asyncState.loading) {
      throw asyncState.promise;
    }
    if (asyncState.error) {
      throw asyncState.error;
    }
    return asyncState.result!;
  }, [ asyncState ]);

  return useMemo(() => ({
    ...asyncState,
    execute: fn,
    read,
  }), [asyncState, fn]);
}
