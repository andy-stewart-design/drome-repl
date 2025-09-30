import type Drome from "../core/drome";
import { generateImpulseResponse } from "../utils/reverb";

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
    drome: Drome,
    { duration = 3, mix = 0.5 }: ReverbEffectOptions = {}
  ) {
    this.input = new GainNode(drome.ctx);
    this.output = new GainNode(drome.ctx);
    this.convolver = new ConvolverNode(drome.ctx);
    const buffer = drome.reverbCache.get(`${mix}-${duration}`);

    if (buffer) this.convolver.buffer = buffer;
    else this.createBuffer(drome, mix, duration);

    this.wet = new GainNode(drome.ctx, { gain: mix });
    this.dry = new GainNode(drome.ctx, { gain: 1 });

    // Dry path
    this.input.connect(this.dry).connect(this.output);

    // Wet path
    this.input.connect(this.convolver);
    this.convolver.connect(this.wet).connect(this.output);
  }

  private async createBuffer(drome: Drome, mix: number, duration: number) {
    const buffer = await generateImpulseResponse(drome.ctx, duration);
    this.convolver.buffer = buffer;
    drome.reverbCache.set(`${mix}-${duration}`, buffer);
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

  get buffer() {
    return this.convolver.buffer;
  }

  get inputNode() {
    return this.input;
  }
}

export default ReverbEffect;
