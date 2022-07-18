import { Component } from "react";
import type { ReactNode } from "react";

interface ErrorBoundaryProps {
  fallback?: ReactNode | ((err: unknown, reset: () => void) => ReactNode);
  children?: ReactNode;
  onCatch?: (error: unknown, errorInfo: unknown) => void;
}

interface ErrorBoundaryState {
  error: unknown;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.resetError = this.resetError.bind(this);
  }

  state: ErrorBoundaryState = {
    error: undefined,
  };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    this.props.onCatch?.(error, errorInfo);
    this.setState({ error });
  }

  resetError() {
    this.setState({ error: undefined });
  }

  render() {
    if (this.state.error === undefined) {
      return this.props.children;
    }
    if (this.props.fallback instanceof Function) {
      return this.props.fallback(this.state.error, this.resetError);
    }
    return this.props.fallback;
  }
}
