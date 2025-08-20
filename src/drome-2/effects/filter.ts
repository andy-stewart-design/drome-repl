import { applyEnvelope } from "../utils/adsr";

interface ADSRParams {
  a: number;
  d: number;
  s: number;
  r: number;
}

interface FilterOptions {
  type?: BiquadFilterType;
  frequency?: number;
  q?: number;
  env?: { depth: number; adsr: ADSRParams };
}

class FilterEffect {
  private filter: BiquadFilterNode;
  private env: { depth: number; adsr: ADSRParams } | undefined;

  constructor(
    ctx: AudioContext,
    { type = "lowpass", frequency = 600, q: Q = 1, env }: FilterOptions = {}
  ) {
    this.filter = new BiquadFilterNode(ctx, { type, frequency, Q });
    this.env = env;
  }
  connect(dest: AudioNode) {
    this.filter.connect(dest);
  }
  apply(startTime: number, duration: number) {
    if (this.env) {
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
