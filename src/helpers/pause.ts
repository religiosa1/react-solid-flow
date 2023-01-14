interface PauseOpts {
  signal?: AbortSignal
}
/**
 * Promisified abortable timeout.
 * @param timeout timeout duration in ms
 * @param [opts.signal] optional AbortController
 * @returns Promise, resolved when timeout is passed, rejected if aborted (in the same way as fetch() is)
 */
export function pause(timeout: number, { signal }: PauseOpts = {}) {
  return new Promise<void>((res, rej) => {
    const to = setTimeout(() => {
      if (signal?.removeEventListener instanceof Function) {
        signal.removeEventListener("abort", abortHandler);
      }
      res();
    }, timeout);

    function abortHandler(this: AbortSignal) {
      if (to) {
        clearTimeout(to);
      }
      rej(this.reason)
    };

    if (signal?.addEventListener instanceof Function) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }
  });
}