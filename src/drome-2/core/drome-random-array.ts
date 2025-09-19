import type { DromeCycle, DromeCycleValue, Metronome } from "../types";

type RandMapper = (r: number, start: number, end: number) => number;

interface DromeRandomArrayOption {
  met: Metronome;
  counter: number | undefined;
  length: number;
  range: { start: number; end: number };
  mapper: RandMapper;
}

class DromeRandomArray {
  private _value: DromeCycle;
  private met: Metronome;
  private counter: number | undefined;
  private length: number;
  private range: { start: number; end: number };
  private mapper: RandMapper;

  constructor(opts: DromeRandomArrayOption) {
    this.met = opts.met;
    this.length = opts.length;
    this.counter = opts.counter;
    this.range = opts.range;
    this.mapper = opts.mapper;

    let seed = getSeed(this.counter ?? this.met.bar);
    const nextValue: DromeCycleValue[] = [];
    for (let i = 0; i < this.length; i++) {
      const rFloat = Math.abs(seedToRand(seed));
      nextValue.push(this.mapper(rFloat, this.range.start, this.range.end));
      seed = xorwise(seed);
    }
    this._value = [nextValue];
  }

  get value() {
    console.log(this.met);
    console.log(this._value[0]);

    const currentValue = this._value;
    let seed = getSeed(this.counter ?? this.met.bar);
    const nextValue: DromeCycleValue[] = [];
    for (let i = 0; i < this.length; i++) {
      const rFloat = Math.abs(seedToRand(seed));
      nextValue.push(this.mapper(rFloat, this.range.start, this.range.end));
      seed = xorwise(seed);
    }
    this._value = [nextValue];
    return currentValue;
  }
}

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

export default DromeRandomArray;
