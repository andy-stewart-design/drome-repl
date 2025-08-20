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

  constructor(
    ctx: AudioContext,
    { delayTime = 0.25, feedback = 0.1, mix = 0.2 }: DelayEffectOptions = {}
  ) {
    this.input = new GainNode(ctx);
    this.output = new GainNode(ctx);
    this.delay = new DelayNode(ctx, { delayTime });
    this.feedback = new GainNode(ctx, { gain: feedback });
    this.wet = new GainNode(ctx, { gain: mix });

    // Dry signal passes through
    this.input.connect(this.output);
    // Wet signal with feedback
    this.input.connect(this.delay);
    this.delay.connect(this.wet).connect(this.output);
    this.delay.connect(this.feedback).connect(this.delay);
  }

  connect(dest: AudioNode) {
    this.output.connect(dest);
  }
  setWetLevel(v: number) {
    this.wet.gain.value = v;
  }
}

export default DelayEffect;
