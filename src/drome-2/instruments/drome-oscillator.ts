import FilterEffect from "../effects/filter";
import { applyEnvelope } from "../utils/adsr";
import type { ADSRParams, FilterOptions, FilterType, OscType } from "../types";

interface DromeOscillatorOptions {
  type: OscType;
  frequency: number;
  gain: number;
  env: ADSRParams;
  filters: Map<FilterType, FilterOptions>;
}

class DromeOscillator {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private baseGain = 0.35;
  private gain: number;
  private oscNodes: OscillatorNode[] = [];
  private env: ADSRParams;
  private startTime: number | undefined;
  private filters: Map<FilterType, FilterEffect> = new Map();

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    { type, frequency, gain, env, filters }: DromeOscillatorOptions
  ) {
    this.ctx = ctx;
    this.gainNode = new GainNode(this.ctx, { gain: 0 });
    this.gain = gain;
    this.env = env;

    if (type !== "supersaw") {
      this.oscNodes.push(new OscillatorNode(this.ctx, { type, frequency }));
    } else {
      const voices = 7;
      const detune = 12;
      const type = "sawtooth";
      for (let i = 0; i < voices; i++) {
        const osc = new OscillatorNode(this.ctx, {
          type,
          frequency,
          detune: (i / (voices - 1) - 0.5) * 2 * detune,
        });
        this.oscNodes.push(osc);
      }
    }

    const filterNodes: BiquadFilterNode[] = [];

    filters?.forEach((opts) => {
      if (opts.env?.depth && !opts.env.adsr) opts.env.adsr = { ...env };
      const effect = new FilterEffect(this.ctx, opts);
      this.filters.set(opts.type, effect);
      filterNodes.push(effect.input);
    });

    for (const osc of this.oscNodes) {
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
      maxVal: this.gain * this.baseGain * (this.oscNodes.length > 2 ? 0.75 : 1),
      minVal: 0,
      startVal: 0.01,
      env: this.env,
    });

    this.oscNodes.forEach((node) => {
      const jitter = this.oscNodes.length > 1 ? Math.random() * 0.005 : 0;
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
      this.oscNodes.forEach((osc) => osc.stop());
    } else {
      // Cancel any scheduled value changes after the stop time
      this.gainNode.gain.cancelScheduledValues(stopTime);

      // Apply a quick release envelope to avoid clicks
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, stopTime);
      this.gainNode.gain.linearRampToValueAtTime(0, stopTime + releaseTime);

      // Stop the oscillator after the release
      this.oscNodes.forEach((osc) => osc.stop(stopTime + releaseTime));
    }
  }

  get node() {
    return this.oscNodes[0];
  }
}

export default DromeOscillator;
