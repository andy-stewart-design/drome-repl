import DelayEffect from "../effects/delay";
import DistortionEffect from "../effects/distortion";
import GainEffect from "../effects/gain";
import ReverbEffect from "../effects/reverb";
import DromeArray from "../core/drome-array";
import type Drome from "../core/drome";
import type {
  ADSRParams,
  DromeCycleValue,
  DromeAudioNode,
  FilterOptions,
  FilterType,
} from "../types";

class DromeInstrument {
  readonly drome: Drome;
  private _destination: DromeAudioNode;
  public cycles: DromeArray;

  private _gain: number[][] = [[1]];
  readonly _filters: Map<FilterType, FilterOptions> = new Map();
  private _delay: DelayEffect | undefined;
  private _reverb: ReverbEffect | undefined;
  private _distortion: DistortionEffect | undefined;
  private _postgain: GainEffect;
  private _pan = [[0]];
  protected _legato = false;
  readonly _env: ADSRParams = { a: 0.001, d: 0.125, s: 1.0, r: 0.01 };

  constructor(
    drome: Drome,
    destination: DromeAudioNode,
    type: "synth" | "sample"
  ) {
    this.drome = drome;
    this._destination = destination;
    this._postgain = new GainEffect(this.drome.ctx, 1);
    if (type === "synth") this.cycles = new DromeArray();
    else this.cycles = new DromeArray([[1]]);
  }

  /* ----------------------------------------------------------------
  /* PATTERN METHODS
  ---------------------------------------------------------------- */

  note(
    ...cycles: (DromeCycleValue | DromeCycleValue[] | DromeCycleValue[][])[]
  ) {
    this.cycles.note(...cycles);
    return this;
  }

  arrange(
    ...arrangements: [
      number,
      DromeCycleValue | DromeCycleValue[] | DromeCycleValue[][]
    ][]
  ) {
    this.cycles.arrange(...arrangements);
    return this;
  }

  euclid(pulses: number | number[], steps: number, rotation = 0) {
    this.cycles.euclid(pulses, steps, rotation);
    return this;
  }

  hex(...hexes: (string | number)[]) {
    this.cycles.hex(...hexes);
    return this;
  }

  sequence(...args: [...number[][], number]) {
    this.cycles.sequence(...args);
    return this;
  }

  struct(...patterns: number[][]) {
    this.cycles.struct(...patterns);
    return this;
  }

  fast(multiplier: number) {
    this.cycles.fast(multiplier);
    return this;
  }

  slow(n: number) {
    this.cycles.slow(n);
    return this;
  }

  stretch(factor: number) {
    this.cycles.stretch(factor);
    return this;
  }

  legato(v = true) {
    this._legato = v;
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

  pan(...n: (number | number[])[]) {
    this._pan = n.map((m) => (Array.isArray(m) ? m : [m]));
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

  getCurrentGain(cycleIndex: number, noteIndex: number) {
    return this._gain[this.drome.metronome.bar % this._gain.length][
      noteIndex % this._gain[cycleIndex % this._gain.length].length
    ];
  }

  getCurrentPan(cycleIndex: number, noteIndex: number) {
    return this._pan[this.drome.metronome.bar % this._pan.length][
      noteIndex % this._pan[cycleIndex % this._gain.length].length
    ];
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
    this.cycles.clear();
    this._gain = [];
  }
}

export default DromeInstrument;

const isAudioNode = (
  node: DromeAudioNode | undefined
): node is DromeAudioNode => {
  return node !== undefined;
};
