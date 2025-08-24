import DromeInstrument from "./drome-instrument";
import Oscillator from "./oscillator";
import type { DromeAudioNode } from "../types";

class DromeSynth extends DromeInstrument {
  private type: OscillatorType;

  constructor(
    ctx: AudioContext,
    destination: DromeAudioNode,
    type: OscillatorType = "sine"
  ) {
    super(ctx, destination);
    this.type = type;
  }

  play() {
    const startTime = this.ctx.currentTime + 0.01;
    const duration = 1;
    const destination = super._play(startTime, duration);

    const osc = new Oscillator(this.ctx, destination.input, {
      type: this.type,
      frequency: 130.81,
      env: this._env,
      gain: this._gain,
    });

    osc.play(startTime, duration);
  }
}

export default DromeSynth;
