import DelayEffect from "../effects/delay";
import DistortionEffect from "../effects/distortion";
import GainEffect from "../effects/gain";
import ReverbEffect from "../effects/reverb";
import { euclid } from "../utils/euclid-2";
import { hex } from "../utils/hex";
import type Drome from "../core/drome";
import type {
  ADSRParams,
  CycleValue,
  DromeAudioNode,
  FilterOptions,
  FilterType,
} from "../types";

class DromeInstrument {
  readonly drome: Drome;
  private _destination: DromeAudioNode;
  public cycles: (CycleValue | CycleValue[])[][];

  private _gain: number[][] = [[1]];
  readonly _filters: Map<FilterType, FilterOptions> = new Map();
  private _delay: DelayEffect | undefined;
  private _reverb: ReverbEffect | undefined;
  private _distortion: DistortionEffect | undefined;
  private _postgain: GainEffect;
  readonly _env: ADSRParams = { a: 0.001, d: 0.125, s: 1.0, r: 0.01 };

  constructor(
    drome: Drome,
    destination: DromeAudioNode,
    type: "synth" | "sample"
  ) {
    this.drome = drome;
    this._destination = destination;
    this._postgain = new GainEffect(this.drome.ctx, 1);
    if (type === "synth") this.cycles = [];
    else this.cycles = [[1]];
  }

  /* ----------------------------------------------------------------
  /* PATTERN METHODS
  ---------------------------------------------------------------- */

  private applyPattern(patterns: number[][]) {
    const cycles = this.cycles.length ? this.cycles : [[60]];
    const loops = Math.max(cycles.length, patterns.length);
    const nextCycles: (CycleValue | CycleValue[])[][] = [];

    for (let i = 0; i < loops; i++) {
      let noteIndex = 0;
      const cycle = cycles[i % cycles.length];
      const nextCycle = patterns[i % patterns.length].map((p) =>
        p === 0 ? (null as CycleValue) : cycle[noteIndex++ % cycle.length]
      );
      nextCycles.push(nextCycle);
    }

    return nextCycles;
  }

  note(...cycles: (CycleValue | CycleValue[] | CycleValue[][])[]) {
    this.cycles = cycles.map((cycle) =>
      Array.isArray(cycle) ? cycle : [cycle]
    );

    return this;
  }

  arrange(
    ...arrangements: [number, CycleValue | CycleValue[] | CycleValue[][]][]
  ) {
    let nextCycles: typeof this.cycles = [];

    for (const arr of arrangements) {
      for (let i = 0; i < arr[0]; i++) {
        nextCycles.push(Array.isArray(arr[1]) ? arr[1] : [arr[1]]);
      }
    }

    this.cycles = nextCycles;
    return this;
  }

  euclid(pulses: number | number[], steps: number, rotation = 0) {
    this.cycles = this.applyPattern(euclid(pulses, steps, rotation));

    return this;
  }

  hex(...hexes: (string | number)[]) {
    this.cycles = this.applyPattern(hexes.map(hex));
    return this;
  }

  sequence(...args: [...number[][], number]) {
    const steps = args[args.length - 1] as number;
    const pulses = args.slice(0, -1) as number[][];
    const patterns = pulses.map((p) => {
      return Array.from({ length: steps }, (_, i) => (p.includes(i) ? 1 : 0));
    });
    this.cycles = this.applyPattern(patterns);
    return this;
  }

  struct(...patterns: number[][]) {
    this.cycles = this.applyPattern(patterns);
    return this;
  }

  fast(multiplier: number) {
    if (multiplier <= 1) return this;
    const length = Math.ceil(this.cycles.length / multiplier);
    const numLoops = multiplier * length;
    const nextCyles: typeof this.cycles = Array.from({ length }, () => []);

    for (let i = 0; i < numLoops; i++) {
      const currentIndex = Math.floor(i / multiplier);
      nextCyles[currentIndex].push(...this.cycles[i % this.cycles.length]);
    }

    this.cycles = nextCyles;
    return this;
  }

  slow(n: number) {
    if (n <= 1) return this;
    const nextCycles: (CycleValue | CycleValue[])[][] = [];

    for (const cycle of this.cycles) {
      const chunkSize = Math.ceil((cycle.length * n) / n); // equals cycle.length

      // Create n chunks directly
      for (let k = 0; k < n; k++) {
        const chunk: (CycleValue | CycleValue[])[] = [];
        const startPos = k * chunkSize;
        const endPos = Math.min((k + 1) * chunkSize, cycle.length * n);

        for (let pos = startPos; pos < endPos; pos++) {
          if (pos % n === 0) chunk.push(cycle[pos / n]);
          else chunk.push(null as CycleValue);
        }

        nextCycles.push(chunk);
      }
    }

    this.cycles = nextCycles;
    return this;
  }

