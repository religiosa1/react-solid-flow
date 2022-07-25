import type { ReactElement, ReactNode } from "react";
import { nodeToElement } from "./nodeToElement";

export function renderProp<TArgs extends ReadonlyArray<unknown>>(
  prop: ((...args: TArgs) => ReactNode) | ReactNode,
  ...args: TArgs
): ReactElement | null {
  if (prop instanceof Function) {
    return nodeToElement(prop(...args));
  }
  return nodeToElement(prop);
}