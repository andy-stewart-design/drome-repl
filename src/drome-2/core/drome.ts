import AudioClock from "./audio-clock";
import Synth from "../instruments/synth";
import Sample from "../instruments/sample";
import DromeGain from "./drome-gain";

class Drome extends AudioClock {
  private instruments: Set<Synth | Sample> = new Set();
  private master: DromeGain;

  constructor(bpm?: number) {
    super(bpm);
    this.master = new DromeGain(this.ctx, 0.5);
    this.on("bar", this.handleTick.bind(this));
  }

  private handleTick() {
    this.instruments.forEach((inst) => inst.play());
  }

  public async start() {
    if (!this.paused) return;
    // await this.preloadSamples();
    super.start();
  }

  public stop() {
    super.stop();
    this.instruments.forEach((inst) => inst.stop());
  }

  public addInstrument(inst: Synth | Sample) {
    this.instruments.add(inst);
  }

  public clearInstruments() {
    this.instruments.clear();
  }

  public synth(type: OscillatorType = "sine") {
    return new Synth(this.ctx, this.master, type);
  }

  //   public sample(name: SampleName = "bd", index = 0) {
  public sample() {
    return new Sample(this.ctx, this.master);
  }
}

export default Drome;
