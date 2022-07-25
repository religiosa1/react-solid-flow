import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Await } from "../Await";

describe("Await", () => {
  it("renders resolved AsyncState", () => {
    const state = {
      loading: false,
      result: 123,
      error: null,
      promise: Promise.resolve(123),
    };
    render((
      <Await for={state} catch={<i>test</i>} fallback={<i>loading</i>}>
        Hi mom!
      </Await>
    ));
    expect(screen.queryByText("loading")).toBeNull();
    expect(screen.queryByText("test")).toBeNull();
    expect(screen.queryByText("Hi mom!")).toBeDefined();
  });

  it("renders catch prop if AsyncState is rejected", () => {
    const state = {
      loading: false,
      result: null,
      error: 123,
      promise: null, // so vitest won't bug us out
    };
    render((
      <Await for={state} catch={<i>test</i>} fallback={<i>loading</i>}>
        Hi mom!
      </Await>
    ));
    expect(screen.queryByText("loading")).toBeNull();
    expect(screen.queryByText("test")).toBeDefined();
    expect(screen.queryByText("Hi mom!")).toBeNull();
  });

  it("renders fallback prop if AsyncState is pending", () => {
    const state = {
      loading: true,
      result: null,
      error: null,
      promise: new Promise(() => {}),
    };
    render((
      <Await for={state} catch={<i>test</i>} fallback={<i>loading</i>}>
        Hi mom!
      </Await>
    ));
    expect(screen.queryByText("loading")).toBeDefined();
    expect(screen.queryByText("test")).toBeNull();
    expect(screen.queryByText("Hi mom!")).toBeNull();
  });

  it("passes error to catch prop if it's a render prop", () => {
    const state = {
      loading: false,
      result: null,
      error: 123,
      promise: null,
    };
    render((
      <Await for={state} catch={(i) => <i>{String(i)}</i>} fallback={<i>loading</i>}>
        Hi mom!
      </Await>
    ));
    expect(screen.queryByText("loading")).toBeNull();
    expect(screen.queryByText("123")).toBeDefined();
    expect(screen.queryByText("Hi mom!")).toBeNull();
  });

  it("passes result to children if children is a render prop", () => {
    const state = {
      loading: false,
      result: 123,
      error: null,
      promise: Promise.resolve(123),
    };
    render((
      <Await for={state} catch={<i>test</i>} fallback={<i>loading</i>}>
        {(i) => String(i)}
      </Await>
    ));
    expect(screen.queryByText("loading")).toBeNull();
    expect(screen.queryByText("test")).toBeNull();
    expect(screen.queryByText("123")).toBeDefined();
  });
});