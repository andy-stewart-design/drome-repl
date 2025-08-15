type IterationCallback = (tick: number, phase: number) => void;

class AudioClock {
  readonly ctx = new AudioContext();
  private intervalID: ReturnType<typeof setInterval> | undefined;
  private _paused = true;
  private _duration = 2;
  private tick = 0;
  private phase = 0;
  private precision = 10 ** 4;
  private minLatency = 0.01;
  private interval = 0.1;
  private overlap = 0.05;

  private startCallbacks: (() => void)[] = [];
  private iterationCallbacks: IterationCallback[] = [];
  private stopCallbacks: (() => void)[] = [];

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
      if (this.phase >= t) {
        this.iterationCallbacks.forEach((cb) => cb(this.tick, this.phase));
      }
      this.phase += this._duration; // increment phase by duration
      this.tick++;
    }
  }

  public async start() {
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

  public onStart(cb: () => void) {
    this.startCallbacks.push(cb);
  }

  public onIteration(cb: IterationCallback) {
    this.iterationCallbacks.push(cb);
  }

  public onStop(cb: () => void) {
    this.stopCallbacks.push(cb);
  }

  public destroy() {
    // Stop everything immediately
    this.stop();

    // Clear all callbacks to break references
    this.startCallbacks = [];
    this.iterationCallbacks = [];
    this.stopCallbacks = [];

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

export default AudioClock;
