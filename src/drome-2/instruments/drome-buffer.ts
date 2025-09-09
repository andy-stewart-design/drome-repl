import { applyEnvelope } from "../utils/adsr";
import type { ADSRParams, FilterOptions, FilterType } from "../types";
import FilterEffect from "../effects/filter";

interface DromeBufferOptions {
  gain: number;
  env: ADSRParams;
  rate: number;
  filters: Map<FilterType, FilterOptions>;
}

class DromeBuffer {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private baseGain = 1;
  private gain: number;
  private srcNodes: AudioBufferSourceNode[] = [];
  private env: ADSRParams;
  private startTime: number | undefined;
  private filters: Map<FilterType, FilterEffect> = new Map();

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    buffer: AudioBuffer,
    { gain, env, rate: playbackRate, filters }: DromeBufferOptions
  ) {
    this.ctx = ctx;
    this.gainNode = new GainNode(this.ctx, { gain: 0 });
    this.gain = gain;
    this.env = env;

    const src = new AudioBufferSourceNode(this.ctx, { playbackRate });
    src.buffer = buffer;
    this.srcNodes.push(src);

    const filterNodes: BiquadFilterNode[] = [];

    filters?.forEach((opts) => {
      if (opts.env?.depth && !opts.env.adsr) opts.env.adsr = { ...env };
      const effect = new FilterEffect(this.ctx, opts);
      this.filters.set(opts.type, effect);
      filterNodes.push(effect.input);
    });

    for (const node of this.srcNodes) {
      const nodes = [node, this.gainNode, ...filterNodes, destination];
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
      duration: Math.max(duration, this.srcNodes[0].buffer?.duration ?? 0),
      maxVal: this.gain * this.baseGain,
      startVal: 0,
      env: this.env,
    });

    this.srcNodes.forEach((node) => {
      node.start(startTime);
      const dur = Math.max(node.buffer?.duration ?? 0, duration);
      node.stop(startTime + dur + 0.05);
    });

    this.startTime = startTime;
  }

  stop(when?: number) {
    // if (!this.isPlaying || this.isStopped) return; // Todo: do I need this???
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

export default DromeBuffer;
