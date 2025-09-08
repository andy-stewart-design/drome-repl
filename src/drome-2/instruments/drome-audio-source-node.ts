import FilterEffect from "../effects/filter";
import { applyEnvelope } from "../utils/adsr";
import type { ADSRParams, FilterOptions, FilterType } from "../types";

interface DromeOscillatorOptions {
  gain: number;
  env: ADSRParams;
  filters: Map<FilterType, FilterOptions>;
}

class DromeOscillator {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private baseGain = 0.35;
  private gain: number;
  private srcNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private env: ADSRParams;
  private startTime: number | undefined;
  private filters: Map<FilterType, FilterEffect> = new Map();

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    { gain, env, filters }: DromeOscillatorOptions
  ) {
    this.ctx = ctx;
    this.gainNode = new GainNode(this.ctx, { gain: 0 });
    this.gain = gain;
    this.env = env;

    const filterNodes: BiquadFilterNode[] = [];

    filters?.forEach((opts) => {
      if (opts.env?.depth && !opts.env.adsr) opts.env.adsr = { ...env };
      const effect = new FilterEffect(this.ctx, opts);
      this.filters.set(opts.type, effect);
      filterNodes.push(effect.input);
    });

    for (const osc of this.srcNodes) {
      const nodes = [osc, this.gainNode, ...filterNodes, destination];
      for (let i = 0; i < nodes.length - 1; i++) {
        nodes[i].connect(nodes[i + 1]);
      }
    }
  }

  play(startTime: number, duration: number) {
    this.filters.forEach((filter) => {
      filter.apply(startTime, duration);
    });

    applyEnvelope({
      target: this.gainNode.gain,
      startTime,
      duration,
      maxVal: this.gain * this.baseGain * (this.srcNodes.length > 2 ? 0.75 : 1),
      minVal: 0,
      startVal: 0.01,
      env: this.env,
    });

    this.srcNodes.forEach((node) => {
      const jitter = this.srcNodes.length > 1 ? Math.random() * 0.005 : 0;
      node.start(startTime + jitter);
      const releaseTime = this.env.r * duration;
      node.stop(startTime + duration + releaseTime + 0.2);
    });

    this.startTime = startTime;
  }

  stop(when?: number) {
    if (!this.startTime) return;
    const stopTime = when ?? this.ctx.currentTime;
    const releaseTime = 0.125;

    if (this.startTime > this.ctx.currentTime) {
      this.srcNodes.forEach((osc) => osc.stop());
    } else {
      // Cancel any scheduled value changes after the stop time
      this.gainNode.gain.cancelScheduledValues(stopTime);

      // Apply a quick release envelope to avoid clicks
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, stopTime);
      this.gainNode.gain.linearRampToValueAtTime(0, stopTime + releaseTime);

      // Stop the oscillator after the release
      this.srcNodes.forEach((osc) => osc.stop(stopTime + releaseTime));
    }
  }

  get node() {
    return this.srcNodes[0];
  }
}
export default DromeOscillator;
