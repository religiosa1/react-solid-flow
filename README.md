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
- hooks and components for performing async operation with Suspense support
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

#### Await

```ts
export interface ResourceLike<T> {
  loading?: boolean;
  data: Awaited<T> | undefined;
  error: any;
}

function Await<T>(props: {
  for: ResourceLike<T>;
  fallback?: (() => ReactNode) | ReactNode;
  catch?: ((err: unknown) => ReactNode) | ReactNode;
  children?: ((data: Awaited<T>) => ReactNode) | ReactNode;
}): ReactElement | null;
```

Component for displaying some resource-like async data. It can be either
a resource returned by the useResource hook in this library, or any other
object, that conforms to this interface (i.e. responses from appollo-client).

```tsx
// See description of useResource hook bellow.
const [ resource ] = useResource(() => fetch(`/api/v1/employees`));

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

### Hooks

Helpers for async state / suspenses.

#### useResource

```tsx

type ResourceReturn<T, TArgs extends readonly any[]> = [
  Readonly<Resource<T>>,
  {
    mutate: (v: Awaited<T>) => void;
    refetch: (...args: TArgs) => Promise<T> | T;
    abort: (reason?: any) => void;
  }
];

export type ResourceOptions<T> = {
  initialValue?: Awaited<T> | (() => Awaited<T>);
  onCompleted?: (data: Awaited<T>) => void;
  onError?: (error: unknown) => void;
  skipFirstRun?: boolean;
  skipFnMemoization?: boolean;
};

export interface FetcherOpts {
  refetching: boolean;
  signal: AbortSignal;
}

export function useResource<T, TArgs extends readonly any[]>(
  fetcher:
    | ((...args: [ ...TArgs, FetcherOpts ]) => Promise<T> | T)
    | ((...args: [ ...TArgs ]) => Promise<T> | T),
  deps: [...TArgs] = [] as unknown as [...TArgs],
  opts?: ResourceOptions<T>
): ResourceReturn<T, TArgs>;
```

Creates a resource object, that reflects the result of async request, performed
by the fetcher function. Result of fetcher call is resource `data` field,
`loading` represents if there's a pending call to fetcher, and if the fetcher
call was rejected, then the rejection value is stored in `error` field.

`latest` field of resource will return the last returned value and won't
trigger Suspense. This can be useful if you want to show the out-of-date data
while the new data is loading.

Resource `state` field represents the current resource state:

| state      | data  | loading | error |
|:-----------|:-----:|:-------:|:-----:|
| unresolved | No    | No      | No    |
| pending    | No    | Yes     | No    |
| ready      | Yes   | No      | No    |
| refreshing | Yes   | Yes     | No    |
| errored    | No    | No      | Yes   |

`fetcher` function is called every time deps array is changed.

Deps array is passed to the fetcher function as arguments and FetcherOpts object
containing AbortSignal and additional data is passed as the last argument.

FetcherOpts `signal` field should be directly passed to your fetch function
(or any other async function supporting AbortController signal) to abort it.

Every unsettled request will be aborted if deps array is changed, or if the
component with this hook unmounts.
_useResource_ performs checks for race conditions and avoids unmounted state
updates, even if your fetcher function doesn't react on signal abortion
(but it really should though).

To use the resource inside of a Suspense, you need to call it as a function.
Just reading resource.data won't cut it, as this won't trigger a Suspense.

```tsx
const Employee = ({ employeeId }) => {
  const [ resource ] = useResource(
    (id, { signal }) => fetch(`/api/v1/employee/${id}`, { signal }),
    [ employeeId ]
  );

  return (
    <Suspense fallback="Loading...">
      <div className="employee">{resource().name}</div>
      {/* notice, that resource is called ^ as a function here */}
    </Suspense>
  )
};
```

Second value of the return tuple is contol object, which gives you the ability
to control the resource imperatively.

**`mutate`**

Allows you to directly change the resource value.

**`refetch`**

Allows you to call fetcher function manually with the required arguments.
FetcherOpts with abort signal is added to arguments automatically.

**`abort`**

Allows you to abort the current fetcher call.

If abort is performed with no reason, or with AbortError instance, then
the state is still considered pending/refreshing, resource.error is
not updated, and onError callback is not called.
Any other reason will result in erorred resource state.

Resource won't be refetched untill deps change again.

##### useResourceOptions

**`initial value`**

If initial value is passed makes the initial state either ready or pending,
depending on whether it was a sync value or a promise.

**`onCompleted` and `onError`**

callbacks can be passed to the hook to be called when resource resolves or
rejects correspondingly.

**`skip`**

Skip calls of fetcher (can still be called manually with refresh)

It can be useful if you're waiting for some of deps to be in certain state
before calling the fetcher or if you want to trigger the fetcher only
manually on some event.

**`skipFirstRun`**

enables you to skip first automatic trigger of fetcher function. It will be
triggered only after deps change

**`skipFnMemoization`**

with this flag, fetcher function won't be memoized and its change will result
in calls to it (the same way as if deps array was changed)

## Contributing
If you have any ideas or suggestions or want to report a bug, feel free to
write in the issues section or create a PR.

## License
react-control-flow is MIT licensed.