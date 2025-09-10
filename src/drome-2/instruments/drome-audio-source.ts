import FilterEffect from "../effects/filter";
import { applyEnvelope } from "../utils/adsr";
import type { ADSRParams, FilterOptions, FilterType, OscType } from "../types";

interface BaseAudioSourceOptions {
  gain: number;
  env: ADSRParams;
  filters: Map<FilterType, FilterOptions>;
  pan: number;
}

interface DromeOscillatorOptions extends BaseAudioSourceOptions {
  type: "oscillator";
  waveform: OscType;
  frequency: number;
}

interface DromeBufferOptions extends BaseAudioSourceOptions {
  type: "buffer";
  buffer: AudioBuffer;
  rate: number;
}

type DromeAudioSourceOptions = DromeOscillatorOptions | DromeBufferOptions;

class DromeAudioSource {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private baseGain: number;
  private gain: number;
  private srcNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private env: ADSRParams;
  private startTime: number | undefined;
  private filters: Map<FilterType, FilterEffect> = new Map();

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    opts: DromeAudioSourceOptions
  ) {
    this.ctx = ctx;
    this.gainNode = new GainNode(this.ctx, { gain: 0 });
    this.gain = opts.gain;
    this.env = opts.env;
    this.baseGain = opts.type === "oscillator" ? 0.35 : 1;

    if (opts.type === "oscillator") {
      this.createOscillator(opts.waveform, opts.frequency);
    } else {
      this.createBuffer(opts.buffer, opts.rate);
    }

    const filterNodes: BiquadFilterNode[] = [];

    opts.filters?.forEach((fOpts) => {
      if (fOpts.env?.depth && !fOpts.env.adsr) fOpts.env.adsr = { ...opts.env };
      const effect = new FilterEffect(this.ctx, fOpts);
      this.filters.set(fOpts.type, effect);
      filterNodes.push(effect.input);
    });

    const pan = new StereoPannerNode(ctx, { pan: opts.pan });

    for (const osc of this.srcNodes) {
      const nodes = [osc, pan, this.gainNode, ...filterNodes, destination];
      for (let i = 0; i < nodes.length - 1; i++) {
        nodes[i].connect(nodes[i + 1]);
      }
    }
  }

  private createBuffer(buffer: AudioBuffer, playbackRate: number) {
    const src = new AudioBufferSourceNode(this.ctx, { playbackRate });
    src.buffer = buffer;
    this.srcNodes.push(src);
  }

  private createOscillator(type: OscType, frequency: number) {
    if (type !== "supersaw") {
      this.srcNodes.push(new OscillatorNode(this.ctx, { type, frequency }));
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
        this.srcNodes.push(osc);
      }
    }
  }

  private getDuration(duration: number) {
    const src = this.srcNodes[0];
    if (src instanceof OscillatorNode) return duration;
    else return Math.max(duration, src.buffer?.duration ?? 0);
  }

  play(startTime: number, duration: number) {
    this.filters.forEach((filter) => {
      filter.apply(startTime, duration);
    });

    applyEnvelope({
      target: this.gainNode.gain,
      startTime,
      duration: this.getDuration(duration),
      maxVal: this.gain * this.baseGain * (this.srcNodes.length > 2 ? 0.75 : 1),
      minVal: 0,
      startVal: 0.01,
      env: this.env,
    });

    this.srcNodes.forEach((node) => {
      const jitter = this.srcNodes.length > 1 ? Math.random() * 0.005 : 0;
      node.start(startTime + jitter);
      const releaseTime = this.env.r * duration;
      node.stop(startTime + this.getDuration(duration) + releaseTime + 0.2);
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
      this.gainNode.gain.cancelScheduledValues(stopTime);

      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, stopTime);
      this.gainNode.gain.linearRampToValueAtTime(0, stopTime + releaseTime);

      this.srcNodes.forEach((osc) => osc.stop(stopTime + releaseTime));
    }
  }

  get node() {
    return this.srcNodes[0];
  }
}

export default DromeAudioSource;
