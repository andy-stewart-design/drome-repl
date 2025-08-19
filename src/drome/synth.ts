import DromeArray from "./drome-array";
import Oscillator from "./oscillator";
import { euclid } from "./utils/euclid";
import { hex } from "./utils/hex";
import { midiToFreq } from "./utils/midi";
import type Drome from "./drome";
import type {
  ADSRParams,
  OscType,
  SynthAlias,
  FilterParams,
  FilterType,
} from "./types";

export const synthAliasMap = {
  saw: "sawtooth",
  sawtooth: "sawtooth",
  tri: "triangle",
  triangle: "triangle",
  sq: "square",
  square: "square",
  sin: "sine",
  sine: "sine",
  supersaw: "supersaw",
  ssaw: "supersaw",
} satisfies Record<string, OscType>;

class Synth {
  private drome;
  private cycles: (number | number[])[][] = [[midiToFreq(60)]];
  private waveform: OscType = "sine";
  private harmonics: number | null = null; // need to decide what to do about this
  private _gain = 1;
  private _adsr: ADSRParams = { a: 0.01, d: 0.01, s: 1.0, r: 0.025 };
  private filters: Map<FilterType, FilterParams> = new Map();
  private oscillators: Set<Oscillator> = new Set();

  constructor(drome: Drome, type: OscType = "sine", harmonics?: number) {
    this.drome = drome;
    this.waveform = type;
    if (harmonics) this.harmonics = harmonics;
    console.log("temporary log to make ts happy", this.harmonics);
  }

  public push() {
    this.drome.addInstrument(this);
    return this;
  }

  public note(...cycles: (number | number[] | number[][] | DromeArray)[]) {
    this.cycles = cycles.map((cycle) => {
      const midiArray =
        cycle instanceof DromeArray
          ? cycle.value
          : Array.isArray(cycle)
          ? cycle
          : [cycle];
      return midiArray.map((n) => {
        if (Array.isArray(n)) return n.map(midiToFreq);
        else if (n === 0) return n;
        else return midiToFreq(n);
      });
    });
    return this;
  }

  public sound(type: SynthAlias, harmonics?: number) {
    this.waveform = synthAliasMap[type];
    if (harmonics) this.harmonics = harmonics;
    return this;
  }

  public gain(n: number) {
    this._gain = n;
    return this;
  }

  public adsr(a: Partial<ADSRParams>): this;
  public adsr(a: number, d?: number, s?: number, r?: number): this;
  public adsr(
    param1: Partial<ADSRParams> | number,
    d?: number,
    s?: number,
    r?: number
  ) {
    if (typeof param1 === "number") {
      this._adsr.a = param1 || 0.001;
      this._adsr.d = d || 0.001;
      this._adsr.s = s || 0;
      this._adsr.r = r || 0.001;
    } else {
      this._adsr.a = param1.a || 0.001;
      this._adsr.d = param1.d || 0.001;
      this._adsr.s = param1.s || 0;
      this._adsr.r = param1.r || 0.001;
    }
    return this;
  }

  public hpf(frequency: number, q: number = 1) {
    this.filters.set("highpass", { value: frequency, type: "highpass", q });
    return this;
  }

  public hpenv(depthMult: number, env: ADSRParams) {
    const filter = this.filters.get("highpass");
    if (filter) {
      filter.depth = depthMult;
      filter.env = env;
    }
    return this;
  }

  public lpf(frequency: number, q: number = 1) {
    this.filters.set("lowpass", { value: frequency, type: "lowpass", q });
    return this;
  }

  public lpenv(depthMult: number, env: ADSRParams) {
    const filter = this.filters.get("lowpass");
    if (filter) {
      filter.depth = depthMult;
      filter.env = env;
    }
    return this;
  }

  public bpf(frequency: number, q: number = 1) {
    this.filters.set("bandpass", { value: frequency, type: "bandpass", q });
    return this;
  }

  public bpenv(depthMult: number, env: ADSRParams) {
    const filter = this.filters.get("bandpass");
    if (filter) {
      filter.depth = depthMult;
      filter.env = env;
    }
    return this;
  }

