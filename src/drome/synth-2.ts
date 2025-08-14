import type { Drome } from "./drome-2";
import DromeArray from "./drome-array";
import Oscillator from "./oscillator";
import { synthAliasMap } from "./synth";
import type { OscType, SynthAlias } from "./types";
import { euclid } from "./utils/euclid";
import { hex } from "./utils/hex";
import { midiToFreq } from "./utils/midi";

class Synth {
  private drome: Drome;
  private waveform: OscType = "sine";
  private _gain = 1;
  private gainEnv = { a: 0.01, d: 0.125, s: 0, r: 0.01 };
  private notes: number[] = Array.from({ length: 4 }, (_, i) => (i ? 69 : 81));
  //   public notes = [81, 696];

  constructor(drome: Drome) {
    this.drome = drome;
  }

  push() {
    this.drome.enqueue(this);
    return this;
  }

  play() {
    const startOffset = this.drome.barDuration / this.notes.length;
    const barProgress = this.drome.metronome.step / this.drome.stepCount;
    const skippedNotesCount = Math.ceil(this.notes.length * barProgress);

    this.notes.forEach((note, i) => {
      if (i < skippedNotesCount) return;
      const frequency = midiToFreq(note);
      const time = this.drome.barStartTime + startOffset * i;
      const duration = this.drome.barDuration;

      const osc = new Oscillator({
        ctx: this.drome.ctx,
        frequency,
        time,
        duration,
        type: this.waveform,
        gain: { value: this._gain, env: this.gainEnv },
        filter: {
          type: "lowpass",
          value: 800,
          env: { a: 0.1, d: 0.25, s: 0.25, r: 0.25 },
        },
      });

      osc.play();
    });
  }

  public sound(type: SynthAlias) {
    this.waveform = synthAliasMap[type];
    // if (harmonics) this.harmonics = harmonics;
    return this;
  }

  public note(n: number | number[] | DromeArray) {
    const midiArray =
      n instanceof DromeArray ? n.value : Array.isArray(n) ? n : [n];
    this.notes = midiArray.map((n) => midiToFreq(n));
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

  public env(a: number, d?: number, s?: number, r?: number) {
    this.gainEnv.a = a || 0.001;
    this.gainEnv.d = d || 0.001;
    this.gainEnv.s = s || 0;
    this.gainEnv.r = r || 0.001;
    return this;
  }
}

export default Synth;
