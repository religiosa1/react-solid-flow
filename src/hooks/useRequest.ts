import { useCallback, useEffect, useMemo, useRef } from "react";
import { useResource, UseResourceReturn } from "./useResource";

export interface UseRequestCbOpts {
  signal: AbortSignal;
}

interface UseRequestOpts<T, Args extends readonly any[]> {
  /** initial value (before the first callback call, null otherwise) */
  initialValue?: Promise<T> | Awaited<T>;
  /** Skip first run (before params change)  */
  skipFirstRun?: boolean;
  /** Don't memoize asyncFunction, rerun it every time it changes */
  skipFnMemoization?: boolean;
  /** Callback called on succesful getter resolve */
  onCompleted?: (data: Awaited<T>, context: Args) => void;
  /** Callback called on getter error */
  onError?: (error: unknown, context: Args) => void;
}

type UseAsyncRequestReturn<T, Args extends readonly any[]> = UseResourceReturn<T> & {
  execute: (...args: Args) => void;
};

/** Hook for creating an async callback, storing its result as async state.
 * Callback will be memoized and rerun each time, its dependencies, specified
 * in params argument change.
 *
 * @param asyncFunction data getter
 * @param params arguments to be passed to asyncFunction. On each change it'll be rerun
 */
export function useRequest<T, Args extends readonly any[]>(
  asyncFunction:
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
): UseAsyncRequestReturn<T, Args> {
  const controller = useRef<AbortController>();
  const firstRun = useRef<boolean>(skipFirstRun);

  const asyncState = useResource<T, Args>(initialValue, {
    onCompleted,
    onError,
    context: params
  });

  const fn = useCallback(
    (...params: Args) => {
      controller.current?.abort();
      controller.current = new AbortController();
      const prms = asyncFunction(...params, { signal: controller.current.signal });
      asyncState.set(prms);
    },
    skipFnMemoization ? [ asyncFunction ] : [],
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

  return useMemo(() => ({
    ...asyncState,
    execute: fn,
  }), [asyncState, fn]);
}