  public fast(multiplier: number) {
    if (multiplier <= 1) return this;
    const length = Math.ceil(this.cycles.length / multiplier);
    const numLoops = multiplier * length;
    const nextCyles: typeof this.cycles = Array.from({ length }, () => []);

    for (let i = 0; i < numLoops; i++) {
      const currentIndex = Math.floor(i / multiplier);
      nextCyles[currentIndex].push(...this.cycles[i % this.cycles.length]);
    }

    this.cycles = nextCyles;
    return this;
  }

  public slow(n: number) {
    if (n <= 1) return this;

    const nextCycles: (number | number[])[][] = [];

    for (const cycle of this.cycles) {
      const chunkSize = Math.ceil((cycle.length * n) / n); // equals cycle.length

      // Create n chunks directly
      for (let k = 0; k < n; k++) {
        const chunk: (number | number[])[] = [];
        const startPos = k * chunkSize;
        const endPos = Math.min((k + 1) * chunkSize, cycle.length * n);

        for (let pos = startPos; pos < endPos; pos++) {
          if (pos % n === 0) chunk.push(cycle[pos / n]);
          else chunk.push(0);
        }

        nextCycles.push(chunk);
      }
    }

    this.cycles = nextCycles;
    return this;
  }

  // d.synth().note([60,64,67,71]).slow(2).adsr(0.01,0.333).push()

  public euclid(pulses: number, steps: number, rotation = 0) {
    const pattern = euclid(pulses, steps, rotation);
    let noteIndex = 0;
    this.cycles = this.cycles.map((cycle) => {
      return pattern.map((p) => {
        return p === 0 ? 0 : cycle[noteIndex++ % cycle.length];
      });
    });
    return this;
  }

  public hex(hexNotation: string | number) {
    const pattern = hex(hexNotation);
    let noteIndex = 0;
    this.cycles = this.cycles.map((cycle) => {
      return pattern.map((p) => {
        return p === 0 ? 0 : cycle[noteIndex++ % cycle.length];
      });
    });
    return this;
  }

  public struct(pattern: number[] | DromeArray) {
    const pat = pattern instanceof DromeArray ? pattern.value : pattern;
    let noteIndex = 0;
    this.cycles = this.cycles.map((cycle) => {
      return pat.map((p) => {
        return p === 0 ? 0 : cycle[noteIndex++ % cycle.length];
      });
    });
    return this;
  }

  public play(time: number) {
    const cycleIndex = this.drome.metronome.bar % this.cycles.length;
    const cycle = this.cycles[cycleIndex];
    const offset = this.drome.duration / cycle.length;
    const duration = Math.max(offset, this.drome.duration / 8);

    cycle.forEach((pattern, i) => {
      if (pattern === 0) return; // Skip silent notes
      const t = time + offset * i;

      if (Array.isArray(pattern)) {
        pattern.forEach((frequency) => {
          const osc = new Oscillator({
            ctx: this.drome.ctx,
            type: this.waveform,
            duration,
            frequency,
            startTime: t,
            gain: { value: this._gain, env: this._adsr },
            filters: this.filters,
          });

          osc.start();
          this.oscillators.add(osc);
          osc.on("ended", () => this.oscillators.delete(osc));
        });
      } else {
        const osc = new Oscillator({
          ctx: this.drome.ctx,
          type: this.waveform,
          duration,
          frequency: pattern,
          startTime: t,
          gain: { value: this._gain, env: this._adsr },
          filters: this.filters,
        });

        osc.start();
        this.oscillators.add(osc);
        osc.on("ended", () => this.oscillators.delete(osc));
      }
    });
  }

  stop() {
    this.oscillators.forEach((osc) => osc.stop());
  }

  public destroy() {
    // Clear note data
    this.cycles = [];

    // Reset parameters to defaults
    this.waveform = "sine";
    this.harmonics = null;
    this._gain = 1;
    this._adsr = { a: 0.001, d: 0.001, s: 1.0, r: 0.001 };
    this.filters.clear();

    // Drop AudioContext reference (not closing it, since Drome owns it)
    // @ts-expect-error allow nulling for cleanup
    this.ctx = null;
  }
}

export default Synth;
