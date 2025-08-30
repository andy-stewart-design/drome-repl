import { applyEnvelope } from "../utils/adsr";
import type { ADSRParams, FilterOptions } from "../types";

type FEOptions = Partial<FilterOptions>;

class FilterEffect {
  private filter: BiquadFilterNode;
  private env: { depth: number; adsr?: ADSRParams } | undefined;

  constructor(
    ctx: AudioContext,
    { type = "lowpass", frequency = 600, q: Q = 1, env }: FEOptions = {}
  ) {
    this.filter = new BiquadFilterNode(ctx, { type, frequency, Q });
    this.env = env;
  }
  connect(dest: AudioNode) {
    this.filter.connect(dest);
  }
  apply(startTime: number, duration: number) {
    if (this.env?.adsr) {
      console.log("applying envelope");

      applyEnvelope({
        target: this.filter.frequency,
        startTime,
        duration,
        env: this.env.adsr,
        startVal: this.filter.frequency.value,
        maxVal: this.filter.frequency.value * this.env.depth,
      });
    }
  }
  frequency(v: number) {
    this.filter.frequency.value = v;
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
