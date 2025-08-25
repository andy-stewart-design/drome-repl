import DromeInstrument from "./drome-instrument";
import DromeOscillator from "./drome-oscillator";
import type Drome from "../core/drome";
import type { DromeAudioNode } from "../types";

class DromeSynth extends DromeInstrument {
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
    const startTime = this.drome.barStartTime;
    const duration = this.drome.barDuration;
    const destination = super._play(startTime, duration);
    const noteDuration = duration / this.notes.length;
    const offset = this.drome.barDuration / this.notes.length;

    this.notes.forEach((note, i) => {
      const frequency = parseFloat(note.toString()) ?? 1;
      const osc = new DromeOscillator(this.ctx, destination.input, {
        type: this.type,
        frequency,
        env: this._env,
        gain: this._gain,
      });

      osc.play(startTime + offset * i, noteDuration);
      this.oscillators.add(osc);
      osc.node.onended = () => this.oscillators.delete(osc);
    });
  }

  stop() {
    this.oscillators.forEach((osc) => osc.stop());
  }
}

export default DromeSynth;
