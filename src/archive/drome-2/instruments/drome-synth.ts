import Synth from "./synth";
import type Drome from "../core/drome";
import type { DromeAudioNode } from "../types";

class DromeSynth extends Synth {
  private drome: Drome;

  constructor(
    drome: Drome,
    destination: DromeAudioNode,
    type: OscillatorType = "sine"
  ) {
    super(drome.ctx, destination, type);
    this.drome = drome;
  }

  start() {
    const startTime = this.drome.beatStartTime + 0.01;
    const duration = 1;
    this.play(130.81, startTime, duration);
  }
}

export default DromeSynth;
