import DromeInstrument from "./drome-instrument";
import DromeOscillator from "./drome-oscillator";
import FilterEffect from "../effects/filter";
import type Drome from "../core/drome";
import type { DromeAudioNode, OscType, OscTypeAlias } from "../types";
import { synthAliasMap } from "../dictionaries/synths/synth-aliases";

class DromeSynth extends DromeInstrument<number> {
  private type: OscType;
  private oscillators: Set<DromeOscillator> = new Set();

  constructor(
    drome: Drome,
    destination: DromeAudioNode,
    type: OscTypeAlias = "sine"
  ) {
    super(drome, destination);
    this.type = synthAliasMap[type];
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
    const noteDuration = this.drome.barDuration / cycle.length;

    const play = (note: number, i: number) => {
      const frequency = parseFloat(note.toString()) ?? 1;
      const osc = new DromeOscillator(this.drome.ctx, nodes[0].input, {
        type: this.type,
        frequency,
        env: this._env,
        gain: this._gain,
      });

      nodes.forEach((node) => {
        const time = startTime + noteDuration * i;
        if (node instanceof FilterEffect) node.apply(time, noteDuration);
      });
      osc.play(startTime + noteDuration * i, noteDuration);

      this.oscillators.add(osc);
      osc.node.onended = () => this.oscillators.delete(osc);
    };

    cycle.forEach((pat, i) => {
      if (!pat) return;
      else if (Array.isArray(pat)) pat.forEach((el) => play(el, i));
      else play(pat, i);
    });
  }

  stop() {
    this.oscillators.forEach((osc) => osc.stop());
  }
}

export default DromeSynth;
