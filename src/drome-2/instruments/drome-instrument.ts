import DelayEffect from "../effects/delay";
import DistortionEffect from "../effects/distortion";
import GainEffect from "../effects/gain";
import ReverbEffect from "../effects/reverb";
import type Drome from "../core/drome";
import type {
  ADSRParams,
  DromeAudioNode,
  FilterOptions,
  FilterType,
} from "../types";
import DromeRandomArray from "../core/drome-random-array";

import DromeArray from "../core/drome-array";
import type {
  DromeCycle,
  DromeCyclePartial,
  DromeArrangement,
} from "../core/drome-array";
import type DromeAudioSource from "./drome-audio-source";

class DromeInstrument<T extends number | number[]> {
  readonly drome: Drome;
  private _destination: DromeAudioNode[];
  protected cycles: DromeArray<T>;

  protected readonly _filters: Map<FilterType, FilterOptions> = new Map();
  private _delay: DelayEffect | undefined;
  private _reverb: ReverbEffect | undefined;
  private _distortion: DistortionEffect | undefined;
  private _gain = new DromeArray([[1]]);
  private _postgain: GainEffect;
  private _pan = new DromeArray([[0]]);
  protected _legato = false;
  private _vibratoParams: { depth: number; speed: number } | undefined;
  protected _vibratoNodes: { osc: OscillatorNode; gain: GainNode } | undefined;
  protected _channelIndex: number | undefined;
  protected readonly _env: ADSRParams = { a: 0.001, d: 0.125, s: 1.0, r: 0.01 };

  // Method aliases
  public rev: () => this;
  public seq: (...args: [...number[][], number]) => this;
  public vib: (depth: number, speed?: number) => this;

  constructor(
    drome: Drome,
    destination: DromeAudioNode[],
    defaultCycle: DromeCycle<T>
  ) {
    this.drome = drome;
    this._destination = destination;
    this._postgain = new GainEffect(this.drome.ctx, 1);
    this.cycles = new DromeArray<T>(defaultCycle);
    this.rev = this.reverse.bind(this);
    this.seq = this.sequence.bind(this);
    this.vib = this.vibrato.bind(this);
  }

  protected applyVibrato(osc: DromeAudioSource) {
    if (!this._vibratoParams) return;
    const { depth, speed } = this._vibratoParams;
    const modulator = new OscillatorNode(this.drome.ctx, {
      type: "sine",
      frequency: speed,
    });
    const modulatorGain = new GainNode(this.drome.ctx, { gain: depth });
    modulator.connect(modulatorGain);
    osc.nodes.forEach((node) => modulatorGain.connect(node.detune));
    modulator.start();
    this._vibratoNodes = { osc: modulator, gain: modulatorGain };
  }

  /* ----------------------------------------------------------------
  /* PATTERN METHODS
  ---------------------------------------------------------------- */

  note(...cycles: DromeCyclePartial<T>[] | [DromeArray<T>]) {
    if (isDromeArrayTuple(cycles)) this.apply(cycles[0]);
    else this.cycles.note(...cycles);
    return this;
  }

  apply(dromeArray: DromeArray<T>) {
    if (
      dromeArray instanceof DromeRandomArray &&
      this.cycles.getRawValue().length
    ) {
      dromeArray.value = this.cycles.value;
    }
    this.cycles = dromeArray;
    return this;
  }

  arrange(...arrangements: DromeArrangement<T>[]) {
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

  reverse() {
    this.cycles.reverse();
    return this;
  }

  sequence(...args: [...number[][], number]) {
    this.cycles.sequence(...args);
    return this;
  }

  struct(...patterns: number[][] | [DromeArray<T>]) {
    if (isDromeArrayTuple(patterns)) this.apply(patterns[0]);
    else this.cycles.struct(...patterns);
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

  gain(...n: (number | number[])[] | [DromeArray<number>]) {
    if (isDromeArrayTuple(n)) {
      this._gain = n[0];
      return this;
    }

    this._gain.value = n.map((m) => (Array.isArray(m) ? m : [m]));
    return this;
  }

  postgain(n: number) {
    this._postgain.volume = n;
    return this;
  }

  pan(...n: (number | number[])[] | [DromeArray<number>]) {
    if (isDromeArrayTuple(n)) {
      this._pan = n[0];
      return this;
    }

    this._pan.value = n.map((m) => (Array.isArray(m) ? m : [m]));
    return this;
  }

  adsr(a: number, d?: number, s?: number, r?: number) {
    this._env.a = a;
    if (typeof d === "number") this._env.d = d;
    if (typeof s === "number") this._env.s = s;
    if (typeof r === "number") this._env.r = r;
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
    this._reverb = new ReverbEffect(this.drome, { duration, mix });
    return this;
  }

  vibrato(depth: number, speed = 1) {
    this._vibratoParams = { depth: depth * 100, speed };
    return this;
  }

  achan(n: number) {
    this._channelIndex = n;
    return this;
  }

  connectChain() {
    const nodes = [
      this._distortion,
      this._delay,
      this._reverb,
      this._postgain,
      this._destination[this._channelIndex ?? 0],
    ].filter(isAudioNode);

    nodes.forEach((node, i) => {
      const nextInput = nodes[i + 1]?.input ?? this.drome.ctx.destination;
      node.connect(nextInput);
    });

    return nodes;
  }

  getCurrentGain(cycleIndex: number, noteIndex: number) {
    const value = this._gain.value.length ? this._gain.value : [[1]];
    const currentGain =
      value[this.drome.metronome.bar % value.length][
        noteIndex % value[cycleIndex % value.length].length
      ];

    return currentGain ?? 1;
  }

  getCurrentPan(cycleIndex: number, noteIndex: number) {
    const value = this._pan.value.length ? this._pan.value : [[1]];
    const currentPan =
      value[this.drome.metronome.bar % value.length][
        noteIndex % value[cycleIndex % value.length].length
      ];
    return currentPan ?? 0;
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
    if (this._vibratoNodes) {
      this._vibratoNodes.osc.stop();
      this._vibratoNodes.gain.disconnect();
      this._vibratoNodes = undefined;
    }

    this._filters.clear();
    this.cycles.clear();
    this._gain.clear();
  }
}

export default DromeInstrument;

const isAudioNode = (
  node: DromeAudioNode | undefined
): node is DromeAudioNode => {
  return node !== undefined;
};

function isDromeArrayTuple<T>(n: any[]): n is [DromeArray<T>] {
  return n[0] instanceof DromeArray;
}
