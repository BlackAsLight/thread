import { listen } from "@doctor/thread/worker";

listen<number, number>(async function (x) {
  await new Promise((a) => setTimeout(a, 50));
  if (x) {
    return [x];
  }
  throw (new RangeError("Zero not allowed!"));
});
