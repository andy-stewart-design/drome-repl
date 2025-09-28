import AudioClock from "./audio-clock";
import DromeSynth from "../instruments/drome-synth";
import DromeSample from "../instruments/drome-sample";
import GainEffect from "../effects/gain";
import DromeArray, { type DromeCyclePartial } from "./drome-array";
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

const BASE_GAIN = 0.75;
const NUM_CHANNELS = 8;

class Drome extends AudioClock {
  private instruments: Set<DromeSynth | DromeSample> = new Set();
  private audioChannels: GainEffect[];
  readonly sampleBuffers: Map<string, AudioBuffer> = new Map();
  readonly reverbCache: Map<string, AudioBuffer> = new Map();
  readonly replListeners: [DromeEventType, DromeEventCallback][] = [];

  constructor(bpm?: number) {
    super(bpm);
    this.audioChannels = Array.from({ length: NUM_CHANNELS }).map(
      () => new GainEffect(this.ctx, BASE_GAIN)
    );
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
    this.audioChannels.forEach((chan) => {
      chan.gain.cancelScheduledValues(this.ctx.currentTime);
      chan.volume = BASE_GAIN;
    });
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
    return new DromeSynth(this, this.audioChannels, ...types);
  }

  public sample(...name: SampleNote[]) {
    return new DromeSample(this, this.audioChannels, ...name);
  }

  public achan(n: number) {
    return this.audioChannels[n];
  }

  public duck(chanIdx: number | number[], t?: number, d?: number, a = 0.333) {
    [chanIdx].flat().forEach((idx) => {
      const chan = this.audioChannels[idx];
      if (!t) t = this.ctx.currentTime;
      d = typeof d === "number" ? Math.min(Math.max(1 - d, 0), 1) : 0;
      chan.gain.cancelScheduledValues(t);
      chan.gain.setValueAtTime(chan.gain.value, t);
      chan.gain.linearRampToValueAtTime(d, t + 0.02); // quick dip
      chan.gain.linearRampToValueAtTime(
        BASE_GAIN,
        t + this.beatDuration * Math.min(a, 1)
      );
    });
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

  // DROME ARRAY METHODS
  note(...notes: DromeCyclePartial<number>[]) {
    return new DromeArray([[0]]).note(...notes);
  }

  euclid(pulses: number | number[], steps: number, rotation = 0) {
    return new DromeArray([[1]]).euclid(pulses, steps, rotation);
  }

  // RANDOM GETTERS
  get rand() {
    return createRand(this.metronome);
  }

  get brand() {
    return createBinaryRand(this.metronome);
  }

  get irand() {
    return createIntegerRand(this.metronome);
  }
}

export default Drome;
