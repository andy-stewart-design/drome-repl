import AudioClock from "./audio-clock";
import DromeSynth from "../instruments/drome-synth";
import DromeSample from "../instruments/drome-sample";
import GainEffect from "../effects/gain";
import type { OscTypeAlias, SampleNote } from "../types";

const achans = [0.5, 0.875];

class Drome extends AudioClock {
  private instruments: Set<DromeSynth | DromeSample> = new Set();
  private audioChannels: GainEffect[];
  readonly sampleBuffers: Map<string, AudioBuffer> = new Map();

  constructor(bpm?: number) {
    super(bpm);
    this.audioChannels = achans.map((gain) => new GainEffect(this.ctx, gain));
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

  public push(inst: DromeSynth | DromeSample) {
    this.instruments.add(inst);
  }

  public stack(...intruments: (DromeSynth | DromeSample)[]) {
    intruments.forEach((inst) => inst.push());
  }

  public clear() {
    this.instruments.clear();
  }

  public synth(type: OscTypeAlias = "sine") {
    return new DromeSynth(this, this.audioChannels[0], type);
  }

  public sample(name?: SampleNote) {
    return new DromeSample(this, this.audioChannels[1], name);
  }

  public cleanup() {
    super.cleanup();
    this.instruments.forEach((inst) => inst.cleanup());
    this.instruments.clear();
  }
}

export default Drome;
