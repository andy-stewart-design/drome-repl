import { generateHighQualityImpulseResponse } from "../utils/reverb";

interface ReverbEffectOptions {
  duration?: number; // IR length in seconds
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
    { duration = 3, mix = 0.5 }: ReverbEffectOptions = {}
  ) {
    this.input = new GainNode(ctx);
    this.output = new GainNode(ctx);
    this.convolver = new ConvolverNode(ctx);
    generateHighQualityImpulseResponse(ctx, duration).then((buffer) => {
      this.convolver.buffer = buffer;
    });

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
