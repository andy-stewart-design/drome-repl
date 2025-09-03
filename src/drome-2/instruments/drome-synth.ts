import DromeInstrument from "./drome-instrument";
import DromeOscillator from "./drome-oscillator";
import FilterEffect from "../effects/filter";
import type Drome from "../core/drome";
import type { DromeAudioNode, OscType, OscTypeAlias } from "../types";
import { synthAliasMap } from "../dictionaries/synths/synth-aliases";
import { midiToFreq } from "../utils/midi-to-frequency";

class DromeSynth extends DromeInstrument<number> {
  private type: OscType[] = [];
  private oscillators: Set<DromeOscillator> = new Set();
  private rootNote = 0;

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

  root(n: number) {
    this.rootNote = n;
    return this;
  }

  push() {
    this.drome.push(this);
    return this;
  }

  start() {
    const nodes = super.connectChain();
    const cycleIndex = this.drome.metronome.bar % this.cycles.length;
    const cycle = this.cycles[cycleIndex];
    const startTime = this.drome.barStartTime;
    const noteOffset = this.drome.barDuration / cycle.length;
    const noteDuration = noteOffset + this._env.r;

    const play = (note: number, i: number) => {
      if (typeof note !== "number") return;

      nodes.forEach((node) => {
        if (!(node instanceof FilterEffect)) return;
        node.apply(startTime + noteOffset * i, noteDuration);
      });

      const frequency = midiToFreq(this.rootNote + note);
      this.type.forEach((type) => {
        const osc = new DromeOscillator(this.drome.ctx, nodes[0].input, {
          type,
          frequency,
          env: this._env,
          gain: this._gain,
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
