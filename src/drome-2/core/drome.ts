import AudioClock from "./audio-clock";
import DromeSynth from "../instruments/drome-synth";
import DromeSample from "../instruments/drome-sample";
import GainEffect from "../effects/gain";
import type {
  OscTypeAlias,
  SampleNote,
  DromeEventType,
  DromeEventCallback,
} from "../types";

import {
  createRand,
  createIntegerRand,
  createBinaryRand,
} from "../utils/random";

const AUDIO_CHANNELS = [0.375, 0.875];

class Drome extends AudioClock {
  private instruments: Set<DromeSynth | DromeSample> = new Set();
  private audioChannels: GainEffect[];
  readonly rand: ReturnType<typeof createRand>;
  readonly brand: ReturnType<typeof createBinaryRand>;
  readonly irand: ReturnType<typeof createIntegerRand>;
  readonly sampleBuffers: Map<string, AudioBuffer> = new Map();
  readonly replListeners: [DromeEventType, DromeEventCallback][] = [];

  constructor(bpm?: number) {
    super(bpm);
    this.audioChannels = AUDIO_CHANNELS.map(
      (gain) => new GainEffect(this.ctx, gain)
    );
    this.rand = createRand(this.metronome);
    this.brand = createBinaryRand(this.metronome);
    this.irand = createIntegerRand(this.metronome);
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
    this.clearReplListeners();
  }

  public push(inst: DromeSynth | DromeSample) {
    this.instruments.add(inst);
  }

  public stack(...intruments: (DromeSynth | DromeSample)[]) {
    intruments.forEach((inst) => inst.push());
  }

  public clear() {
    this.instruments.clear();
    this.clearReplListeners();
  }

  public synth(...types: OscTypeAlias[]) {
    return new DromeSynth(this, this.audioChannels[0], ...types);
  }

  public sample(...name: SampleNote[]) {
    return new DromeSample(this, this.audioChannels[1], ...name);
  }

  public onBeat(cb: DromeEventCallback) {
    this.on("beat", cb);
    this.replListeners.push(["beat", cb]);
  }

  public onBar(cb: DromeEventCallback) {
    this.on("bar", cb);
    this.replListeners.push(["bar", cb]);
  }

  public clearReplListeners() {
    this.replListeners.forEach(([type, cb]) => {
      this.off(type, cb);
    });
    this.replListeners.length = 0;
  }

  public cleanup() {
    super.cleanup();
    this.instruments.forEach((inst) => inst.cleanup());
    this.instruments.clear();
  }
}

export default Drome;
