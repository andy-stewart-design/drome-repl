import DromeArray from "./drome-array";
import Sample from "./sample";
import Synth, { synthAliasMap } from "./synth";
import type { SampleName, SynthAlias } from "./types";

type IterationCallback = (n: number) => void;

class Drome {
  readonly ctx = new AudioContext();
  private instruments: (Synth | Sample)[] = [];
  readonly sampleBuffers = new Map<string, AudioBuffer>();
  private _duration = 2;
  private intervalID: ReturnType<typeof setInterval> | undefined;
  private tick = 0;
  private phase = 0;
  private precision = 10 ** 4;
  private minLatency = 0.01;
  private interval = 0.1;
  private overlap = 0.05;
  private startCallbacks: (() => void)[] = [];
  private iterationCallbacks: IterationCallback[] = [];
  private stopCallbacks: (() => void)[] = [];
  private _paused = true;

  constructor(bpm = 120) {
    this.bpm(bpm);
  }

  private onTick() {
    const t = this.ctx.currentTime;
    const lookahead = t + this.interval + this.overlap; // the time window for this tick
    if (this.phase === 0) {
      this.phase = t + this.minLatency;
    }
    // callback as long as we're inside the lookahead
    while (this.phase < lookahead) {
      this.phase = Math.round(this.phase * this.precision) / this.precision;
      this.phase >= t &&
        this.instruments.forEach((inst) => inst.play(this.phase));
      this.phase += this._duration; // increment phase by duration
      this.tick++;
      this.iterationCallbacks.forEach((cb) => cb(this.tick));
    }
  }

  public start() {
    if (!this._paused) return;

    this.onTick();
    this.intervalID = setInterval(this.onTick.bind(this), this.interval * 1000);
    this._paused = false;
    this.startCallbacks.forEach((cb) => cb());
  }

  public pause() {
    clearInterval(this.intervalID);
    this._paused = true;
  }

  public stop() {
    this.tick = 0;
    this.phase = 0;
    this.pause();
    this.stopCallbacks.forEach((cb) => cb());
  }

  public setDuration(setter: (n: number) => number) {
    this._duration = setter(this._duration);
  }

  public bpm(bpm: number) {
    if (bpm <= 0) return;
    this._duration = (60 / bpm) * 4;
  }

  public addInstrument(inst: Synth | Sample, replace = false) {
    if (replace) this.instruments = [inst];
    else this.instruments.push(inst);
  }

  public clearInstruments() {
    this.instruments.length = 0;
  }

  public onStart(cb: () => void) {
    this.startCallbacks.push(cb);
  }

  public onIterationStart(cb: (n: number) => void) {
    this.iterationCallbacks.push(cb);
  }

  public onStop(cb: () => void) {
    this.stopCallbacks.push(cb);
  }

  public synth(type: SynthAlias = "sine", harmonics?: number) {
    const synth = new Synth(this, synthAliasMap[type], harmonics);
    // this.addInstrument(synth);
    return synth;
  }

  public sample(name: SampleName = "bd", index = 0) {
    const sample = new Sample(this, name, index);
    // this.addInstrument(sample);
    return sample;
  }

  public stack(...intruments: (Synth | Sample)[]) {
    intruments.forEach((inst) => {
      this.addInstrument(inst);
    });
  }

  public euclid(pulses: number, steps: number, rotation = 0) {
    return new DromeArray().euclid(pulses, steps, rotation);
  }

  public range(start: number, end?: number, stepOrIncl: number | boolean = 1) {
    return new DromeArray().range(start, end, stepOrIncl);
  }

  public stretch(arr: number[], stretchFactor: number) {
    return new DromeArray(arr).stretch(stretchFactor);
  }

  public destroy() {
    // Stop everything immediately
    this.stop();

    // Clear all callbacks to break references
    this.startCallbacks = [];
    this.iterationCallbacks = [];
    this.stopCallbacks = [];

    // Destroy instruments if they have their own cleanup
    this.instruments.forEach((inst) => inst.destroy());
    this.instruments = [];

    // Close AudioContext to release system audio resources
    if (this.ctx.state !== "closed") this.ctx.close().catch(() => {});

    // Make sure no timers are still running
    if (this.intervalID) {
      clearInterval(this.intervalID);
      this.intervalID = undefined;
    }
  }

  get duration() {
    return this._duration;
  }

  get paused() {
    return this._paused;
  }
}

export default Drome;
