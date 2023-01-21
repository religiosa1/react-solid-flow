import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dynamic } from "../Dynamic";

describe("Dynamic component", () => {
  it("renders supplied html tag", () => {
    render(<Dynamic component="a">test</Dynamic>);
    const item = screen.getByText("test");
    expect(item instanceof HTMLAnchorElement).toBe(true);
  });

  it("provides properties to the html tag", () => {
    render(<Dynamic component="a" title="asdf">test</Dynamic>)
    const item = screen.getByText("test") as HTMLAnchorElement;
    expect(item.title).toBe("asdf");
  });

  it("renders supplied components", () => {
    const Comp = ({ cont }: {cont: string}) => <span>{cont}</span>
    render(<Dynamic component={Comp} cont="test" />);
    expect(screen.getByText("test")).toBeDefined();
  });

  it("correctly gets possible proptypes", () => {
    const Comp = ({ cont }: {cont: string}) => <span>{cont}</span>
    //@ts-expect-error
    render(<Dynamic component={Comp} comt="test" />);
  });

  it("renders nothing if component is falsy", () => {
    render(<Dynamic component="">test</Dynamic>);
    const items = screen.queryAllByText("test");
    expect(items.length).toBe(0);
  });
});
