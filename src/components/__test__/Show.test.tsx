import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Show } from "../Show";

describe("Show component", () => {
  it("shows children, when 'when' is truthy", () => {
    render(<h1><Show when="qwerty">hi mom</Show></h1>);
    expect(screen.getByRole("heading")).toHaveTextContent("hi mom");
  });

  it("doesn't show children, when 'when' is falsy", () => {
    render(<h1><Show when="">hi mom</Show></h1>);
    expect(screen.getByRole("heading")).not.toHaveTextContent("hi mom");
  });

  it("shows fallback, when 'when' is falsy", () => {
    render(<h1><Show when="" fallback="hi dad">hi mom</Show></h1>);
    const h = screen.getByRole("heading");
    expect(h).not.toHaveTextContent("hi mom");
    expect(h).toHaveTextContent("hi dad");
  });

  it("shows components, strings, and fragments", () => {
    const TestComp = () => <span>hi dad</span>;
    render((
      <h1>
        <Show when={true}>hi mom</Show>
        <Show when={true}><TestComp /></Show>
        <Show when={true}><>hi everyone</></Show>
      </h1>
    ));
    const h = screen.getByRole("heading");
    expect(h).toHaveTextContent("hi mom");
    expect(h).toHaveTextContent("hi dad");
    expect(h).toHaveTextContent("hi everyone");
  });

  it("accept render prop as children", () => {
    render((<h1><Show when="hi mom">{(i) => i}</Show></h1>
    ));
    expect(screen.getByRole("heading")).toHaveTextContent("hi mom");
  });
});