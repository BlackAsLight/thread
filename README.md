# Thread

Thread is a small module that wraps around the Web Worker API to offer a more
promise like experience to pass values to and receive values from web workers.

## Example main.ts

```ts ignore
import { assertEquals } from "jsr:@std/assert";
import { Thread } from "jsr:@doctor/thread";

const thread = new Thread<number[], number>(
  new URL("./worker.ts", import.meta.url).href,
);

assertEquals(await thread.send([1, 2, 3]), 6);
thread.terminate();
```

## Example worker.ts

```ts ignore
import { listen } from "jsr:@doctor/thread/worker";

listen<number[], number>(function (input) {
  return [input.reduce((x, y) => x + y)];
});
```
