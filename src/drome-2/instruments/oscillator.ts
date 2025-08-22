import { applyEnvelope } from "@/drome-2/utils/adsr";
import type { ADSRParams } from "@/drome-2/types";

interface OscillatorOptions {
  type?: OscillatorType;
  frequency?: number;
  gain?: number;
  env?: ADSRParams;
}

class Oscillator {
  private ctx: AudioContext;
  private osc: OscillatorNode;
  private gainNode: GainNode;
  private maxGain: number;
  private env: ADSRParams;

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    {
      type = "sawtooth",
      frequency = 220,
      gain = 1,
      env = { a: 0.01, d: 0.01, s: 1.0, r: 0.01 },
    }: OscillatorOptions = {}
  ) {
    this.ctx = ctx;
    this.osc = new OscillatorNode(this.ctx, { type, frequency });
    this.gainNode = new GainNode(this.ctx, { gain: 0 });
    this.maxGain = gain;
    this.env = env;
    this.osc.connect(this.gainNode).connect(destination);
  }

  play(startTime: number, duration: number) {
    applyEnvelope({
      target: this.gainNode.gain,
      startTime,
      duration,
      maxVal: this.maxGain,
      startVal: 0,
      env: this.env,
    });

    this.osc.start(startTime);
    this.osc.stop(startTime + duration + 0.05);
  }
}
export default Oscillator;
