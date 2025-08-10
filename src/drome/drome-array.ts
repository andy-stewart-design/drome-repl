import { euclid } from "./utils/euclid";
import { range } from "./utils/range";
import { rotateArray } from "./utils/rotate";

class DromeArray {
  private _value: number[];

  constructor(initialValue?: number[]) {
    this._value = initialValue ?? [];
  }

  public euclid(pulses: number, steps: number, rotation = 0) {
    this._value = euclid(pulses, steps, rotation);
    return this;
  }

  public range(start: number, end?: number, stepOrIncl: number | boolean = 1) {
    this._value = range(start, end, stepOrIncl);
    return this;
  }

  public rotate(n: number) {
    const rotated = rotateArray(this._value, n);
    this._value = rotated;
    return this;
  }

  public stretch(n: number) {
    const steps = n * this._value.length;
    const nextValue = Array.from({ length: steps }, (_, i) => {
      const index = Math.floor(i / n);
      return this._value[index] ?? 0;
    });
    this._value = nextValue;
    return this;
  }

  get value() {
    return this._value;
  }
}

export default DromeArray;
