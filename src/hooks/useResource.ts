import { useCallback, useEffect, useRef, useMemo } from "react";
import { useAsyncState, AsyncState } from "./useAsyncState";

export type UseResourceReturn<T> = AsyncState<T> & {
  /** setting async state to the next value */
  set: (val: Promise<T> | Awaited<T>) => void;
  /** getter for using state inside of a suspense */
  read: () => Awaited<T> | null;
}

interface UseResourceOpts<T, TContext> {
  /** resolve callback */
  onCompleted?: (data: Awaited<T>, context: TContext) => void;
  /** rejection callback */
  onError?: (error: unknown, context: TContext) => void;
  /** arbitrary data, passed to callbacks, capturing context at the moment in which resource was set */
  context?: TContext
}

export function useResource<T, TContext = never>(
  initialValue?: Promise<T> | Awaited<T>,
  {
    onCompleted,
    onError,
    context
  }: UseResourceOpts<T, TContext> = {}
): UseResourceReturn<T> {
  const [ state, dispatch ] = useAsyncState<T>(initialValue);
  // We're keeping the last set promise for race conditions checks
  const lastPrms = useRef<Promise<T> | null>(state.promise);

  const asynHandler = useCallback(async (val: Promise<T>) => {
    try {
      const data = await val;

      // Checking that we don't have a newer promise -- race condition
      if (lastPrms.current === val) {
        dispatch({ type: "RESULT", payload: data });
        onCompleted?.(data, context!);
      }
    } catch (err) {
      if (lastPrms.current === val) {
        dispatch({ type: "ERROR", payload: err });
        onError?.(err, context!);
      }
    }
  }, [ dispatch, onCompleted, onError, context ]);

  const set = useCallback((val: Promise<T> | Awaited<T>) => {
    if (!(val instanceof Promise)) {
      return dispatch({ type: "SYNC-RESULT", payload: val })
    }
    lastPrms.current = val;
    dispatch({ type: "LOADING", payload: val });
    asynHandler(val);
  }, [ asynHandler ]);

  const read = useCallback(() => {
    if (state.loading) {
      throw state.promise;
    }
    if (state.error) {
      throw state.error;
    }
    return state.result;
  }, [ state ]);

  useEffect(() => {
    if (initialValue instanceof Promise) {
      asynHandler(initialValue);
    }
    // On unmount we clear it away, to avoid modifying state of unmounted component
    return () => { lastPrms.current = null };
  // initialValue intentionally ommited from deps, as it's initial
  }, []);

  return useMemo(() => ({
    ...state,
    set,
    read,
  }), [ state, set, read ]);
}
