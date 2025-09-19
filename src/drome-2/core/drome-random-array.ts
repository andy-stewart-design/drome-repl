import DromeArray from "./drome-array";
import { getSeed, seedToRand, xorwise } from "../utils/random";
import type { DromeCycle, Metronome } from "../types";

type RandMapper = (r: number, start: number, end: number) => number;

interface DromeRandomArrayOption {
  met: Metronome;
  offset: number | number[] | undefined;
  loop: number | undefined;
  length: number;
  range: { start: number; end: number };
  mapper: RandMapper;
}

class DromeRandomArray extends DromeArray {
  private met: Metronome;
  private offset: number | number[];
  private loop: number | null;
  private length: number;
  private range: { start: number; end: number };
  private mapper: RandMapper;

  constructor(opts: DromeRandomArrayOption) {
    super();
    this.met = opts.met;
    this.length = opts.length;
    this.offset = opts.offset ?? 0;
    this.loop = opts.loop ?? null;
    this.range = opts.range;
    this.mapper = opts.mapper;
  }

  get value() {
    const offsets = [this.offset].flat();
    const offsetIndex =
      Math.floor(this.met.bar / (this.loop ?? 1)) % offsets.length;

    const progress = this.loop ? this.met.bar % this.loop : this.met.bar;
    let seed = getSeed(offsets[offsetIndex] + progress);
    const nextCycle: DromeCycle = [[]];

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
        if (val == null) {
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

  //   get value() {
  //     const offsets = [this.offset].flat();
  //     const nextCycle: DromeCycle = [];

  //     offsets.forEach((offset, i) => {
  //       const progress = this.loop > 0 ? this.met.bar % this.loop : this.met.bar;
  //       let seed = getSeed(offset + progress);

  //       for (let j = 0; j < this.length; j++) {
  //         const rFloat = Math.abs(seedToRand(seed));
  //         const rand = this.mapper(rFloat, this.range.start, this.range.end);
  //         if (!nextCycle[i]) nextCycle.push([rand]);
  //         else nextCycle[i].push(rand);
  //         seed = xorwise(seed);
  //       }
  //     });

  //     console.log(nextCycle);

  //     return nextCycle;
  //   }
}

export default DromeRandomArray;
