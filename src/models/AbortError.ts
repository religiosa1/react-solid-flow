/*
 * Technically, AbortError should be a descendant of DOMException, but
 * DOMException was only added in node v17.0.0, so we're using Error directly.
 */
export class AbortError extends Error {
  readonly name = "AbortError" as const;
  readonly code = 20 as const;

  constructor(message: string = "The operation was aborted.") {
    super(message);
  }
}