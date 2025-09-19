import DromeArray from "./drome-array";
import { getSeed, seedToRand, xorwise } from "../utils/random";
import type { DromeCycleValue, Metronome } from "../types";

type RandMapper = (r: number, start: number, end: number) => number;

interface DromeRandomArrayOption {
  met: Metronome;
  counter: number | undefined;
  length: number;
  range: { start: number; end: number };
  mapper: RandMapper;
}

class DromeRandomArray extends DromeArray {
  private met: Metronome;
  private counter: number | undefined;
  private length: number;
  private range: { start: number; end: number };
  private mapper: RandMapper;

  constructor(opts: DromeRandomArrayOption) {
    super();
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

export default DromeRandomArray;
