# Examples of different usage of useResource hook

## Vanilla

### No-deps, launch on mount
```tsx
const Foo = () => {
  const [ resource ] = useResource(() => fetch(`/api/v1/employees`).then(r => {
    if (!r.ok) {
      throw new Error(`HTTP error! Status: ${r.status}`);
    }
    return r.json();
  }));

  return (
    <Await
      for={resource}
      fallback="loading..."
      catch={(err) => <div>Error: {String(err)}</div>}
    >
      {(data) => <div>Resolved data: {data}</div>}
    </Await>
  );
}
```

it works with any promise, and you don't have to use the Await component.

```tsx
const Foo = () => {
  const [ resource ] = useResource(
    () => new Promise((res) => setTimeout(() => res(10), 1000))
  );

  return (
    { resource.loading ? (
      <span>Loading...</span>
    ) : resource.error ? (
      <span>Some error {String(resource.error)}</span>
    ) : (
      <span>{resource.data}</span>
    )}
  );
}
```

### Deps, refetch on change (using Axios libary)

```tsx
import axios, { isCancel } from 'axios';

const Foo = ({ id }: { id: number }) => {
  const [ resource ] = useResource(
    (id, { signal }) => axios.get(`/api/v1/employees/${encodeUriComponent(id)}`, undefined, { signal })
      .catch((e: unknown) => {
        // Notice, that axios CancelError is not the same as AbortError, so we need to catch and rethrow
        // it, to avoid error flickering.
        if (isCancel(e)) {
          throw { name: "AbortError" };
        }
        throw e;
      }),
    [id]
  );
  return "...";
}
```

### As callback handler only, no automatic fetch (using ky library)
```tsx
import ky from 'ky';

const [ resource, { refetch: sendForm } ] = useResource(
  (data, { signal }) => ky.post(`/api/v1/employee/${id}`, { signal, json: data }).json(),
  [] as [ FormData ],
  { skip: true }
);

return (
  <form onSubmit={(e) => {
    const data = fooProcessor(e);
    sendForm(data);
  }>
  <Await
    for={resource}
    catch={<small>submit error</small>}
    fallback="Submitting..."
  >
    Data successfully send!
  </Await>
);
```

### Tying to external AbortSignal

```tsx
const Foo = ({ externalSignal }: { externalSignal: AbortSignal }) => {
  const [ resource, { abort } ] = useResource(fooFetcher);
  useEffect(
    () => {
      externalSignal?.addEventListener("abort", abort);
      return () => externalSignal?.removeEventListener("abort", abort);
    },
    // `abort` is memoized, you can safely omit it from deps. Or you can add it, whatever
    [externalSignal]
  );
  // ...
}
```
