import { generateImpulseResponse } from "../utils/reverb";

interface ReverbEffectOptions {
  duration?: number; // IR length in seconds
  decay?: number; // exponential decay factor
  mix?: number; // 0 = dry only, 1 = wet only
}

class ReverbEffect {
  private convolver: ConvolverNode;
  private wet: GainNode;
  private dry: GainNode;
  readonly input: GainNode;
  private output: GainNode;

  constructor(
    ctx: AudioContext,
    { duration = 3, decay = 2.0, mix = 0.5 }: ReverbEffectOptions = {}
  ) {
    this.input = new GainNode(ctx);
    this.output = new GainNode(ctx);
    this.convolver = new ConvolverNode(ctx);
    this.convolver.buffer = generateImpulseResponse(ctx, duration, decay);

    this.wet = new GainNode(ctx, { gain: mix });
    this.dry = new GainNode(ctx, { gain: 1 });

    // Dry path
    this.input.connect(this.dry).connect(this.output);

    // Wet path
    this.input.connect(this.convolver);
    this.convolver.connect(this.wet).connect(this.output);
  }

  connect(dest: AudioNode) {
    this.output.connect(dest);
  }

  disconnect() {
    this.output.disconnect();
  }

  setWetLevel(v: number) {
    this.wet.gain.value = v;
    this.dry.gain.value = 1 - v;
  }

  get inputNode() {
    return this.input;
  }
}

export default ReverbEffect;
