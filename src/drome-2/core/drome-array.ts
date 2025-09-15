import { euclid } from "../utils/euclid-2";
// import { range } from "../utils/range";
// import { rotateArray } from "../utils/rotate";
import type { DromeCycle, DromeCycleValue } from "../types";

class DromeArray {
  private _value: DromeCycle = [];

  constructor(initialValue?: DromeCycle) {
    this._value = initialValue ?? [];
  }

  private applyPattern(patterns: number[][]) {
    const cycles = this._value.length ? this._value : [[0]];
    const loops = Math.max(cycles.length, patterns.length);
    const nextCycles: DromeCycle = [];

    for (let i = 0; i < loops; i++) {
      let noteIndex = 0;
      const cycle = cycles[i % cycles.length];
      const nextCycle = patterns[i % patterns.length].map((p) =>
        p === 0 ? (null as DromeCycleValue) : cycle[noteIndex++ % cycle.length]
      );
      nextCycles.push(nextCycle);
    }

    return nextCycles;
  }

  note(
    ...notes: (DromeCycleValue | DromeCycleValue[] | DromeCycleValue[][])[]
  ) {
    this._value = notes.map((cycle) =>
      Array.isArray(cycle) ? cycle : [cycle]
    );

    return this;
  }

  euclid(pulses: number | number[], steps: number, rotation = 0) {
    this._value = this.applyPattern(euclid(pulses, steps, rotation));
    return this;
  }

  get value() {
    return this._value;
  }
}

export default DromeArray;
