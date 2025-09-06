import DromeInstrument from "./drome-instrument";
import DromeOscillator from "./drome-oscillator";
import { midiToFreq } from "../utils/midi-to-frequency";
import { scaleAliasMap } from "../dictionaries/notes/scale-alias";
import { synthAliasMap } from "../dictionaries/synths/synth-aliases";
import type {
  DromeAudioNode,
  NoteName,
  NoteValue,
  OscType,
  OscTypeAlias,
  ScaleAlias,
} from "../types";
import type Drome from "../core/drome";
import { noteToMidi } from "../utils/note-name-to-midi";

const DEFAULT_CYCLES = [[60]];

class DromeSynth extends DromeInstrument<number> {
  private type: OscType[] = [];
  private oscillators: Set<DromeOscillator> = new Set();
  private rootNote = 0;
  private _scale: number[] | null = null;

  constructor(
    drome: Drome,
    destination: DromeAudioNode,
    ...types: OscTypeAlias[]
  ) {
    super(drome, destination);
    if (types.length === 0) {
      this.type.push("sine");
    } else {
      types.forEach((type) => {
        this.type.push(synthAliasMap[type]);
      });
    }
  }

  private getFrequency(note: number) {
    if (!this._scale) return midiToFreq(this.rootNote + note);

    const degree = ((note % 7) + 7) % 7;
    const octave = Math.floor(note / 7) * 12;
    const step = this._scale.slice(0, degree + 1).reduce((a, c) => a + c, 0);

    return midiToFreq(this.rootNote + octave + step);
  }

  root(n: NoteName | NoteValue | number) {
    if (typeof n === "number") {
      this.rootNote = n;
    } else {
      const note = noteToMidi(n);
      if (note) this.rootNote = note;
    }
    if (!this.cycles.length) this.cycles = [[0]];
    return this;
  }

  scale(scaleAlias: ScaleAlias) {
    this._scale = scaleAliasMap[scaleAlias];
    return this;
  }

  push() {
    this.drome.push(this);
    return this;
  }

  start() {
    const nodes = super.connectChain();
    const cycleIndex = this.drome.metronome.bar % (this.cycles.length || 1);
    const cycle = this.cycles[cycleIndex] || DEFAULT_CYCLES[cycleIndex];
    const startTime = this.drome.barStartTime;
    const noteOffset = this.drome.barDuration / cycle.length;
    const noteDuration = Math.max(noteOffset + this._env.r, 0.125);

    const play = (note: number, i: number) => {
      if (typeof note !== "number") return;

      const frequency = this.getFrequency(note);

      this.type.forEach((type) => {
        const osc = new DromeOscillator(this.drome.ctx, nodes[0].input, {
          type,
          frequency,
          env: this._env,
          gain: this._gain,
          filters: this._filters,
        });

        osc.play(startTime + noteOffset * i, noteDuration);

        this.oscillators.add(osc);
        osc.node.onended = () => this.oscillators.delete(osc);
      });
    };

    cycle.forEach((pat, i) => {
      if (!Array.isArray(pat) && typeof pat !== "number") return;
      else if (Array.isArray(pat)) pat.forEach((el) => play(el, i));
      else play(pat, i);
    });
  }

  stop() {
    this.oscillators.forEach((osc) => osc.stop());
  }
}

export default DromeSynth;
