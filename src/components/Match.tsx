import { nodeToElement } from "$/helpers/nodeToElement";
import { ReactNode, useContext, useEffect, useRef } from "react";

interface MatchProps<T> {
  when: T | undefined | null | false;
  children?: ReactNode | ((item: T) => ReactNode);
}

export function Match<T>({ when, ...props }: MatchProps<T>) {
  if (!when) {
    return null;
  }
  if (props.children instanceof Function) {
    return nodeToElement(props.children(when));
  }
  return nodeToElement(props.children);
}
