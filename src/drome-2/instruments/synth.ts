import type MasterGain from "../core/master-gain";
import DelayEffect from "../effects/delay";
import FilterEffect from "../effects/filter";
import ReverbEffect from "../effects/reverb";
import Oscillator from "./oscillator";

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
    const lpf = new FilterEffect(this.ctx, { type: "lowpass", frequency });
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
    const pulse = new Oscillator(this.ctx, {
      type: this.type,
      frequency: 130.81,
      duration: 1,
    });
    if (this.ctx.state === "suspended") this.ctx.resume();
    pulse.trigger(destination.input);
  }
}

export default Synth;

const isAudioNode = (
  node: DromeAudioNode | undefined
): node is DromeAudioNode => {
  return node !== undefined;
};
