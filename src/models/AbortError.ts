/*
 * Technically, AbortError should be an instance of DOMException, but it was
 * added only in node v17.0.0, so we're extending it from the Error directly.
 */
export class AbortError extends Error {
  readonly name = "AbortError" as const;
  readonly code = 20 as const;

  constructor(message: string = "The operation was aborted.") {
    super(message);
  }
}