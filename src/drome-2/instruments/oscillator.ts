import { applyEnvelope } from "../utils/adsr";

interface OscillatorOptions {
  type?: OscillatorType;
  frequency?: number;
  duration?: number;
}

class Oscillator {
  private ctx: AudioContext;
  private duration: number;
  private osc: OscillatorNode;
  private gainNode: GainNode;

  constructor(
    ctx: AudioContext,
    {
      type = "sawtooth",
      frequency = 220,
      duration = 0.3,
    }: OscillatorOptions = {}
  ) {
    this.ctx = ctx;
    this.duration = duration;
    this.osc = new OscillatorNode(this.ctx, { type, frequency });
    this.gainNode = new GainNode(this.ctx, { gain: 0 });
  }

  trigger(dest: AudioNode) {
    this.osc.connect(this.gainNode).connect(dest);

    const startTime = this.ctx.currentTime + 0.01;
    const env = { a: 0.5, d: 0.01, s: 1.0, r: 0.025 };
    applyEnvelope({
      target: this.gainNode.gain,
      startTime,
      duration: this.duration,
      maxVal: 1,
      startVal: 0,
      env,
    });

    this.osc.start(startTime);
    this.osc.stop(startTime + this.duration + 0.05);
  }
}
export default Oscillator;
