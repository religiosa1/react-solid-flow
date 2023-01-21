import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Switch } from "../Switch";
import { Match } from "../Match";

describe("Switch/Match component", () => {
  it("renders fallback, if no match condition is true", () => {
    render((
      <Switch fallback="testF">
        <Match when={0}><i>test1</i></Match>
      </Switch>
    ));
    expect(screen.queryAllByText("testF").length).toBe(1);
    expect(screen.queryAllByText("test1").length).toBe(0);
  });

  it("renders only the first Match tag with truthy 'when'", () => {
    render((
      <Switch fallback="testF">
        <Match when={1}><i>test1</i></Match>
        <Match when={1}><i>test2</i></Match>
        <Match when={0}><i>test3</i></Match>
      </Switch>
    ));
    expect(screen.queryAllByText("testF").length).toBe(0);
    expect(screen.queryAllByText("test1").length).toBe(1);
    expect(screen.queryAllByText("test2").length).toBe(0);
    expect(screen.queryAllByText("test3").length).toBe(0);
  });

  it("renders Match as a render prop, if child is a function", () => {
    render((
      <Switch fallback="testF">
        <Match when={1}>
          {(i) => `test${i}`}
        </Match>
      </Switch>
    ));
    expect(screen.queryAllByText("testF").length).toBe(0);
    expect(screen.queryAllByText("test1").length).toBe(1);
  });

  it("falsy Match's 'when' results in no render", () => {
    render((
      <Match when={false}>
        test1
      </Match>
    ));
    expect(screen.queryAllByText("test1").length).toBe(0);
  });
});
