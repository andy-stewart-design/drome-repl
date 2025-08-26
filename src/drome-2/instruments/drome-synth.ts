import DromeInstrument from "./drome-instrument";
import DromeOscillator from "./drome-oscillator";
import FilterEffect from "../effects/filter";
import type Drome from "../core/drome";
import type { DromeAudioNode } from "../types";

class DromeSynth extends DromeInstrument<number> {
  private drome: Drome;
  private type: OscillatorType;
  private oscillators: Set<DromeOscillator> = new Set();
  //   private notes: number[] = [
  //     130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 130.81,
  //   ];

  constructor(
    drome: Drome,
    destination: DromeAudioNode,
    type: OscillatorType = "sine"
  ) {
    super(drome.ctx, destination);
    this.drome = drome;
    this.type = type;
  }

  start() {
    const nodes = super.connectChain();
    const startTime = this.drome.barStartTime;
    const noteDuration = this.drome.barDuration / this.notes.length;

    this.notes.forEach((note, i) => {
      if (note === 0) return;
      const frequency = parseFloat(note.toString()) ?? 1;
      const osc = new DromeOscillator(this.ctx, nodes[0].input, {
        type: this.type,
        frequency,
        env: this._env,
        gain: this._gain,
      });

      nodes.forEach((node) => {
        if (!(node instanceof FilterEffect)) return;
        node.apply(startTime + noteDuration * i, noteDuration);
      });
      osc.play(startTime + noteDuration * i, noteDuration);

      this.oscillators.add(osc);
      osc.node.onended = () => this.oscillators.delete(osc);
    });
  }

  start2() {
    const nodes = super.connectChain();
    const cycleIndex = this.drome.metronome.bar % this.cycles.length;
    const cycle = this.cycles[cycleIndex];
    const startTime = this.drome.barStartTime;
    const noteDuration = this.drome.barDuration / cycle.length;

    cycle.forEach((pattern, i) => {
      if (pattern === 0) return;

      const play = (note: number) => {
        const frequency = parseFloat(note.toString()) ?? 1;
        const osc = new DromeOscillator(this.ctx, nodes[0].input, {
          type: this.type,
          frequency,
          env: this._env,
          gain: this._gain,
        });

        nodes.forEach((node) => {
          if (!(node instanceof FilterEffect)) return;
          node.apply(startTime + noteDuration * i, noteDuration);
        });
        osc.play(startTime + noteDuration * i, noteDuration);

        this.oscillators.add(osc);
        osc.node.onended = () => this.oscillators.delete(osc);
      };

      if (Array.isArray(pattern)) pattern.forEach(play);
      else play(pattern);
    });
  }

  stop() {
    this.oscillators.forEach((osc) => osc.stop());
  }
}

export default DromeSynth;
