import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRef, ReactNode } from "react";
import { ErrorBoundary } from "../ErrorBoundary";

describe("ErrorBoundary component", () => {
  const Thrower = ({ skipAt = Infinity, children } : { skipAt?: number, children?: ReactNode }) => {
    const render = useRef(0);
    render.current++;
    if (render.current >= skipAt) {
      return <>{children}</>;
    }
    throw new Error("test error");
  };

  const errorMute = (e: ErrorEvent) => e.message === "test error" && e.preventDefault();

  beforeEach(() => {
    window.addEventListener('error', errorMute);
  });
  afterEach(() => {
    window.removeEventListener('error', errorMute);
  });

  it("catches an error down the hier tree and displays fallback", () => {
    render((
      <ErrorBoundary fallback="test">
        <Thrower>
          fail
        </Thrower>
      </ErrorBoundary>
    ));
    expect(screen.queryAllByText("test").length).toBe(1);
    expect(screen.queryAllByText("fail").length).toBe(0);
  });

  it("renders children if no error happened", () => {
    render((
      <ErrorBoundary fallback="test">
          fail
      </ErrorBoundary>
    ));
    expect(screen.queryAllByText("test").length).toBe(0);
    expect(screen.queryAllByText("fail").length).toBe(1);
  });

  it("passes error info and recovery cb into fallback render-prop", async () => {
    render((
      <ErrorBoundary fallback={(err, reset) => (
        <div>
          {(err as any).message}
          <button type="button" onClick={reset}>
            reset
          </button>
        </div>
      )}>
        <Thrower skipAt={2}>
          fail
        </Thrower>
      </ErrorBoundary>
    ));
    expect(screen.queryAllByText("test error").length).toBe(1);
    expect(screen.queryAllByText("fail").length).toBe(0);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => screen.queryAllByText("fail"));
  });

  it("calls onCatch cb with error info", () => {
    const onCatch = vi.fn((err) => {});
    render((
      <ErrorBoundary onCatch={onCatch} fallback="test">
        <Thrower>
          fail
        </Thrower>
      </ErrorBoundary>
    ));

    expect(onCatch).toBeCalledTimes(1);
    expect(onCatch.mock.calls[0][0].message).toBe("test error")
  });
});