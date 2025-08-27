import AudioClock from "./audio-clock";
import DromeSynth from "../instruments/drome-synth";
import DromeSample from "../instruments/drome-sample";
import DromeGain from "./drome-gain";
import type { SampleNote } from "../types";

class Drome extends AudioClock {
  private instruments: Set<DromeSynth | DromeSample> = new Set();
  private master: DromeGain;
  readonly sampleBuffers: Map<string, AudioBuffer> = new Map();

  constructor(bpm?: number) {
    super(bpm);
    this.master = new DromeGain(this.ctx, 0.5);
    this.on("bar", this.handleTick.bind(this));
  }

  private handleTick() {
    this.instruments.forEach((inst) => inst.start());
  }

  private async preloadSamples() {
    const samplePromises = [...this.instruments].flatMap((inst) => {
      if (inst instanceof DromeSynth) return [];
      return inst.preloadSamples();
    });
    await Promise.all(samplePromises);
  }

  public async start() {
    if (!this.paused) return;
    await this.preloadSamples();
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

  public stack(...intruments: (DromeSynth | DromeSample)[]) {
    intruments.forEach((inst) => this.instruments.add(inst));
  }

  public synth(type: OscillatorType = "sine") {
    return new DromeSynth(this, this.master, type);
  }

  public sample(name?: SampleNote) {
    return new DromeSample(this, this.master, name);
  }

  public cleanup() {
    super.cleanup();
    this.instruments.forEach((inst) => inst.cleanup());
    this.instruments.clear();
  }
}

export default Drome;
