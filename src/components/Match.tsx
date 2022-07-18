import { nodeToElement } from "$/helpers/nodeToElement";
import type { ReactElement, ReactNode } from "react";

interface MatchProps<T> {
  when: T | undefined | null | false;
  children?: ReactNode | ((item: T) => ReactNode);
}

export function Match<T>({ when, children }: MatchProps<T>): ReactElement | null {
  if (!when) {
    return null;
  }
  if (children instanceof Function) {
    return nodeToElement(children(when));
  }
  return nodeToElement(children);
}
