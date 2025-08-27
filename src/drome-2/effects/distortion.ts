interface DistortionEffectOptions {
  amount?: number; // controls distortion intensity
  oversample?: OverSampleType; // 'none' | '2x' | '4x'
  mix?: number; // dry/wet mix
}

class DistortionEffect {
  private waveShaper: WaveShaperNode;
  readonly input: GainNode;
  private output: GainNode;
  private wet: GainNode;

  constructor(
    ctx: AudioContext,
    { amount = 50, oversample = "2x", mix = 0.5 }: DistortionEffectOptions = {}
  ) {
    this.input = new GainNode(ctx);
    this.output = new GainNode(ctx);
    this.waveShaper = new WaveShaperNode(ctx, { oversample });
    this.wet = new GainNode(ctx, { gain: mix });

    this.setAmount(amount);

    // Dry path
    this.input.connect(this.output);

    // Wet path
    this.input.connect(this.waveShaper);
    this.waveShaper.connect(this.wet).connect(this.output);
  }

  connect(dest: AudioNode) {
    this.output.connect(dest);
  }

  disconnect() {
    this.output.disconnect();
  }

  setWetLevel(value: number) {
    this.wet.gain.value = value;
  }

  setAmount(amount: number) {
    this.waveShaper.curve = this.makeDistortionCurve(amount);
  }

  private makeDistortionCurve(amount: number) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] =
        ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }
}

export default DistortionEffect;
