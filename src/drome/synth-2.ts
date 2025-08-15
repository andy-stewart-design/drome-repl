import type { Drome } from "./drome-2";
import DromeArray from "./drome-array";
import Oscillator from "./oscillator";
import { synthAliasMap } from "./synth";
import type { OscType, SynthAlias } from "./types";
import { euclid } from "./utils/euclid";
import { hex } from "./utils/hex";
import { midiToFreq } from "./utils/midi";

interface ADSREnvelope {
  a: number;
  d: number;
  s: number;
  r: number;
}

interface FilterParams {
  type: BiquadFilterType;
  value: number;
  depth?: number;
  env?: ADSREnvelope;
}

class Synth {
  readonly id = crypto.randomUUID();
  private drome: Drome;
  private waveform: OscType = "sawtooth";
  private _gain = 1;
  private gainEnv = { a: 0.01, d: 0.001, s: 1, r: 0.125 };
  private notes: number[] = Array.from({ length: 4 }, () => 60);
  private filter: FilterParams | undefined;

  private lastScheduledBar = -1;
  private scheduledOscillators: Map<string, boolean> = new Map();

  constructor(drome: Drome, type: OscType = "sine") {
    this.drome = drome;
    this.waveform = type;
  }

  push() {
    this.drome.enqueue(this);
    return this;
  }

  play() {
    console.log("playing", this.drome.metronome);

    // Only schedule once per bar to prevent overlapping
    if (this.drome.metronome.bar === this.lastScheduledBar) {
      return;
    }

    this.lastScheduledBar = this.drome.metronome.bar;
    this.scheduledOscillators.clear();

    const noteStepDuration = this.drome.barDuration / this.notes.length;

    // Schedule all notes for this bar
    this.notes.forEach((note, i) => {
      if (note === 0) return;

      const noteId = `${this.drome.metronome.bar}-${i}`;

      // Prevent duplicate scheduling
      if (this.scheduledOscillators.has(noteId)) {
        return;
      }

      const frequency = midiToFreq(note);
      const startTime = this.drome.barStartTime + noteStepDuration * i;
      const duration = noteStepDuration * 0.95; // Slight gap between notes

      // Create and schedule the oscillator
      const osc = new Oscillator({
        ctx: this.drome.ctx,
        frequency,
        time: startTime,
        duration,
        type: this.waveform,
        gain: {
          value: this._gain,
          env: { ...this.gainEnv }, // Clone to prevent mutation
        },
        filter: this.filter ? { ...this.filter } : undefined,
      });

      this.scheduledOscillators.set(noteId, true);
      osc.play();

      // Clean up tracking after note should be finished
      setTimeout(() => {
        this.scheduledOscillators.delete(noteId);
      }, (duration + this.gainEnv.r + 0.1) * 1000);
    });
  }

  public sound(type: SynthAlias) {
    this.waveform = synthAliasMap[type];
    // if (harmonics) this.harmonics = harmonics;
    return this;
  }

  public note(n: number | number[] | DromeArray) {
    this.notes = n instanceof DromeArray ? n.value : Array.isArray(n) ? n : [n];
    return this;
  }

  public fast(multiplier: number) {
    const newLength = Math.floor(this.notes.length * multiplier);
    this.notes = Array.from(
      { length: newLength },
      (_, i) => this.notes[i % this.notes.length]
    );
    return this;
  }

  public euclid(pulses: number, steps: number, rotation = 0) {
    const pattern = euclid(pulses, steps, rotation);
    let noteIndex = 0;
    this.notes = pattern.map((p) => {
      return p === 0 ? 0 : this.notes[noteIndex++ % this.notes.length];
    });

    return this;
  }

  public hex(hexNotation: string | number) {
    const pattern = hex(hexNotation);
    let noteIndex = 0;
    this.notes = pattern.map((p) => {
      return p === 0 ? 0 : this.notes[noteIndex++ % this.notes.length];
    });
    return this;
  }

  public struct(pattern: number[] | DromeArray) {
    const pat = pattern instanceof DromeArray ? pattern.value : pattern;
    let noteIndex = 0;
    this.notes = pat.map((p) => {
      return p === 0 ? 0 : this.notes[noteIndex++ % this.notes.length];
    });
    return this;
  }

  public gain(n: number) {
    this._gain = n;
    return this;
  }

  public adsr(a: number, d?: number, s?: number, r?: number): this;
  public adsr(adsr: ADSREnvelope): this;
  public adsr(p1: number | ADSREnvelope, d?: number, s?: number, r?: number) {
    if (typeof p1 === "number") {
      this.gainEnv.a = p1 ?? 0.01; // You're missing the 'a' parameter!
      this.gainEnv.d = d ?? 0.001;
      this.gainEnv.s = s ?? 1;
      this.gainEnv.r = r ?? 0.125;
    } else {
      this.gainEnv.a = p1.a ?? 0.01; // Add default for 'a'
      this.gainEnv.d = p1.d ?? 0.001;
      this.gainEnv.s = p1.s ?? 1;
      this.gainEnv.r = p1.r ?? 0.125;
    }
    return this;
  }

  public lpf(value: number) {
    this.filter = { type: "lowpass", value, depth: 1 };
    return this;
  }

  public lpenv(depth: number, env?: ADSREnvelope) {
    if (!this.filter) return;
    this.filter.depth = depth;
    const s = (this.filter.value * depth) / this.filter.value;
    this.filter.env = env || { a: 0.125, d: 0.125, s, r: 0.01 };
    console.log(this.filter);

    return this;
  }

  public hpf(value: number) {
    this.filter = { type: "highpass", value, depth: 1 };
    return this;
  }

  public hpenv(depth: number, env: ADSREnvelope) {
    if (!this.filter) return;
    this.filter.depth = depth;
    const s = (this.filter.value * depth) / this.filter.value;
    this.filter.env = env || { a: 0.125, d: 0.125, s, r: 0.01 };
    return this;
  }
}

export default Synth;
