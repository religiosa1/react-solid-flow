import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { For } from "../For";

describe("For component", () => {
  it("renders each element through a render-prop", () => {
    render((
      <For each={[1, 2, 3]}>
        {(i) => <h1>{i}</h1>}
      </For>
    ));
    const items = screen.queryAllByRole('heading');
    expect(items[0]).toHaveTextContent("1");
    expect(items[1]).toHaveTextContent("2");
    expect(items[2]).toHaveTextContent("3");
    expect(items.length).toBe(3);
  });

  it("shows fallback, if 'each' prop has zero length", () => {
    render((
      <For each={[]} fallback={<h1>hi mom</h1>}>
        {(i) => <h1>{i}</h1>}
      </For>
    ));
    const items = screen.queryAllByRole('heading');
    expect(items[0]).toHaveTextContent("hi mom");
    expect(items.length).toBe(1);
  });

  it("shows fallback, if 'each' prop isn't an array", () => {
    render((
      <For each={null} fallback={<h1>hi mom</h1>}>
        {(i: any) => <h1>{i}</h1>}
      </For>
    ));
    const items = screen.queryAllByRole('heading');
    expect(items[0]).toHaveTextContent("hi mom");
    expect(items.length).toBe(1);
  });

  it("wraps non-keyed elements with a keyed fragment", () => {
    const mockData = [
      {id: "a", name: "test1"},
      {id: "b", name: "test2"},
      { name: "test3"},
    ];

    render((
      <For each={mockData}>
        {(item: any) => <h1 key={item.id}>{item.name}</h1>}
      </For>
    ));
    expect(screen.queryAllByText(/^test\d$/).length).toBe(3);
  })

  it("renders static node required amount of times", () => {
    render((
      <For each={[1, 2, 3]}>
        <h1>hi mom</h1>
      </For>
    ));
    const items = screen.queryAllByText('hi mom');
    expect(items.length).toBe(3);
  });

  it("If every child is nullish, show a fallback", () => {
    render((
      <>
        <For each={[1, 2, 3]} fallback={<i>hi mom</i>}>
          {() => null }
        </For>
        <For each={[1, 2, 3]} fallback={<i>hi mom</i>}>
          {null}
        </For>
      </>
    ));
    expect(screen.getAllByText("hi mom").length).toBe(2);
  });
});