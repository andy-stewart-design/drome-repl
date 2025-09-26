class SupersawProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "frequency", defaultValue: 440, minValue: 20, maxValue: 20000 },
      { name: "gain", defaultValue: 0.2, minValue: 0, maxValue: 1 },
      { name: "detune", defaultValue: 12 }, // cents spread across voices
    ];
  }

  constructor() {
    super();
    this.voices = 7;
    this.phase = new Array(this.voices).fill(0);
    this.detunes = Array.from(
      { length: this.voices },
      (_, i) => (i / (this.voices - 1) - 0.5) * 2
    );
    this.lfoPhase = new Array(this.voices).fill(0);
    this.lfoRate = this.detunes.map(() => 0.1 + Math.random() * 0.3);
    this.lfoDepth = this.detunes.map(() => 2 + Math.random() * 3);
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0]; // mono, let StereoPannerNode handle pan
    const sr = sampleRate;

    const freqParam = parameters.frequency;
    const gainParam = parameters.gain;
    const detuneParam = parameters.detune;

    for (let i = 0; i < channel.length; i++) {
      const baseFreq = freqParam.length > 1 ? freqParam[i] : freqParam[0];
      const gain = gainParam.length > 1 ? gainParam[i] : gainParam[0];
      const detuneSpread =
        detuneParam.length > 1 ? detuneParam[i] : detuneParam[0];

      let sample = 0;

      for (let v = 0; v < this.voices; v++) {
        // LFO detune drift
        this.lfoPhase[v] += this.lfoRate[v] / sr;
        if (this.lfoPhase[v] > 1) this.lfoPhase[v] -= 1;
        const lfo = Math.sin(this.lfoPhase[v] * 2 * Math.PI);

        const detuneCents =
          this.detunes[v] * detuneSpread + lfo * this.lfoDepth[v];
        const detuneFactor = Math.pow(2, detuneCents / 1200);

        const freq = baseFreq * detuneFactor;
        const phaseInc = freq / sr;

        this.phase[v] += phaseInc;
        if (this.phase[v] > 1) this.phase[v] -= 1;

        // sawtooth wave: 2x - 1
        const voiceSample = 2 * this.phase[v] - 1;
        sample += voiceSample;
      }

      channel[i] = (sample / this.voices) * gain;
    }

    return true;
  }
}

registerProcessor("supersaw-processor", SupersawProcessor);
