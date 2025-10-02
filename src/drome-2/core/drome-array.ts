import { euclid } from "../utils/euclid-2";
import { hex } from "../utils/hex";
// import { range } from "../utils/range";
// import { rotateArray } from "../utils/rotate";

/* ----------------------------------------------------------------
/* TYPES
---------------------------------------------------------------- */
type DromeCycleValue<T> = T | null | undefined;
type DromeCycle<T> = DromeCycleValue<T>[][];
type DromeCyclePartial<T> = DromeCycleValue<T> | DromeCycleValue<T>[];
type DromeArrangement<T> = [number, DromeCyclePartial<T>];

/* ----------------------------------------------------------------
/* BASE CLASS
---------------------------------------------------------------- */
class DromeArray<T> {
  protected _value: DromeCycle<T> = [];
  protected _defaultValue: DromeCycle<T>;

  constructor(defaultValue: DromeCycle<T>) {
    this._defaultValue = defaultValue;
  }

  /* ----------------------------------------------------------------
  /* PATTERN SETTERS
  ---------------------------------------------------------------- */
  protected applyPattern(patterns: (number | null | undefined)[][]) {
    const cycles = this._value.length ? this._value : this._defaultValue;
    const loops = Math.max(cycles.length, patterns.length);
    const nextCycles: DromeCycle<T> = [];

    for (let i = 0; i < loops; i++) {
      let noteIndex = 0;
      const cycle = cycles[i % cycles.length];
      const nextCycle = patterns[i % patterns.length].map((p) =>
        p === 0 ? null : cycle[noteIndex++ % cycle.length]
      );
      nextCycles.push(nextCycle);
    }

    return nextCycles;
  }

  arrange(...arrangements: DromeArrangement<T>[]) {
    let nextCycles: DromeCycle<T> = [];

    for (const arr of arrangements) {
      for (let i = 0; i < arr[0]; i++) {
        nextCycles.push(Array.isArray(arr[1]) ? arr[1] : [arr[1]]);
      }
    }

    this._value = nextCycles;
    return this;
  }

  euclid(pulses: number | number[], steps: number, rotation = 0) {
    this._value = this.applyPattern(euclid(pulses, steps, rotation));
    return this;
  }

  hex(...hexes: (string | number)[]) {
    this._value = this.applyPattern(hexes.map(hex));
    return this;
  }

  note(...notes: DromeCyclePartial<T>[]) {
    this._value = notes.map((cycle) =>
      Array.isArray(cycle) ? cycle : [cycle]
    );
    return this;
  }

  reverse() {
    this._value = this._value
      .slice()
      .reverse()
      .map((arr) => arr.slice().reverse());
    return this;
  }

  sequence(...args: [...number[][], number]) {
    const steps = args[args.length - 1] as number;
    const pulses = args.slice(0, -1) as number[][];
    const patterns = pulses.map((p) =>
      Array.from({ length: steps }, (_, i) => (p.includes(i) ? 1 : 0))
    );
    this._value = this.applyPattern(patterns);
    return this;
  }

  struct(...patterns: number[][]) {
    this._value = this.applyPattern(patterns);
    return this;
  }

  /* ----------------------------------------------------------------
  /* PATTERN MODIFIERS
  ---------------------------------------------------------------- */
  fast(multiplier: number) {
    if (multiplier <= 1) return this;
    const length = Math.ceil(this._value.length / multiplier);
    const numLoops = multiplier * length;
    const nextCyles: typeof this._value = Array.from({ length }, () => []);

    for (let i = 0; i < numLoops; i++) {
      const currentIndex = Math.floor(i / multiplier);
      nextCyles[currentIndex].push(...this._value[i % this._value.length]);
    }

    this._value = nextCyles;
    return this;
  }

  slow(n: number) {
    if (n <= 1) return this;
    const nextCycles: DromeCycle<T> = [];

    for (const cycle of this._value) {
      const chunkSize = Math.ceil((cycle.length * n) / n);

      for (let k = 0; k < n; k++) {
        const chunk: DromeCycleValue<T>[] = [];
        const startPos = k * chunkSize;
        const endPos = Math.min((k + 1) * chunkSize, cycle.length * n);

        for (let pos = startPos; pos < endPos; pos++) {
          if (pos % n === 0) chunk.push(cycle[pos / n]);
          else chunk.push(null);
        }

        nextCycles.push(chunk);
      }
    }

    this._value = nextCycles;
    return this;
  }

  stretch(factor: number) {
    this._value = this._value.flatMap((cycle) => Array(factor).fill(cycle));
    return this;
  }

  clear() {
    this._value = [];
  }

  /* ----------------------------------------------------------------
  /* GETTERS
  ---------------------------------------------------------------- */
  set defaultValue(value: DromeCycle<T>) {
    this._defaultValue = value;
  }

  set value(value: DromeCycle<T>) {
    this._value = value;
  }

  get value() {
    return this._value.length ? this._value : this._defaultValue;
  }

  getRawValue() {
    return this._value;
  }
}

export default DromeArray;
export type {
  DromeCycleValue,
  DromeCycle,
  DromeCyclePartial,
  DromeArrangement,
};

// /* ----------------------------------------------------------------
// /* SPECIALIZED CLASSES
// ---------------------------------------------------------------- */
// export class FlatDromeArray extends DromeArray<number> {}
// export class NestedDromeArray extends DromeArray<number | number[]> {}
