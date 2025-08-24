import DromeInstrument from "./drome-instrument";
import DromeOscillator from "./drome-oscillator";
import type { DromeAudioNode } from "../types";

class Synth extends DromeInstrument {
  private type: OscillatorType;
  private oscillators: Set<DromeOscillator> = new Set();

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

    const osc = new DromeOscillator(this.ctx, destination.input, {
      type: this.type,
      frequency: 130.81,
      env: this._env,
      gain: this._gain,
    });

    osc.play(startTime, duration);
    this.oscillators.add(osc);
    osc.node.onended = () => this.oscillators.delete(osc);
  }

  stop() {
    this.oscillators.forEach((osc) => osc.stop());
  }
}

export default Synth;
