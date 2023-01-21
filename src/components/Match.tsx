import { ReactElement, ReactNode } from "react";
import { renderProp } from "../helpers/renderProp";

interface MatchProps<T> {
  /** predicate */
  when: T | undefined | null | false;
  /** content (or renderProp) to display if predicate is truthy */
  children?: ((item: T) => ReactNode) | ReactNode;
}

/** Single branch of Switch component. */
export function Match<T>({ when, children }: MatchProps<T>): ReactElement | null {
  if (!when) {
    return null;
  }
  return renderProp(children, when);
}
