import { createElement } from "react";
import type { FunctionComponent, ComponentClass, PropsWithRef } from "react";

type DynamicProps<T> = PropsWithRef<T> & {
  children?: any;
  component?: FunctionComponent<T> | ComponentClass<T> | string | keyof JSX.IntrinsicElements;
}

/** This component lets you insert an arbitrary Component or tag and passes
 * the props through to it.
 * For example, it can be usefull when you need to conditionally render
 * <a> or <span> */
export function Dynamic<T extends {}>({
  children,
  component,
  ...props
}: DynamicProps<T>) {
  if (!component) {
    return null;
  }
  // TODO ref forwarding?
  return createElement(component, props as any, children);
}