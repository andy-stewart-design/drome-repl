class PulseOscillator {
  private ctx: AudioContext;
  private frequency: number;
  private duration: number;

  constructor(ctx: AudioContext, { frequency = 220, duration = 0.3 } = {}) {
    this.ctx = ctx;
    this.frequency = frequency;
    this.duration = duration;
  }

  trigger(dest: AudioNode) {
    const osc = new OscillatorNode(this.ctx, {
      type: "sawtooth",
      frequency: this.frequency,
    });
    const env = new GainNode(this.ctx, { gain: 0 });
    osc.connect(env).connect(dest);

    const now = this.ctx.currentTime;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + 0.01);
    env.gain.linearRampToValueAtTime(0, now + this.duration);

    osc.start(now);
    osc.stop(now + this.duration + 0.05);
  }
}
export default PulseOscillator;
