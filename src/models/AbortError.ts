export class AbortError extends Error {
  readonly name = "AbortError" as const;
  readonly code = 20 as const;
}