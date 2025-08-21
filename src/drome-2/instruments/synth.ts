import type MasterGain from "../core/master-gain";
import DelayEffect from "../effects/delay";
import FilterEffect from "../effects/filter";
import ReverbEffect from "../effects/reverb";
import Oscillator from "./oscillator";
import type { ADSRParams } from "@/drome-2/types";

type FilterType = Exclude<
  BiquadFilterType,
  "allpass" | "highshelf" | "lowshelf" | "notch" | "peaking"
>;

type DromeAudioNode = DelayEffect | FilterEffect | ReverbEffect | MasterGain;

class Synth {
  private ctx: AudioContext;

  private type: OscillatorType;
  private _filters: Map<FilterType, FilterEffect> = new Map();
  private _delay: DelayEffect | undefined;
  private _reverb: ReverbEffect | undefined;
  private _destination: DromeAudioNode;
  private _env: ADSRParams = { a: 0.01, d: 0.125, s: 0.5, r: 0.01 };

  constructor(
    ctx: AudioContext,
    destination: DromeAudioNode,
    type: OscillatorType = "sine"
  ) {
    this.ctx = ctx;
    this._destination = destination;
    this.type = type;
  }

  private connectChain() {
    const nodes = [
      ...this._filters.values(),
      this._reverb,
      this._delay,
      this._destination,
    ].filter(isAudioNode);

    nodes.forEach((node, i) => {
      const nextInput = nodes[i + 1]?.input ?? this.ctx.destination;
      node.connect(nextInput);
    });

    return nodes[0];
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
    const lpf = new FilterEffect(this.ctx, { type: "bandpass", frequency });
    this._filters.set("bandpass", lpf);
    return this;
  }

  hpf(frequency: number) {
    const lpf = new FilterEffect(this.ctx, { type: "highpass", frequency });
    this._filters.set("highpass", lpf);
    return this;
  }

  lpf(frequency: number) {
    const lpf = new FilterEffect(this.ctx, {
      type: "lowpass",
      frequency,
      env: { depth: 2, adsr: { a: 0.01, d: 0.01, s: 1.0, r: 0.01 } },
    });
    this._filters.set("lowpass", lpf);
    return this;
  }

  delay(delayTime = 0.25, feedback = 0.25, mix = 0.3) {
    this._delay = new DelayEffect(this.ctx, { delayTime, feedback, mix });
    return this;
  }

  reverb(duration = 1, decay = 1, mix = 0.5) {
    this._reverb = new ReverbEffect(this.ctx, { duration, decay, mix });
    return this;
  }

  play() {
    const destination = this.connectChain();
    const osc = new Oscillator(this.ctx, destination.input, {
      type: this.type,
      frequency: 130.81,
      duration: 1,
      env: this._env,
    });
    osc.play();
  }
}

export default Synth;

const isAudioNode = (
  node: DromeAudioNode | undefined
): node is DromeAudioNode => {
  return node !== undefined;
};
