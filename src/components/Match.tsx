import { nodeToElement } from "$/helpers/nodeToElement";
import { renderProp } from "$/helpers/renderProp";
import type { ReactElement, ReactNode } from "react";

interface MatchProps<T> {
  when: T | undefined | null | false;
  children?: ((item: T) => ReactNode) | ReactNode;
}

export function Match<T>({ when, children }: MatchProps<T>): ReactElement | null {
  if (!when) {
    return null;
  }
  return renderProp(children, when);
}
