import DromeRandomArray from "../core/drome-random-array";
import type { Metronome } from "../types";

const PERIOD = 300;
const SEED_MAX = 2 ** 29; // 536870912

function xorwise(x: number): number {
  const a = (x << 13) ^ x;
  const b = (a >> 17) ^ a;
  return (b << 5) ^ b;
}

const frac = (n: number) => n - Math.trunc(n);

function getSeed(n: number): number {
  const value = n % PERIOD === 0 ? 0x9e3779b9 / PERIOD : n / PERIOD;
  return xorwise(Math.trunc(frac(value) * SEED_MAX));
}

const seedToRand = (seed: number) => (seed % SEED_MAX) / SEED_MAX;

type RandMapper = (r: number, start: number, end: number) => number;

interface RandBase {
  (off?: number | number[]): RandBase;
  get(length?: number): DromeRandomArray;
  range(start: number, end: number): RandBase;
}

function createRandFactory(met: Metronome, mapper: RandMapper) {
  let offset: number | number[] | undefined;
  let loop: number | undefined;
  let rangeStart = 0;
  let rangeEnd = 1;

  // Explicitly type proxy as RandBase
  const handler: ProxyHandler<(...args: any[]) => any> = {
    apply(_target, _thisArg, args): RandBase {
      offset = args[0] ?? 0;
      loop = args[1] ?? undefined;
      return proxy;
    },
    get(_target, prop): any {
      if (prop === "range") {
        return (start: number, end: number): RandBase => {
          rangeStart = start;
          rangeEnd = end;
          return proxy;
        };
      }
      if (prop === "get") {
        return (length = 4) => {
          return new DromeRandomArray({
            met,
            mapper,
            range: { start: rangeStart, end: rangeEnd },
            loop,
            offset,
            length,
          });
        };
      }
      return undefined;
    },
  };

  const proxy = new Proxy(function () {}, handler) as unknown as RandBase;
  return proxy;
}

// Mappers
const floatMapper: RandMapper = (r, start, end) => r * (end - start) + start;
const intMapper: RandMapper = (r, start, end) =>
  Math.floor(r * (end - start) + start);
const binaryMapper: RandMapper = (r) => Math.round(r);

// Public factories
function createRand(met: Metronome) {
  return createRandFactory(met, floatMapper);
}

function createIntegerRand(met: Metronome) {
  return createRandFactory(met, intMapper);
}

function createBinaryRand(met: Metronome) {
  return createRandFactory(met, binaryMapper);
}

export {
  createRand,
  createIntegerRand,
  createBinaryRand,
  xorwise,
  getSeed,
  seedToRand,
};
