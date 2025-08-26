import DelayEffect from "../effects/delay";
import FilterEffect from "../effects/filter";
import ReverbEffect from "../effects/reverb";
import DistortionEffect from "../effects/distortion";
import DromeGain from "../core/drome-gain";
import { euclid } from "../utils/euclid";
import { midiToFreq } from "../utils/midi-to-frequency";
import type {
  ADSRParams,
  DromeAudioNode,
  FilterOptions,
  FilterType,
  SampleNote,
} from "../types";

class DromeInstrument<T extends SampleNote | number> {
  readonly ctx: AudioContext;
  private _destination: DromeAudioNode;

  readonly notes: T[] = [];
  public cycles: (T | T[])[][] = [];

  public _gain = 1;
  readonly _filters: Map<FilterType, FilterOptions> = new Map();
  private _delay: DelayEffect | undefined;
  private _reverb: ReverbEffect | undefined;
  private _distortion: DistortionEffect | undefined;
  private _postgain: DromeGain;
  readonly _env: ADSRParams = { a: 0.001, d: 0.125, s: 1.0, r: 0.1 };

  constructor(ctx: AudioContext, destination: DromeAudioNode) {
    this.ctx = ctx;
    this._destination = destination;
    this._postgain = new DromeGain(this.ctx, 1);
  }

  note(...args: T[]) {
    this.notes.length = 0;
    this.notes.push(...args);
    return this;
  }

  note2(...cycles: (T | T[] | T[][])[]) {
    this.cycles = cycles.map((cycle) => {
      const patternArray = Array.isArray(cycle) ? cycle : [cycle];
      return patternArray.map((note) => {
        if (Array.isArray(note)) {
          return note.map((n) =>
            typeof n === "number" ? midiToFreq(n) : n
          ) as T[];
        } else if (typeof note === "number") {
          return midiToFreq(note) as T;
        } else return note;
      });
    });
    return this;
  }

  euclid(pulses: number, steps: number, rotation = 0) {
    const pattern = euclid(pulses, steps, rotation);
    let noteIndex = 0;

    const nextNotes = pattern.map((p) => {
      if (p === 0) return (typeof this.notes[0] === "number" ? 0 : "") as T;
      return this.notes[noteIndex++ % this.notes.length];
    });

    this.notes.length = 0;
    this.notes.push(...nextNotes);
    return this;
  }

  _addFilter(type: FilterType, frequency: number) {
    const env = { depth: 1, adsr: { ...this._env } };
    this._filters.set(type, { type, frequency, env, q: 1 });
  }

  _updateFilter(t: FilterType, de: number, env: Partial<ADSRParams>) {
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
    this._addFilter("bandpass", frequency);
    return this;
  }

  bpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this._updateFilter("bandpass", depth, { a, d, s, r });
    return this;
  }

  hpf(frequency: number) {
    this._addFilter("highpass", frequency);
    return this;
  }

  hpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this._updateFilter("highpass", depth, { a, d, s, r });
    return this;
  }

  lpf(frequency: number) {
    this._addFilter("lowpass", frequency);
    return this;
  }

  lpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this._updateFilter("lowpass", depth, { a, d, s, r });
    return this;
  }

  delay(feedback: number, delayTime = 0.25, mix = 0.3) {
    this._delay = new DelayEffect(this.ctx, { delayTime, feedback, mix });
    return this;
  }

  reverb(mix: number, duration = 2) {
    this._reverb = new ReverbEffect(this.ctx, { duration, mix });
    return this;
  }

  distort(amount: number, mix = 1, oversample: OverSampleType = "2x") {
    this._distortion = new DistortionEffect(this.ctx, {
      amount,
      mix,
      oversample,
    });
    return this;
  }

  connectChain() {
    const filters = [...(this._filters?.values() ?? [])].map(
      (options) => new FilterEffect(this.ctx, options)
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
      const nextInput = nodes[i + 1]?.input ?? this.ctx.destination;
      node.connect(nextInput);
    });

    return nodes;
  }
}

export default DromeInstrument;

const isAudioNode = (
  node: DromeAudioNode | undefined
): node is DromeAudioNode => {
  return node !== undefined;
};
