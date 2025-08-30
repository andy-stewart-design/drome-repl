import { applyEnvelope } from "../utils/adsr";
import type { ADSRParams, FilterOptions } from "../types";

type FEOptions = Partial<FilterOptions>;

class FilterEffect {
  private filter: BiquadFilterNode;
  private env: { depth: number; adsr?: ADSRParams } | undefined;
  private baseFrequency: number;

  constructor(
    ctx: AudioContext,
    { type = "lowpass", frequency = 600, q: Q = 1, env }: FEOptions = {}
  ) {
    this.filter = new BiquadFilterNode(ctx, { type, frequency, Q });
    this.env = env;
    this.baseFrequency = frequency;
  }

  connect(dest: AudioNode) {
    this.filter.connect(dest);
  }

  apply(startTime: number, duration: number) {
    if (this.env?.adsr) {
      // Calculate target frequency more carefully
      const targetFreq = this.baseFrequency * this.env.depth;
      // Set minimum frequency of 20 to prevent going to 0 Hz
      const minFreq = Math.min(this.baseFrequency, 20);

      applyEnvelope({
        target: this.filter.frequency,
        startTime,
        duration,
        env: this.env.adsr,
        startVal: this.baseFrequency,
        maxVal: targetFreq,
        minVal: minFreq, // Use minimum frequency instead of 0
      });
    }
  }

  frequency(v: number) {
    this.filter.frequency.value = v;
    this.baseFrequency = v; // Keep track of base frequency
  }

  disconnect() {
    this.filter.disconnect();
  }

  get input() {
    return this.filter;
  }
}

export default FilterEffect;
export type { FilterOptions };
