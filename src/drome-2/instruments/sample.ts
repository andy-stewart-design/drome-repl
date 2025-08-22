import DelayEffect from "../effects/delay";
import FilterEffect from "../effects/filter";
import ReverbEffect from "../effects/reverb";
import type {
  ADSRParams,
  DromeAudioNode,
  FilterOptions,
  FilterType,
} from "../types";

const sampleUrl =
  "https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/RolandTR909/rolandtr909-bd/Bassdrum-02.wav";

class Sample {
  private ctx: AudioContext;
  private _destination: DromeAudioNode;
  private buffer: AudioBuffer | undefined;

  private _filters: Map<FilterType, FilterOptions> = new Map();
  private _delay: DelayEffect | undefined;
  private _reverb: ReverbEffect | undefined;
  private _env: ADSRParams = { a: 0.01, d: 0.125, s: 1.0, r: 0.1 };

  constructor(ctx: AudioContext, destination: DromeAudioNode) {
    this.ctx = ctx;
    this._destination = destination;
  }

  async loadSample() {
    try {
      const response = await fetch(sampleUrl);
      const arrayBuffer = await response.arrayBuffer();
      this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
      return this.buffer;
    } catch (error) {
      console.error("Error loading or playing sample:", error);
    }
  }

  private addFilter(type: FilterType, frequency: number) {
    const env = { depth: 1, adsr: { ...this._env } };
    this._filters.set(type, { type, frequency, env, q: 1 });
  }

  private updateFilter(t: FilterType, de: number, env: Partial<ADSRParams>) {
    const filter = this._filters.get(t);
    if (!filter) return this;
    filter.env.depth = de;
    if (typeof env.a === "number") filter.env.adsr.a = env.a;
    if (typeof env.d === "number") filter.env.adsr.d = env.d;
    if (typeof env.s === "number") filter.env.adsr.s = env.s;
    if (typeof env.r === "number") filter.env.adsr.r = env.r;
  }

  //   adsr(p1: Partial<ADSRParams>): this;
  //   adsr(p1: number, d?: number, s?: number, r?: number): this;
  //   adsr(p1: Partial<ADSRParams> | number, d?: number, s?: number, r?: number) {
  //     if (typeof p1 === "number") {
  //       this._env.a = p1;
  //       if (typeof d === "number") this._env.d = d;
  //       if (typeof s === "number") this._env.s = s;
  //       if (typeof r === "number") this._env.r = r;
  //     } else {
  //       if (typeof p1.a === "number") this._env.a = p1.a;
  //       if (typeof p1.d === "number") this._env.d = p1.d;
  //       if (typeof p1.s === "number") this._env.s = p1.s;
  //       if (typeof p1.r === "number") this._env.r = p1.r;
  //     }
  //     return this;
  //   }

  bpf(frequency: number) {
    this.addFilter("bandpass", frequency);
    return this;
  }

  bpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this.updateFilter("bandpass", depth, { a, d, s, r });
    return this;
  }

  hpf(frequency: number) {
    this.addFilter("highpass", frequency);
    return this;
  }

  hpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this.updateFilter("highpass", depth, { a, d, s, r });
    return this;
  }

  lpf(frequency: number) {
    this.addFilter("lowpass", frequency);
    return this;
  }

  lpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this.updateFilter("lowpass", depth, { a, d, s, r });
    return this;
  }

  delay(feedback: number, delayTime = 0.25, mix = 0.3) {
    this._delay = new DelayEffect(this.ctx, { delayTime, feedback, mix });
    return this;
  }

  reverb(mix: number, duration = 1, decay = 0.75) {
    this._reverb = new ReverbEffect(this.ctx, {
      duration,
      decay,
      mix: mix * 2,
    });
    return this;
  }

  async play() {
    const buffer = this.buffer ?? (await this.loadSample());
    if (!buffer) return;
    const startTime = this.ctx.currentTime + 0.01;
    const duration = 1;
    const filters = [...(this._filters?.values() ?? [])].map(
      (options) => new FilterEffect(this.ctx, options)
    );

    const nodes = [
      ...filters,
      this._reverb,
      this._delay,
      this._destination,
    ].filter(isAudioNode);

    nodes.forEach((node, i) => {
      const nextInput = nodes[i + 1]?.input ?? this.ctx.destination;
      node.connect(nextInput);
      if (node instanceof FilterEffect) node.apply(startTime, duration);
    });

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 1;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(nodes[0].input);
    source.start(startTime);
    source.stop(startTime + duration);

    //   const osc = new Oscillator(this.ctx, nodes[0].input, {
    //     type: this.type,
    //     frequency: 130.81,
    //     env: this._env,
    //   });

    //   osc.play(startTime, duration);
  }
}

export default Sample;

const isAudioNode = (
  node: DromeAudioNode | undefined
): node is DromeAudioNode => {
  return node !== undefined;
};
