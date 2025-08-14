import type { Drome } from "./drome-2";
import Oscillator from "./oscillator";
import { midiToFreq } from "./utils/midi";

class Synth {
  private drome: Drome;
  //   public notes = Array.from({ length: 8 }, (_, i) => (i ? 69 : 81));
  public notes = [69];

  constructor(drome: Drome) {
    this.drome = drome;
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
        type: "square",
        adsr: { a: 0.01, d: 0.01, s: 1, r: 0.05 },
        filter: {
          type: "lowpass",
          value: 400,
          adsr: { a: 0.5, d: 0.01, s: 1, r: 0.25 },
        },
      });

      osc.play();
    });
  }
}

export default Synth;
