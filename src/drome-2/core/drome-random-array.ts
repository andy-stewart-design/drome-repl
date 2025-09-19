import DromeArray from "./drome-array";
import { getSeed, seedToRand, xorwise } from "../utils/random";
import type { DromeCycle, Metronome } from "../types";

type RandMapper = (r: number, start: number, end: number) => number;

interface DromeRandomArrayOption {
  met: Metronome;
  offset: number | undefined;
  loop: number | undefined;
  length: number;
  range: { start: number; end: number };
  mapper: RandMapper;
}

class DromeRandomArray extends DromeArray {
  private met: Metronome;
  private offset: number;
  private loop: number;
  private length: number;
  private range: { start: number; end: number };
  private mapper: RandMapper;

  constructor(opts: DromeRandomArrayOption) {
    super();
    this.met = opts.met;
    this.length = opts.length;
    this.offset = opts.offset ?? 0;
    this.loop = opts.loop ?? -1;
    this.range = opts.range;
    this.mapper = opts.mapper;
  }

  get value() {
    const progress = this.loop > 0 ? this.met.bar % this.loop : this.met.bar;
    let seed = getSeed(this.offset + progress);
    const nextCycle: DromeCycle = [[]];

    for (let i = 0; i < this.length; i++) {
      const rFloat = Math.abs(seedToRand(seed));
      nextCycle[0].push(this.mapper(rFloat, this.range.start, this.range.end));
      seed = xorwise(seed);
    }

    return nextCycle;
  }
}

export default DromeRandomArray;
