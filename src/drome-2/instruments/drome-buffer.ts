import { applyEnvelope } from "../utils/adsr";
import type { ADSRParams } from "../types";

interface DromeBufferOptions {
  gain?: number;
  env?: ADSRParams;
  rate?: number;
}

class DromeBuffer {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private baseGain = 0.75;
  private gain: number;
  private srcNodes: AudioBufferSourceNode[] = [];
  private sampleDuration: number;
  private env: ADSRParams;
  private startTime: number | undefined;

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    buffer: AudioBuffer,
    {
      gain = 1,
      env = { a: 0.01, d: 0.01, s: 1.0, r: 0.01 },
      rate: playbackRate = 1,
    }: DromeBufferOptions = {}
  ) {
    this.ctx = ctx;
    this.gainNode = new GainNode(this.ctx, { gain: 0 });
    this.gain = gain;
    const src = new AudioBufferSourceNode(this.ctx, { playbackRate });
    src.buffer = buffer;
    this.sampleDuration = buffer.duration;
    this.srcNodes.push(src);
    this.env = env;
    this.srcNodes.forEach((node) =>
      node.connect(this.gainNode).connect(destination)
    );
  }

  play(startTime: number, duration: number) {
    applyEnvelope({
      target: this.gainNode.gain,
      startTime,
      duration: this.sampleDuration,
      maxVal: this.gain * this.baseGain,
      startVal: 0,
      env: this.env,
    });

    this.srcNodes.forEach((node) => {
      node.start(startTime);
      node.stop(startTime + Math.max(this.sampleDuration, duration) + 0.05);
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
