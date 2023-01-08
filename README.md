# react-control-flow

[SolidJS](https://www.solidjs.com/docs/latest/api#control-flow)-inspired
basic control-flow components and everyday async state hook library for
[React](https://reactjs.org/)

It fulfills everyday needs: iteration, conditional
display, Portals, ErrorBoundaries, async helpers etc.

- typescript support
- lightweight, zero 3d party dependencies, except react
- modern: react 16.8+, no legacy APIs or weird hacks
- fully tested
- easy to use
- general async helpers and hooks and with Suspense support
- mostly SolidJs compatible interface (where it makes sense in the react context)
- covers common pitfalls (missed keys in maps, primitives as childrens etc.)
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

<For each={collection} fallback="list is empty!">
  {(i) => <li key={i.id}>{i.name}</li>}
</For>
```

Rendering a collection of items from _each_ prop.
_children_ can be either a render prop function (more useful) or a static element.

If _each_ isn't an array or has zero length, display optional _fallback_. Any
nullish child is ommited. If every child is ommited, _fallback_ is shown.

You can specify a key prop directly on the root element of a child, using
item's data. If the key isn't specified or is falsy, then array index added as the
key automatically to avoid non-keyed items in collection.

#### Show

```tsx
function Show<T>(props: {
  when: T | undefined | null | false;
  children: ReactNode | ((item: T) => ReactNode);
  fallback?: ReactNode;
}): ReactElement | null;

<Show when={parentSeen === 'mom'} fallback={<h3>nevermind...</h3>}>
  <h2>Hi mom!</h2>
</Show>
```

Conditionally render, depending on truthiness of _when_ props, either _children_
or (optionally) _fallback_

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

<Switch fallback={<h3>nevermind...</h3>}>
  <Match when={parentSeen === "mom"}>
    Hi Mom!
  </Match>
  <Match when={parentSeen === "dad"}>
    Hi Dad!
  </Match>
</Switch>
```
Switch-case alike, renders one of mutually exclusive conditions (described in
'when' prop of Match component) of a switch.

Match should be a direct descendant of Switch and only the first
Match with truthy _when_ is rendered.

If no match has truthy _when_, then optional _fallback_ prop is shown.

#### ErrorBoundary

```tsx
class ErrorBoundary extends Component<{
  fallback?: ReactNode | ((err: unknown, reset: () => void) => ReactNode);
  children?: ReactNode;
  onCatch?: (error: unknown, errorInfo: unknown) => void;
}> {}

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

General error boundary, catches synchronous errors in renders and displays _fallback_
content.

_fallback_ can be a static element of a render prop function, which recieves
the occured error and _reset_ callback as its arguments.

A call to _reset_ clears the occured error and performs a rerender of children
content after that.

#### Dynamic

```tsx
type DynamicProps<T> = PropsWithRef<T> & {
  children?: any;
  component?: FunctionComponent<T> | ComponentClass<T> | string | keyof JSX.IntrinsicElements;
}

function Dynamic<T>({
  children,
  component,
  ...props
}: DynamicProps<T>): ReactElement | null;

<Dynamic component={isLink ? "a" : "span"} {...someProps}>
  Maybe click me
</Dynamic>
```

This component lets you insert an arbitrary Component or tag and passes
its props to it (omitting component prop).

#### Portal

```tsx
function Portal(props: {
  mount?: Element | DocumentFragment | string;
  children?: ReactNode;
}): ReactPortal | null;

<Portal mount="#modal-container-id">
  <dialog>
    Hi Mom!
  </dialog>
</Portal>
```
Component for rendering children outside of the component hierarchy root node.

React events still go as usual. _mount_ can be either a native node, or a
querySelector for such a node.

If no node is provided renders nothing.
<!-- _useShadow_ places the element in Shadow Root for style isolation -->


#### Await

```ts
interface AsyncState<T> {
  loading: boolean;
  error: unknown | null;
  result: Awaited<T> | null;
  promise: Promise<T> | null;
}

function Await<T>(props: {
  for: AsyncState<T>;
  fallback?: (() => ReactNode) | ReactNode;
  catch?: ((err: unknown) => ReactNode) | ReactNode;
  children?: ((data: Awaited<T>) => ReactNode) | ReactNode;
}): ReactElement | null;
```

Component for displaying AsyncState (as returned by useAsyncState or useRequest).

```tsx
const resource = useRequest(() => fetch(`/api/v1/employees`), []);
// or
const resource = useAsyncState(Promise.resolve("Hi mom!"));

<Await
  for={resource}
  fallback="loading..."
  catch={(err) => <div>Error: {String(err)}</div>}
>
  {(data) => <div>Resolved data: {data}</div>}
</Await>
```

### Hooks

Helpers for async state / suspenses.

TODO FIXME remove and rewrite

#### useAsyncState

```ts
interface AsyncState<T> {
  loading: boolean;
  error: unknown | null;
  result: Awaited<T> | null;
  promise: Promise<T> | null;
}

function useAsyncState<T, TContext = never>(
  initialValue?: (() => Promise<T> | Awaited<T>) | Promise<T> | Awaited<T>,
  opts?: {
    onCompleted?: (data: Awaited<T>, context: TContext) => void;
    onError?: (error: unknown, context: TContext) => void;
    /** arbitrary data, passed to callbacks, capturing context at the moment in which resource was set */
    context?: TContext
  }
): AsyncState<T> & {
  /** setting async state to the next value */
  set: (val: Promise<T> | Awaited<T>) => void;
};
```

Turning a promise into AsyncState, exposing common async data: loading, result
and error. It also prevents updates on unmounted components and race conditions.

If initial value or set() argument isn't a promise, it's resolved immediately,
and promise field contains a fake immediately resolved promise (for consistency)
and loading immediately set to false.

As with useState, if _initialValue_ is a function, it's treated as a defered
initialization. It's called only once on the first render and its result is used
as the initial value. You should us that to avoid refetching something on every
render.

```ts
// DON'T DO THAT
const resource = useAsyncState(fetch("/api/v1/employees"));
// DO THAT INSTEAD -- wrap it into a funtion
const resource = useAsyncState(() => fetch("/api/v1/employees"));
```

Generally, this hook is better suited for one-of promise wraps and small stuff,
if you need to perform some potentially repeated calls, or you have deps to your
getter function, or you want to use Suspense you should see _useRequest_ hook bellow.

After a call to set() method, previous result and error are reset to null.
useAsyncState can __not__ be used in a Suspense, as it doesn't keep the same
promise throughout its lifecycle.

```tsx
const resource = useAsyncState(somePromise);

return (
  resource.loading ? (
    <Preloader />
  ) : resource.error ? (
    <ErrorMessage error={resource.error} />
  ) : (
    <FooComponent data={resource.result} />
  )
);
```

#### useRequest

```ts
interface AsyncState<T> {
  loading: boolean;
  error: unknown | null;
  result: Awaited<T> | null;
  promise: Promise<T> | null;
}

function useRequest<T, Args extends readonly any[]>(
  asyncFunction:
    ((...args: [ ...Args, cbOpts: { signal: AbortSignal } ]) => Promise<T> | Awaited<T>) |
    ((...args: [ ...Args ]) => Promise<T> | Awaited<T>),
  params: [ ...Args ],
  opts?: {
    /** initial value (before the first callback call, null otherwise) */
    initialValue?: Promise<T> | Awaited<T>;
    /** Skip first run (before params change)  */
    skipFirstRun?: boolean;
    /** Don't memoize asyncFunction, rerun it every time it changes */
    skipFnMemoization?: boolean;
    onCompleted?: (data: Awaited<T>, context: Args) => void;
    onError?: (error: unknown, context: Args) => void;
  }
): AsyncState<T> & {
  set: (val: Promise<T> | Awaited<T>) => void;
  read: () => Awaited<T> | null;
  /** Immediately rerun asyncFunction with provided args */
  execute: (...args: Args) => void;
};
```

Tying async state to a memoized _asyncFunction_, calling it every time its
dependencies change. Dependencies passed to _asyncFunction_ as arguments. Besides
the specified dependencies, async function also recieves an abort signal, called
on consequetive reruns (or manually) for cancellation of previous request.
_asyncFunction_ can pass it down to fetch, axios or whatever to abort the query.

You can optionally use it inside of Suspense. For that call _read()_ method
inside of the render portion of your component (bellow any other hooks calls)

```tsx
const Employee = ({ employeeId }) => {
  const resource = useRequest(
    (id, { signal }) => fetch(`/api/v1/employee/${id}`, { signal }),
    [ employeeId ]
  );

  return (
    <div className="employee">{resource.read()?.data.name}</div>
  )
};

<Suspense fallback="Loading...">
  <Employee>
</Suspense>
```

## Contributing
If you have any ideas or suggestions or want to report a bug, feel free to
write in the issues section or create a PR.

## License
react-control-flow is MIT licensed.