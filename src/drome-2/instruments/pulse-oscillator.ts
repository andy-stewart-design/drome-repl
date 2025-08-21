interface PulseOscillatorOptions {
  type?: OscillatorType;
  frequency?: number;
  duration?: number;
}

class PulseOscillator {
  private ctx: AudioContext;
  private duration: number;
  private osc: OscillatorNode;

  constructor(
    ctx: AudioContext,
    {
      type = "sawtooth",
      frequency = 220,
      duration = 0.3,
    }: PulseOscillatorOptions = {}
  ) {
    this.ctx = ctx;
    this.duration = duration;
    this.osc = new OscillatorNode(this.ctx, { type, frequency });
  }

  trigger(dest: AudioNode) {
    const env = new GainNode(this.ctx, { gain: 0 });
    this.osc.connect(env).connect(dest);

    const now = this.ctx.currentTime;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + 0.01);
    env.gain.linearRampToValueAtTime(0, now + this.duration);

    this.osc.start(now);
    this.osc.stop(now + this.duration + 0.05);
  }
}
export default PulseOscillator;
