import type { Metronome } from "../types";

const PERIOD = 300;

function xorwise(x: number) {
  const a = (x << 13) ^ x;
  const b = (a >> 17) ^ a;
  return (b << 5) ^ b;
}

// stretch 300 cycles over the range of [0,2**29 == 536870912) then apply the xorshift algorithm
const frac = (n: number) => n - Math.trunc(n);

const getSeed = (n: number) => {
  if (n % PERIOD === 0) {
    return xorwise(Math.trunc(frac(0x9e3779b9 / PERIOD) * 536870912));
  }
  return xorwise(Math.trunc(frac(n / PERIOD) * 536870912));
};

const seedToRand = (seed: number) => (seed % 536870912) / 536870912;

export interface Rand {
  (n?: number): Rand;
  range(start: number, end: number): Rand;
  arr(length?: number): number[];
  num(): number;
}

function createRand(met: Metronome): Rand {
  let counter: number | undefined;
  let rangeStart = 0;
  let rangeEnd = 1;

  const proxy = new Proxy(function () {}, {
    apply(_target, _thisArg, args) {
      counter = args[0] ?? 0;
      return proxy as Rand;
    },
    get(_target, prop) {
      if (prop === "range") {
        return (start: number, end: number): Rand => {
          rangeStart = start;
          rangeEnd = end;
          return proxy as Rand;
        };
      }
      if (prop === "num") {
        return () => {
          const rFloat = Math.abs(seedToRand(getSeed(counter ?? met.bar)));
          return rFloat * (rangeEnd - rangeStart) + rangeStart;
        };
      }
      if (prop === "arr") {
        return (length = 1) => {
          let seed = getSeed(counter ?? met.bar);
          const result: number[] = [];
          for (let i = 0; i < length; i++) {
            result.push(
              Math.abs(seedToRand(seed)) * (rangeEnd - rangeStart) + rangeStart
            );
            seed = xorwise(seed);
          }
          return result;
        };
      }
      return undefined;
    },
  });

  return proxy as Rand;
}

export { createRand };
