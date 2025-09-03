import { applyEnvelope } from "../utils/adsr";
import type { ADSRParams, OscType } from "../types";

interface DromeOscillatorOptions {
  type?: OscType;
  frequency?: number;
  gain?: number;
  env?: ADSRParams;
}

class DromeOscillator {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private baseGain = 0.35;
  private gain: number;
  private oscNodes: OscillatorNode[] = [];
  private env: ADSRParams;
  private startTime: number | undefined;

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    {
      type = "sine",
      frequency = 220,
      gain = 1,
      env = { a: 0.01, d: 0.01, s: 1.0, r: 0.01 },
    }: DromeOscillatorOptions = {}
  ) {
    this.ctx = ctx;
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
    this.gainNode = new GainNode(this.ctx, { gain: 0 });
    this.gain = gain;
    this.env = env;
    this.oscNodes.forEach((node) =>
      node.connect(this.gainNode).connect(destination)
    );
  }

  play(startTime: number, duration: number) {
    applyEnvelope({
      target: this.gainNode.gain,
      startTime,
      duration,
      maxVal: this.gain * this.baseGain,
      minVal: 0,
      startVal: 0.01,
      env: this.env,
    });

    this.oscNodes.forEach((node) => {
      const jitter = this.oscNodes.length > 1 ? Math.random() * 0.002 : 0;
      node.start(startTime + jitter);
      const releaseTime = this.env.r * duration;
      node.stop(startTime + duration + releaseTime + 0.05);
    });

    this.startTime = startTime;
  }

  stop(when?: number) {
    // if (!this.isPlaying || this.isStopped) return; // Todo: do I need this???
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
