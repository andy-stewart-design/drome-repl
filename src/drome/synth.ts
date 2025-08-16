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
} satisfies Record<string, OscType>;

class Synth {
  private drome;
  private notes: number[] = [261.63];
  private noteOffsets: number | number[] = 0;
  private waveform: OscType = "sine";
  private harmonics: number | null = null; // need to decide what to do about this
  private _gain = 1;
  private _adsr: ADSRParams = { a: 0.001, d: 0.001, s: 1.0, r: 0.001 };
  private filters: Map<FilterType, FilterParams> = new Map();

  constructor(drome: Drome, type: OscType = "sine", harmonics?: number) {
    this.drome = drome;
    this.waveform = type;
    if (harmonics) this.harmonics = harmonics;
    console.log(this.harmonics);
  }

  public push() {
    this.drome.addInstrument(this);
    return this;
  }

  public note(n: number | number[] | DromeArray) {
    const midiArray =
      n instanceof DromeArray ? n.value : Array.isArray(n) ? n : [n];
    this.notes = midiArray.map((n) => midiToFreq(n));
    this.noteOffsets = this.drome.duration / this.notes.length;
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

  public adsr(a: number, d?: number, s?: number, r?: number) {
    this._adsr.a = a || 0.001;
    this._adsr.d = d || 0.001;
    this._adsr.s = s || 0;
    this._adsr.r = r || 0.001;
    return this;
  }

  public att(n: number) {
    this._adsr.a = n || 0.01;
    return this;
  }

  public dec(n: number) {
    this._adsr.d = n || 0.01;
    return this;
  }

  public sus(n: number) {
    this._adsr.s = n || 0.01;
    return this;
  }

  public rel(n: number) {
    this._adsr.r = n || 0.01;
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
    const newLength = Math.floor(this.notes.length * multiplier);
    this.notes = Array.from(
      { length: newLength },
      (_, i) => this.notes[i % this.notes.length]
    );
    this.noteOffsets = this.drome.duration / this.notes.length;
    return this;
  }

  public euclid(pulses: number, steps: number, rotation = 0) {
    const pattern = euclid(pulses, steps, rotation);
    this.noteOffsets = this.drome.duration / steps;

    let noteIndex = 0;
    this.notes = pattern.map((p) => {
      return p === 0 ? 0 : this.notes[noteIndex++ % this.notes.length];
    });

    return this;
  }

  public hex(hexNotation: string | number) {
    const pattern = hex(hexNotation);
    this.noteOffsets = this.drome.duration / pattern.length;
    let noteIndex = 0;
    this.notes = pattern.map((p) => {
      return p === 0 ? 0 : this.notes[noteIndex++ % this.notes.length];
    });
    return this;
  }

  public struct(pattern: number[] | DromeArray) {
    const pat = pattern instanceof DromeArray ? pattern.value : pattern;
    this.noteOffsets = this.drome.duration / pat.length;
    let noteIndex = 0;
    this.notes = pat.map((p) => {
      return p === 0 ? 0 : this.notes[noteIndex++ % this.notes.length];
    });
    return this;
  }

  public play(time: number) {
    this.notes?.forEach((frequency, i) => {
      if (frequency === 0) return; // Skip silent notes
      const { noteOffsets } = this;
      const offset = Array.isArray(noteOffsets) ? noteOffsets[i] : noteOffsets;
      const t = time + offset * i;

      // console.log("filters", this.filters);

      new Oscillator({
        ctx: this.drome.ctx,
        type: this.waveform,
        // harmonics: this.harmonics,
        duration: this.drome.duration,
        frequency,
        startTime: t,
        gain: { value: this._gain, env: this._adsr },
        filters: this.filters,
      }).play();
    });
  }

  public destroy() {
    // Clear note data
    this.notes = [];
    this.noteOffsets = 0;

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