  stretch(factor: number) {
    this.cycles = this.cycles.flatMap((cycle) => Array(factor).fill(cycle));
    return this;
  }

  /* ----------------------------------------------------------------
  /* EFFECTS METHODS
  ---------------------------------------------------------------- */

  private addFilter(type: FilterType, frequency: number) {
    this._filters.set(type, { type, frequency, env: undefined, q: 1 });
  }

  private updateFilter(t: FilterType, d: number, adsr?: ADSRParams) {
    const filter = this._filters.get(t);
    if (!filter) return this;
    filter.env = { depth: d, adsr };
  }

  gain(...n: (number | number[])[]) {
    this._gain = n.map((m) => (Array.isArray(m) ? m : [m]));
    return this;
  }

  postgain(n: number) {
    this._postgain.volume = n;
    return this;
  }

  adsr(p1: Partial<ADSRParams>): this;
  adsr(p1: number, d?: number, s?: number, r?: number): this;
  adsr(p1: Partial<ADSRParams> | number, d?: number, s?: number, r?: number) {
    if (typeof p1 === "number") {
      this._env.a = p1;
      if (typeof d === "number") this._env.d = d;
      if (typeof s === "number") this._env.s = s;
      if (typeof r === "number") this._env.r = r;
    } else {
      if (typeof p1.a === "number") this._env.a = p1.a;
      if (typeof p1.d === "number") this._env.d = p1.d;
      if (typeof p1.s === "number") this._env.s = p1.s;
      if (typeof p1.r === "number") this._env.r = p1.r;
    }
    return this;
  }

  bpf(frequency: number) {
    this.addFilter("bandpass", frequency);
    return this;
  }

  bpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    const adsr =
      typeof a === "number"
        ? { a, d: d ?? this._env.d, s: s ?? this._env.s, r: r ?? this._env.r }
        : undefined;
    this.updateFilter("bandpass", depth, adsr);
    return this;
  }

  hpf(frequency: number) {
    this.addFilter("highpass", frequency);
    return this;
  }

  hpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    const adsr =
      typeof a === "number"
        ? { a, d: d ?? this._env.d, s: s ?? this._env.s, r: r ?? this._env.r }
        : undefined;
    this.updateFilter("highpass", depth, adsr);
    return this;
  }

  lpf(frequency: number) {
    this.addFilter("lowpass", frequency);
    return this;
  }

  lpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    const adsr =
      typeof a === "number"
        ? { a, d: d ?? this._env.d, s: s ?? this._env.s, r: r ?? this._env.r }
        : undefined;
    this.updateFilter("lowpass", depth, adsr);
    return this;
  }

  delay(feedback: number, delayTime = 0.25, mix = 0.3) {
    this._delay = new DelayEffect(this.drome.ctx, { delayTime, feedback, mix });
    return this;
  }

  distort(amount: number, mix = 1, oversample: OverSampleType = "2x") {
    this._distortion = new DistortionEffect(this.drome.ctx, {
      amount,
      mix,
      oversample,
    });
    return this;
  }

  reverb(mix: number, duration = 2) {
    this._reverb = new ReverbEffect(this.drome.ctx, { duration, mix });
    return this;
  }

  connectChain() {
    const nodes = [
      this._distortion,
      this._delay,
      this._reverb,
      this._postgain,
      this._destination,
    ].filter(isAudioNode);

    nodes.forEach((node, i) => {
      const nextInput = nodes[i + 1]?.input ?? this.drome.ctx.destination;
      node.connect(nextInput);
    });

    return nodes;
  }

  cleanup() {
    if (this._delay) {
      this._delay.disconnect();
      this._delay = undefined;
    }
    if (this._reverb) {
      this._reverb.disconnect();
      this._reverb = undefined;
    }
    if (this._distortion) {
      this._distortion.disconnect();
      this._distortion = undefined;
    }
    if (this._postgain) {
      this._postgain.disconnect();
      this._postgain.volume = 1;
    }

    this._filters.clear();
    this.cycles = [];
    this._gain = [];
  }

  getCurrentGain(cycleIndex: number, noteIndex: number) {
    return this._gain[this.drome.metronome.bar % this._gain.length][
      noteIndex % this._gain[cycleIndex].length
    ];
  }
}

export default DromeInstrument;

const isAudioNode = (
  node: DromeAudioNode | undefined
): node is DromeAudioNode => {
  return node !== undefined;
};
