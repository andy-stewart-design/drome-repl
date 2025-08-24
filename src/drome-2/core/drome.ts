import AudioClock from "./audio-clock";
import DromeSynth from "../instruments/drome-synth";
import DromeSample from "../instruments/drome-sample";
import DromeGain from "./drome-gain";

class Drome extends AudioClock {
  private instruments: Set<DromeSynth | DromeSample> = new Set();
  private master: DromeGain;
  readonly sampleBuffers: Map<string, AudioBuffer> = new Map();

  constructor(bpm?: number) {
    super(bpm);
    this.master = new DromeGain(this.ctx, 0.5);
    this.on("beat", this.handleTick.bind(this));
    this.on("beat", (met) => console.log(met));
  }

  private handleTick() {
    this.instruments.forEach((inst) => inst.start());
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

  public addInstrument(inst: DromeSynth | DromeSample) {
    this.instruments.add(inst);
  }

  public clearInstruments() {
    this.instruments.clear();
  }

  public synth(type: OscillatorType = "sine") {
    return new DromeSynth(this, this.master, type);
  }

  //   public sample(name: SampleName = "bd", index = 0) {
  public sample() {
    return new DromeSample(this, this.master);
  }

  public destroy() {
    super.destroy();
    // this.instruments.forEach((inst) => inst.destroy());
    this.instruments.clear();
  }
}

export default Drome;
