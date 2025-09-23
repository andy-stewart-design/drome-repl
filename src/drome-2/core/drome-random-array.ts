import DromeArray, { type DromeCycle } from "./drome-array";
import { getSeed, seedToRand, xorwise } from "../utils/random";
import type { Metronome } from "../types";

type RandMapper = (r: number, start: number, end: number) => number;

interface DromeRandomArrayOption {
  met: Metronome;
  offset: number | number[] | undefined;
  loop: number | undefined;
  length: number;
  range: { start: number; end: number };
  mapper: RandMapper;
}

class DromeRandomArray extends DromeArray<number | number[]> {
  private met: Metronome;
  private offset: number | number[];
  private loop: number | null;
  private length: number;
  private range: { start: number; end: number };
  private mapper: RandMapper;

  constructor(opts: DromeRandomArrayOption) {
    super([[0]]);
    this.met = opts.met;
    this.length = opts.length;
    this.offset = opts.offset ?? 0;
    this.loop = opts.loop ?? null;
    this.range = opts.range;
    this.mapper = opts.mapper;
  }

  set value(value: DromeCycle<number | number[]>) {
    this._value = value;
  }

  get value() {
    const offsets = [this.offset].flat();
    const offsetIndex =
      Math.floor(this.met.bar / (this.loop ?? 1)) % offsets.length;

    const progress = this.loop ? this.met.bar % this.loop : this.met.bar;
    let seed = getSeed(offsets[offsetIndex] + progress);
    const nextCycle: DromeCycle<number> = [[]];

    if (!this._value.length) {
      for (let i = 0; i < this.length; i++) {
        const rFloat = Math.abs(seedToRand(seed));
        nextCycle[0].push(
          this.mapper(rFloat, this.range.start, this.range.end)
        );
        seed = xorwise(seed);
      }
    } else {
      this._value[this.met.bar % this._value.length].forEach((val) => {
        if (val === null || val === undefined) {
          nextCycle[0].push(null);
        } else {
          const rFloat = Math.abs(seedToRand(seed));
          nextCycle[0].push(
            this.mapper(rFloat, this.range.start, this.range.end)
          );
          seed = xorwise(seed);
        }
      });
    }

    return nextCycle;
  }
}

export default DromeRandomArray;
