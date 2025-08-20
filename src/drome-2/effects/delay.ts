interface DelayEffectOptions {
  delayTime?: number;
  feedback?: number;
  mix?: number;
}

class DelayEffect {
  private delay: DelayNode;
  readonly input: GainNode;
  private output: GainNode;
  private feedback: GainNode;
  private wet: GainNode;
  private dry: GainNode;

  constructor(
    ctx: AudioContext,
    { delayTime = 0.25, feedback = 0.1, mix = 0.2 }: DelayEffectOptions = {}
  ) {
    this.input = new GainNode(ctx);
    this.output = new GainNode(ctx);
    this.delay = new DelayNode(ctx, { delayTime });
    this.feedback = new GainNode(ctx, { gain: feedback });
    this.wet = new GainNode(ctx, { gain: mix });
    this.dry = new GainNode(ctx, { gain: 1 - mix });

    // Routing
    this.input.connect(this.dry).connect(this.output);
    this.input.connect(this.delay).connect(this.wet).connect(this.output);
    this.delay.connect(this.feedback).connect(this.delay);
  }
  connect(dest: AudioNode) {
    this.output.connect(dest);
  }
  disconnect() {
    this.output.disconnect();
  }
  setDelayTime(v: number) {
    this.delay.delayTime.value = v;
  }
  setFeedback(v: number) {
    this.feedback.gain.value = v;
  }
  setMix(v: number) {
    this.wet.gain.value = v;
    this.dry.gain.value = 1 - v;
  }
}

export default DelayEffect;
