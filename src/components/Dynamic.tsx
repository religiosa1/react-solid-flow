import React, { forwardRef } from "react";
import type { ComponentType, ReactElement, Ref, RefAttributes} from "react";

const genericForwardRef = forwardRef as any as (<T, P = {}>(
  render: (props: P, ref: Ref<T>) => ReactElement | null
) => ((props: P & RefAttributes<T>) => ReactElement | null));


type DynamicProps<T> = T & {
  children?: any;
  component?: ComponentType<T> | string | keyof JSX.IntrinsicElements;
}

/** This component lets you insert an arbitrary Component or tag and passes
 * the props through to it.
 * For example, it can be usefull when you need to conditionally render
 * <a> or <span> */
export const Dynamic = genericForwardRef(
  function Dynamic<T extends {}>(
    {
      component: Component,
      ...props
    }: DynamicProps<T>,
    ref: Ref<unknown>
  ): ReactElement | null {
    if (!Component) {
      return null;
    }
    return (
      <Component {...props as any} ref={ref} />
    );
  }
);
