import DelayEffect from "../effects/delay";
import FilterEffect from "../effects/filter";
import ReverbEffect from "../effects/reverb";
import DistortionEffect from "../effects/distortion";
import DromeGain from "../core/drome-gain";
import type {
  ADSRParams,
  DromeAudioNode,
  FilterOptions,
  FilterType,
} from "../types";
// import { applyEnvelope } from "../utils/adsr";

class DromeInstrument {
  readonly ctx: AudioContext;
  private _destination: DromeAudioNode;

  public _gain = 1;
  private _filters: Map<FilterType, FilterOptions> = new Map();
  private _delay: DelayEffect | undefined;
  private _reverb: ReverbEffect | undefined;
  private _distortion: DistortionEffect | undefined;
  private _postgain: DromeGain;
  public _env: ADSRParams = { a: 0.001, d: 0.125, s: 1.0, r: 0.1 };

  constructor(ctx: AudioContext, destination: DromeAudioNode) {
    this.ctx = ctx;
    this._destination = destination;
    this._postgain = new DromeGain(this.ctx, 1);
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

  _play(startTime: number, duration: number) {
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
      if (node instanceof FilterEffect) node.apply(startTime, duration);
    });

    return nodes[0];
  }
}

export default DromeInstrument;

const isAudioNode = (
  node: DromeAudioNode | undefined
): node is DromeAudioNode => {
  return node !== undefined;
};
