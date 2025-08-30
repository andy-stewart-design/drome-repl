import DelayEffect from "../effects/delay";
import FilterEffect from "../effects/filter";
import ReverbEffect from "../effects/reverb";
import DistortionEffect from "../effects/distortion";
import GainEffect from "../effects/gain";
import { euclid } from "../utils/euclid-2";
import { midiToFreq } from "../utils/midi-to-frequency";
import type {
  ADSRParams,
  DromeAudioNode,
  FilterOptions,
  FilterType,
  SampleNote,
} from "../types";
import { hex } from "../utils/hex";
import type Drome from "../core/drome";

class DromeInstrument<T extends SampleNote | number> {
  readonly drome: Drome;
  private _destination: DromeAudioNode;
  public cycles: (T | T[])[][] = [];

  public _gain = 1;
  readonly _filters: Map<FilterType, FilterOptions> = new Map();
  private _delay: DelayEffect | undefined;
  private _reverb: ReverbEffect | undefined;
  private _distortion: DistortionEffect | undefined;
  private _postgain: GainEffect;
  readonly _env: ADSRParams = { a: 0.001, d: 0.125, s: 1.0, r: 0.01 };

  constructor(drome: Drome, destination: DromeAudioNode) {
    this.drome = drome;
    this._destination = destination;
    this._postgain = new GainEffect(this.drome.ctx, 1);
  }

  /* ----------------------------------------------------------------
  /* PATTERN METHODS
  ---------------------------------------------------------------- */

  private getPlaceholder(): T {
    // Must use a type assertion here because TS can't infer dynamically
    return (typeof (null as any as T) === "number" ? 0 : "") as T;
  }

  private applyPattern(pattern: number[]) {
    const placeholder = this.getPlaceholder();

    return this.cycles.map((cycle) => {
      let noteIndex = 0;
      return pattern.map((p) =>
        p === 0 ? placeholder : cycle[noteIndex++ % cycle.length]
      );
    });
  }

  private applyPattern2(patterns: number[][]) {
    const placeholder = this.getPlaceholder();
    const loops = Math.max(this.cycles.length, patterns.length);
    const nextCycles: (T | T[])[][] = [];

    for (let i = 0; i < loops; i++) {
      let noteIndex = 0;
      const cycle = this.cycles[i % this.cycles.length];
      const nextCycle = patterns[i % patterns.length].map((p) =>
        p === 0 ? placeholder : cycle[noteIndex++ % cycle.length]
      );
      nextCycles.push(nextCycle);
    }

    return nextCycles;
  }

  note(...cycles: (T | T[] | T[][])[]) {
    const convert = <T extends SampleNote | number>(x: T): T =>
      typeof x === "number" ? (midiToFreq(x) as T) : x;

    this.cycles = cycles.map((cycle) =>
      (Array.isArray(cycle) ? cycle : [cycle]).map((element) =>
        Array.isArray(element) ? element.map(convert) : convert(element)
      )
    );

    return this;
  }

  euclid(pulses: number | number[], steps: number, rotation = 0) {
    this.cycles = this.applyPattern2(euclid(pulses, steps, rotation));
    return this;
  }

  hex(...hexes: (string | number)[]) {
    this.cycles = this.applyPattern2(hexes.map(hex));
    return this;
  }

  sequence(pulses: number[], steps: number) {
    const pattern = Array.from({ length: steps }, (_, i) =>
      pulses.includes(i) ? 1 : 0
    );
    this.cycles = this.applyPattern(pattern);
    return this;
  }

  struct(...patterns: number[][]) {
    this.cycles = this.applyPattern2(patterns);
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
    const nextCycles: (T | T[])[][] = [];
    const placeholder = this.getPlaceholder();

    for (const cycle of this.cycles) {
      const chunkSize = Math.ceil((cycle.length * n) / n); // equals cycle.length

      // Create n chunks directly
      for (let k = 0; k < n; k++) {
        const chunk: (T | T[])[] = [];
        const startPos = k * chunkSize;
        const endPos = Math.min((k + 1) * chunkSize, cycle.length * n);

        for (let pos = startPos; pos < endPos; pos++) {
          if (pos % n === 0) chunk.push(cycle[pos / n]);
          else chunk.push(placeholder);
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
    const env = { depth: 1, adsr: { ...this._env } };
    this._filters.set(type, { type, frequency, env, q: 1 });
  }

  private updateFilter(t: FilterType, de: number, env?: Partial<ADSRParams>) {
    const filter = this._filters.get(t);
    if (!filter) return this;
    filter.env.depth = de;

    if (typeof env.a === "number") filter.env.adsr.a = env.a;
    if (typeof env.d === "number") filter.env.adsr.d = env.d;
    if (typeof env.s === "number") filter.env.adsr.s = env.s;
    if (typeof env.r === "number") filter.env.adsr.r = env.r;
  }

  gain(n: number) {
    this._gain = n;
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
    this.updateFilter("bandpass", depth, { a, d, s, r });
    return this;
  }

  hpf(frequency: number) {
    this.addFilter("highpass", frequency);
    return this;
  }

  hpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this.updateFilter("highpass", depth, { a, d, s, r });
    return this;
  }

  lpf(frequency: number) {
    this.addFilter("lowpass", frequency);
    return this;
  }

  lpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this.updateFilter("lowpass", depth, { a, d, s, r });
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
    const filters = [...(this._filters?.values() ?? [])].map(
      (options) => new FilterEffect(this.drome.ctx, options)
    );

    const nodes = [
      ...filters,
      this._distortion,
      this._reverb,
      this._delay,
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
    this._gain = 1;
  }
}

export default DromeInstrument;

const isAudioNode = (
  node: DromeAudioNode | undefined
): node is DromeAudioNode => {
  return node !== undefined;
};
