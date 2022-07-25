import type { ReactElement, ReactNode } from "react";
import { nodeToElement } from "$/helpers/nodeToElement";
import { renderProp } from "$/helpers/renderProp";

interface ShowProps<T> {
    when: T | undefined | null | false;
    children: ReactNode | ((item: T) => ReactNode);
    fallback?: ReactNode;
}
export function Show<T>({
  fallback = null,
  ...props
}: ShowProps<T>): ReactElement | null {
  if (!props.when) {
    return nodeToElement(fallback);
  }
  return renderProp(props.children, props.when);
}