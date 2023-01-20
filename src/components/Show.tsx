import type { ReactElement, ReactNode } from "react";
import { nodeToElement } from "../helpers/nodeToElement";
import { renderProp } from "../helpers/renderProp";

interface ShowProps<T> {
  /** predicate */
  when: T | undefined | null | false;
  /** content (or renderProp) to display when predicate is truthy */
  children: ReactNode | ((item: NonNullable<T>) => ReactNode);
  /** content to display when predicate is falsy */
  fallback?: ReactNode;
}
/** Conditional rendering component */
export function Show<T>({
  fallback = null,
  ...props
}: ShowProps<T>): ReactElement | null {
  if (!props.when) {
    return nodeToElement(fallback);
  }
  return renderProp(props.children, props.when);
}