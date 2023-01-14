import { Children, ReactElement, isValidElement } from "react";
import type { ReactNode } from "react";
import { nodeToElement } from "$/helpers/nodeToElement";

interface SwitchProps {
  children: ReactNode;
  /** content to display if no Match predicate is truthy */
  fallback?: ReactNode;
}
/** Component to display one exclusive condition out of many,
 * using Match component
 */
export function Switch(props: SwitchProps): ReactElement | null {
  for (const item of Children.toArray(props.children)) {
    if (isValidElement(item) && item.props.when) {
      return item;
    }
  }
  return nodeToElement(props.fallback);
}