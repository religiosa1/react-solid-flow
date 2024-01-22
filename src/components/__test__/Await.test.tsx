import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Await } from "../Await";

describe("Await", () => {
  it("renders resolved Resource-like", () => {
    const state = {
      loading: false,
      data: 123,
      error: null,
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
      data: null,
      error: 123,
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
      data: null,
      error: null,
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
      data: null,
      error: 123,
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
      data: 123,
      error: null,
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

  it("renders nothing if `for` isn't passed", () => {
    render((
      <Await
        //@ts-expect-error nullish values should be reported as error
        for={null}
        catch={<i>test</i>}
        fallback={<i>loading</i>}
      >
        Hi mom!
      </Await>
    ));
    expect(screen.queryByText("loading")).toBeNull();
    expect(screen.queryByText("test")).toBeNull();
    expect(screen.queryByText("Hi mom!")).toBeNull();
  });
});