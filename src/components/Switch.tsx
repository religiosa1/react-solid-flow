import { Children } from "react";
import type { ReactNode } from "react";
import { isValidElement } from "react";
import { nodeToElement } from "$/helpers/nodeToElement";

interface SwitchProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function Switch(props: SwitchProps) {
  for (const item of Children.toArray(props.children)) {
    if (isValidElement(item) && item.props.when) {
      return item;
    }
  }
  return nodeToElement(props.fallback);
}