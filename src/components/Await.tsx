import type { ReactNode } from "react";
import { AsyncState } from "../models/AsyncState";
import { renderProp } from "../helpers/renderProp";

interface AwaitProps<TState extends AsyncState<unknown>> {
  /** async state to wait for */
  for: TState;
  /** content to display while loading */
  fallback?: (() => ReactNode) | ReactNode;
  /** content to display if an error occured */
  catch?: ((err: unknown) => ReactNode) | ReactNode;
  /** content to display when async state is resolved */
  children?: ((data: TState["result"]) => ReactNode) | ReactNode;
}

/** Component for displaying AsyncState */
export function Await<TState extends AsyncState<unknown>>(props: AwaitProps<TState>) {
  if (props.for.loading) {
    return renderProp(props.fallback);
  }
  if (props.for.error != null) {
    return renderProp(props.catch, props.for.error);
  }
  return renderProp(props.children, props.for.result);
}