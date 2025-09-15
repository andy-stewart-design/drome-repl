import DromeInstrument from "./drome-instrument";
import DromeAudioSource from "./drome-audio-source";
import { midiToFreq } from "../utils/midi-to-frequency";
import { noteToMidi } from "../utils/note-name-to-midi";
import { scaleAliasMap } from "../dictionaries/notes/scale-alias";
import { synthAliasMap } from "../dictionaries/synths/synth-aliases";
import type {
  DromeCycleValue,
  DromeAudioNode,
  NoteName,
  NoteValue,
  OscType,
  OscTypeAlias,
  ScaleAlias,
} from "../types";
import type Drome from "../core/drome";

class DromeSynth extends DromeInstrument {
  private waveforms: OscType[] = [];
  private oscillators: Set<DromeAudioSource> = new Set();
  private rootNote = 0;
  private _scale: number[] | null = null;

  constructor(drome: Drome, dest: DromeAudioNode, ...types: OscTypeAlias[]) {
    super(drome, dest, "synth");
    if (types.length === 0) {
      this.waveforms.push("sine");
    } else {
      types.forEach((type) => {
        this.waveforms.push(synthAliasMap[type]);
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

  private getDuration(
    cycle: (DromeCycleValue | DromeCycleValue[])[],
    i: number
  ) {
    const baseSize = this.drome.barDuration / cycle.length;
    const offset = baseSize * i;

    if (!this._legato) {
      const duration = Math.max(baseSize + this._env.r, 0.125);
      return { offset, duration };
    }

    const nextNonNull = cycle.findIndex((val, idx) => idx > i && val !== null);
    const nullCount = (nextNonNull === -1 ? cycle.length : nextNonNull) - i - 1;
    const duration = Math.max(baseSize * (1 + nullCount) + this._env.r, 0.125);
    return { offset, duration };
  }

  root(n: NoteName | NoteValue | number) {
    if (typeof n === "number") this.rootNote = n;
    else this.rootNote = noteToMidi(n) || 0;

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
    const cycle = this.cycles[cycleIndex] || [[60]];
    const startTime = this.drome.barStartTime;

    const play = (note: DromeCycleValue, i: number) => {
      if (typeof note !== "number") return;

      const frequency = this.getFrequency(note);

      this.waveforms.forEach((type) => {
        const osc = new DromeAudioSource(this.drome.ctx, nodes[0].input, {
          type: "oscillator",
          waveform: type,
          frequency,
          env: this._env,
          gain: this.getCurrentGain(cycleIndex, i),
          filters: this._filters,
          pan: this.getCurrentPan(cycleIndex, i),
        });

        const { offset, duration } = this.getDuration(cycle, i);
        osc.play(startTime + offset, duration);

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
