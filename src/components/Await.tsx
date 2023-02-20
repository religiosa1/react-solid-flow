import { ReactElement, ReactNode } from "react";
import { ResourceLike } from "../models/Resource";
import { renderProp } from "../helpers/renderProp";

interface AwaitProps<T> {
  /** resource to wait for */
  for: ResourceLike<T>;
  /** renderProp (or static content) to display while loading */
  fallback?: (() => ReactNode) | ReactNode;
  /** renderProp (or static content) to display if resource was rejected */
  catch?: ((err: unknown) => ReactNode) | ReactNode;
  /** renderProp (or static content) to display when resource is resolved */
  children?: ((data: Awaited<T>) => ReactNode) | ReactNode;
}

/** Component for displaying a Resource */
export function Await<T>(props: AwaitProps<T>): ReactElement | null {
  if (props.for.loading) {
    return renderProp(props.fallback);
  }
  if (props.for.error != null) {
    return renderProp(props.catch, props.for.error);
  }
  return renderProp(props.children, props.for.data!);
}