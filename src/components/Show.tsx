import type { ReactElement, ReactNode } from "react";
import { nodeToElement } from "$/helpers/nodeToElement";

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
  if (props.children instanceof Function) {
    return nodeToElement(props.children(props.when));
  }
  return nodeToElement(props.children);
}