# react-solid-flow

[SolidJS](https://www.solidjs.com/docs/latest/api#control-flow)-inspired
basic control-flow components and everyday async state hook library for
[React](https://reactjs.org/)

It fulfills everyday needs: iteration, conditional
display, Portals, ErrorBoundaries, fetching and displaying async data, etc.

- Native Typescript support
- Lightweight: (5kb minified UMD, 2.5kb gzip), tree-shakable,
- Zero third-party dependencies, except React and React-DOM
- Modern: React 16.8+ .. 18.x, no legacy APIs or weird hacks
- Fully tested
- Easy to use
- Hooks and components for performing async operations, handling cancellations,
  mutations, race conditions, and more
- Mostly SolidJS compatible interface (where it makes sense in the React context)
- Covers common pitfalls (missed keys in maps, primitives as children, etc.)
- ⚡⚡💩💩 bLaZinGly FaSt 💩💩⚡⚡

## Installation

```sh
npm install react-solid-flow
```

## Usage

### Components

#### For

```tsx
function For<T, U extends ReactNode>(props: {
  each: ReadonlyArray<T> | undefined | null;
  children: ReactNode | ((item: T, idx: number) => U);
  fallback?: ReactNode;
}): ReactElement | null;
```

```tsx
import { For } from "react-solid-flow";

<For each={collection} fallback="list is empty!">
  {(i) => <li key={i.id}>{i.name}</li>}
</For>
```

Rendering a collection of items from the _each_ prop.

The _children_ prop can be either a render prop function (more useful)
or a static element.

If _each_ isn't an array or has zero length, display the optional _fallback_.

Any nullish child is omitted. If every child is omitted, the _fallback_ prop is shown.

You can specify a key prop directly on the root element of a child, using
item's data. If the key isn't specified or is falsy, then array index added as the
key automatically to avoid non-keyed items in the collection.

#### Show

```tsx
function Show<T>(props: {
  when: T | undefined | null | false;
  children: ReactNode | ((item: NonNullable<T>) => ReactNode);
  fallback?: ReactNode;
}): ReactElement | null;
```

```tsx
import { Show } from "react-solid-flow";

<Show when={parentSeen === 'mom'} fallback={<h3>nevermind...</h3>}>
  <h2>Hi mom!</h2>
</Show>
```
Conditionally renders, depending on truthiness of the _when_ prop, either the
_children_ prop or (optionally) the _fallback_ prop.

#### Switch / Match

```tsx
function Switch(props: {
  children: ReactNode;
  fallback?: ReactNode;
}): ReactElement | null;

function Match<T>(props: {
  when: T | undefined | null | false;
  children?: ReactNode | ((item: T) => ReactNode);
}): ReactElement | null;
```

```tsx
import { Switch, Match } from "react-solid-flow";

<Switch fallback={<h3>nevermind...</h3>}>
  <Match when={parentSeen === "mom"}>
    Hi Mom!
  </Match>
  <Match when={parentSeen === "dad"}>
    Hi Dad!
  </Match>
</Switch>
```

Akin to switch-case, it renders one of the mutually exclusive conditions
(described in the _when_ prop of the Match component) of a switch.

The _Match_ component should be a direct descendant of the _Switch_ component,
and only the first _Match_ with a truthy _when_ prop will be rendered.

If no _Match_ component has a truthy _when_ prop, the optional _fallback_ prop
will be shown.

#### ErrorBoundary

```tsx
class ErrorBoundary extends Component<{
  fallback?: ReactNode | ((err: unknown, reset: () => void) => ReactNode);
  children?: ReactNode;
  onCatch?: (error: unknown, errorInfo: unknown) => void;
}> {}
```

```tsx
import { ErrorBoundary } from "react-solid-flow";

<ErrorBoundary fallback={(err, reset) => (
  <div className="panel-danger">
    I failed miserably: <code>{String(err)}</code>
    <button type="button" onClick={reset}>
      Try again!
    </button>
  </div>
)}>
  <SomePotentiallyFailingComponent />
</ErrorBoundary>
```

General error boundary that catches synchronous errors in renders and displays
the fallback content.

The _fallback_ prop can be a static element or a render prop function, which
receives the occurred error and the _reset_ callback as its arguments.

A call to the _reset_ function clears the occurred error and performs a
re-render of _children_ after that.

#### Await

```ts
export interface ResourceLike<T> {
  loading?: boolean;
  data: Awaited<T> | undefined;
  error: unknown;
}

function Await<T>(props: {
  for: ResourceLike<T>;
  fallback?: (() => ReactNode) | ReactNode;
  catch?: ((err: unknown) => ReactNode) | ReactNode;
  children?: ((data: Awaited<T>) => ReactNode) | ReactNode;
}): ReactElement | null;
```

A component for displaying resource-like async data. It can be used with a
resource returned by the _useResource_ hook in this library, or any other
object that conforms to the required interface (such as responses from
the Apollo Client).

```tsx
import { Await, useResource } from "react-solid-flow";
// See description of useResource hook bellow.
const [ resource ] = useResource(() => fetch(`/api/v1/employees`).then(r => sr.json()));

<Await
  for={resource}
  fallback="loading..."
  catch={(err) => <div>Error: {String(err)}</div>}
>
  {(data) => <div>Resolved data: {data}</div>}
</Await>
```

#### Dynamic

```tsx
function Dynamic<T extends {}, TRef>(
  props: T & {
    ref?: Ref<TRef>;
    children?: any;
    component?: ComponentType<T> | string | keyof JSX.IntrinsicElements;
  }
): ReactElement | null;
```
```tsx
import { Dynamic } from "react-solid-flow";

<Dynamic component={isLink ? "a" : "span"} title="Foo" {...someOtherProps}>
  Maybe click me
</Dynamic>
```

This component allows you to insert an arbitrary component or tag and pass props
to it (excluding the _component_ prop).

Props are controlled by Typescript for Components, but not JSX intrinsic
elements (such as "span", "div", etc.).

You can pass a ref to the target component. It's type won't be inferred
automatically. so you need to type it.

#### Portal

```tsx
function Portal(props: {
  mount?: Element | DocumentFragment | string;
  children?: ReactNode;
}): ReactPortal | null;
```

```tsx
import { Portal } from "react-solid-flow";

<Portal mount="#modal-container-id">
  <dialog>
    Hi Mom!
  </dialog>
</Portal>
```
This component renders _children_ outside of the component hierarchy's root node.
React events will still function as usual.

The _mount_ prop can be either a native node or a query selector for such a node.

If no node is provided, the component will render nothing.

Plase notice, it requires react-dom as its depenndency.
<!-- _useShadow_ places the element in Shadow Root for style isolation -->

### Hooks

Helpers for async state.

#### useResource

The `useResource` hook creates a Resource object that reflects the result of an
asynchronous request performed by the fetcher function.

```tsx
import { useResource } from "react-solid-flow";

const [{ data, error, loading }] = useResouce(
  (id, { signal }) => fetch(`/api/v1/employee/${id}`, { signal }).json(r => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return r.json();
  },
  [id]
);

// or better use Await component from above
return (
  <div className="employee">
    { loading ? (
      <span>Loading...</span>
    ) : error ? (
      <span>Error happened</span>
    ) : (
      {data.name}
    )}
  </div>
);
```

API signature:

```tsx
function useResource<T, TArgs extends readonly any[]>(
  fetcher:
    | ((...args: [ ...TArgs, FetcherOpts ]) => Promise<T> | T)
    | ((...args: [ ...TArgs ]) => Promise<T> | T),
  deps: [...TArgs] = [] as unknown as [...TArgs],
  opts?: ResourceOptions<T>
): ResourceReturn<T, TArgs>;

type ResourceReturn<T, TArgs extends readonly any[]> = [
  Resource<T>,
  {
    mutate: (v: Awaited<T>) => void;
    refetch: (...args: TArgs) => Promise<T> | T;
    abort: (reason?: any) => void;
  }
];

type ResourceOptions<T> = {
  initialValue?: Awaited<T> | (() => Awaited<T>);
  onCompleted?: (data: Awaited<T>) => void;
  onError?: (error: unknown) => void;
  skipFirstRun?: boolean;
  skipFnMemoization?: boolean;
};

interface FetcherOpts {
  refetching: boolean;
  signal: AbortSignal;
}

class Resource<T> implements ResourceLike<T> {
  loading: boolean;
  data: Awaited<T> | undefined;
  error: unknown;
  latest: Awaited<T> | undefined;
  state: ResourceState;

  constructor(init?: Partial<ResourceLike<T>>, previous?: { latest?: Awaited<T> });
  static from<T>(data: Promise<T> | Awaited<T> | undefined): Resource<T>;
  static getState(r: ResourceLike<unknown>): ResourceState;
}

type ResourceState = "unresolved" | "pending" | "ready" | "refreshing" | "errored";
```

The result of the fetcher call is stored in the `data` field of the resource.
The `loading` field represents if there is a pending call to the fetcher,
and if the fetcher call was rejected, then the rejection value is stored in
the `error` field.

The `latest` field will return the last returned value.
This can be useful if you want to show the out-of-date data while the new
data is loading.

The fetcher function is called every time the dependencies array is changed.

The dependencies array is passed to the fetcher function as arguments and
the `FetcherOpts` object containing AbortSignal and additional data is added
as the last argument.

If the dependencies array is omitted, the fetcher is called only on mount.

The `state` field represents the current resource state:
2 / 2

The `state` field represents the current state of the resource.

| state      | data  | loading | error |
|:-----------|:-----:|:-------:|:-----:|
| unresolved | No    | No      | No    |
| pending    | No    | Yes     | No    |
| ready      | Yes   | No      | No    |
| refreshing | Yes   | Yes     | No    |
| errored    | No    | No      | Yes   |


The FetcherOpts's `signal` field should be directly passed to your fetch
function (or any other async function that supports the AbortController signal)
to abort it.

Every unsettled request will be aborted if the dependencies array has been
changed or if the component that uses this hook unmounts.

The useResource hook performs checks for race conditions and avoids unmounted
state updates, even if your fetcher function doesn't react to signal abortion.

The useResource hook is optimized to trigger only one re-render on each
resource state change.

```tsx
const Employee = ({ employeeId }) => {
  const [ { data, loading, error} ] = useResource(
    (id, { signal }) => fetch(`/api/v1/employee/${id}`, { signal }),
    [ employeeId ]
  );
};
```

The second value of the return tuple is the control object, which allows you to
handle the resource imperatively.

- **`mutate`**:
  Allows you to directly change the resource value.
- **`refetch`**:
  Allows you to call the fetcher function manually with the
  required arguments. The `FetcherOpts` with an abort signal is added to the
  arguments automatically.
- **`abort`**:
  Allows you to abort the current fetcher call.

If the abort is performed with no reason or with an `AbortError` instance, the
state is still considered pending/refreshing, the `resource.error` is not
updated, and the `onError` callback is not called. Any other reason will
result in an error state for the resource.

The resource will not be refetched until the dependencies change again.

##### useResourceOptions

The _useResource_ hook accepts several options to customize its behavior:

- **`initial value`**:
  The value (or a sync function resolving to this value), to be used as the
  resource initial value. If an initial value is passed, it sets the initial
  state to either "ready" or "refreshing" (depending on whether _skip_ or
  _skipFirstRun_ opts are true or not.)
- **`onCompleted`** and **`onError`**:
  Callbacks that are called when the resource resolves or rejects respectively.
- **`skip`**:
  If set to true, it skips calls to the fetcher function, but it can still be
  called manually with the _refresh_ function. This can be useful if you want
  to wait for certain dependencies to be in a certain state before calling
  the fetcher or if you want to trigger the fetcher only manually on some event.
- **`skipFirstRun`**:
  If set to true, it skips the first automatic trigger of the fetcher function.
  It will be triggered only after the dependencies change.
- **`skipFnMemoization`**:
  If set to true, the fetcher function will not be memoized, and its change
  will result in calls to it (the same way as if the dependencies array was
  changed).

To avoid flickering of content, the resource initial state depends on the _skip_
and _skipFirstRun_ options. If any of them is true, the resource state will be
"unresolved" or "ready" depending on whether the _initialValue_ is defined.
If both of them are false, the resource state will be "pending" or "refreshing"
correspondingly, so we can correctly show a preloader right away.

Currently, there are no plans to support Suspense. The possibility was
investigated and abandoned until the React team at least formally approves the
usage of Suspense for anything other than components lazy loading.
Implementation of Suspense support will require some forms of global promise
cache and cache busting, and most likely this implementation will come
from React itself, so it feels like reinventing the wheel.

If you really want to use suspended data fetches, there are some 3d party libs
for that, if you want a recomendation, there's [suspend-react](https://github.com/pmndrs/suspend-react)

Check out useResource-examples.md to see different forms of it in action.

## Contributing
If you have any ideas or suggestions or want to report a bug, feel free to
write in the issues section or create a PR.

## License
react-solid-flow is MIT licensed.