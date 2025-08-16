interface Metronome {
  beat: number;
  bar: number;
}

type IterationCallback = (tick: number, phase: number) => void;

class AudioClock {
  readonly ctx = new AudioContext();
  readonly metronome: Metronome = { beat: 0, bar: 0 };
  private intervalID: ReturnType<typeof setInterval> | undefined;
  private _paused = true;
  private _duration = 2;
  private currentBarDuration = 2;
  private bar = 0;
  private beat = 0;
  private nextBarStart = 0;
  private nextBeatStart = 0;
  private _beatsPerBar = 4;
  private precision = 10 ** 4;
  private minLatency = 0.01;
  private interval = 0.1;
  private overlap = 0.05;

  private onStartCallbacks: (() => void)[] = [];
  private onBarCallbacks: IterationCallback[] = [];
  private onStopCallbacks: (() => void)[] = [];

  constructor(bpm = 120) {
    this.bpm(bpm);
  }

  private onTick() {
    const t = this.ctx.currentTime;
    const lookahead = t + this.interval + this.overlap; // the time window for this tick

    if (this.nextBarStart === 0) this.nextBarStart = t + this.minLatency;
    if (this.nextBeatStart === 0) this.nextBeatStart = t + this.minLatency;

    // callback as long as we're inside the lookahead
    while (this.nextBarStart < lookahead) {
      this.nextBarStart =
        Math.round(this.nextBarStart * this.precision) / this.precision;
      // TODO: is this necessary?
      if (this.nextBarStart >= t) {
        this.onBarCallbacks.forEach((cb) => cb(this.bar, this.nextBarStart));
        this.currentBarDuration = this._duration;
      }
      this.nextBarStart += this._duration;
      this.bar++;
      this.metronome.bar++;
    }

    while (this.nextBeatStart < lookahead) {
      this.nextBeatStart =
        Math.round(this.nextBeatStart * this.precision) / this.precision;

      this.nextBeatStart += this.currentBarDuration / this._beatsPerBar;
      console.log(this.metronome);
      this.beat = (this.beat + 1) % this._beatsPerBar;
      this.metronome.beat = (this.metronome.beat + 1) % this._beatsPerBar;
    }
  }

  public async start() {
    if (!this._paused) return;
    this.onTick();
    this.intervalID = setInterval(this.onTick.bind(this), this.interval * 1000);
    this._paused = false;
    this.onStartCallbacks.forEach((cb) => cb());
  }

  public pause() {
    clearInterval(this.intervalID);
    this._paused = true;
  }

  public stop() {
    this.bar = 0;
    this.beat = 0;
    this.nextBarStart = 0;
    this.nextBeatStart = 0;
    this.pause();
    this.onStopCallbacks.forEach((cb) => cb());
  }

  public bpm(bpm: number) {
    if (bpm <= 0) return;
    this._duration = (60 / bpm) * 4;
  }

  public on() {}

  public onStart(cb: () => void) {
    this.onStartCallbacks.push(cb);
  }

  public onIteration(cb: IterationCallback) {
    this.onBarCallbacks.push(cb);
  }

  public onStop(cb: () => void) {
    this.onStopCallbacks.push(cb);
  }

  public destroy() {
    // Stop everything immediately
    this.stop();

    // Clear all callbacks to break references
    this.onStartCallbacks = [];
    this.onBarCallbacks = [];
    this.onStopCallbacks = [];

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

  get barStartTime() {
    return this.nextBarStart;
  }
}

export default AudioClock;
