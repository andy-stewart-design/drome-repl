interface Metronome {
  step: number;
  beat: number;
  bar: number;
}

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

  // ---------------------------------------------------------------
  readonly metronome: Metronome = { step: 0, beat: 0, bar: 0 };
  private timerId: ReturnType<typeof setInterval> | null = null;
  private scheduleAheadTime = 0.18; //How far ahead to schedule events (in seconds)
  private lookAhead = 20.0; //How frequently to call scheduling (in ms)
  private _barStartTime = 0;
  private _nextStepTime = 0;
  private _bpm = 120;
  private _stepsPerBeat = 4;
  private _beatsPerBar = 4;
  private _stepDuration = 0.125;
  private _barDuration = 2;
  private onStartCallback: (() => void) | undefined;
  private onStepCallback: ((m: Metronome) => void) | undefined;
  private onBeatCallback: ((m: Metronome) => void) | undefined;
  private onBarCallback: ((m: Metronome) => void) | undefined;
  private onStopCallback: (() => void) | undefined;
  // ---------------------------------------------------------------

  constructor(bpm = 120) {
    this.bpm(bpm);
    this.setStepDuration();
  }

  private setStepDuration() {
    this._stepDuration = 60.0 / this._bpm / this._stepsPerBeat;
    this._barDuration = (60 / this._bpm) * this._beatsPerBar;
  }

  private scheduler() {
    while (this._nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      console.log("scheduler", this.metronome.step);
      if (this.metronome.step === 0) {
        this.iterationCallbacks.forEach((cb) =>
          cb(this.tick, this.barStartTime)
        );
      }
      if (this._paused) return;
      this.scheduleStep();
      this.nextStep();
    }
  }

  private scheduleStep() {
    this.onStepCallback?.(this.metronome);

    if (this.metronome.step % this._stepsPerBeat === 0) {
      this.onBeatCallback?.(this.metronome);
    }

    if (this.metronome.step % (this._stepsPerBeat * this._beatsPerBar) === 0) {
      this.onBarCallback?.(this.metronome);
    }
  }

  private nextStep() {
    if (this._paused) return;

    this._nextStepTime += this._stepDuration;

    this.metronome.step++;

    // console.log(this.metronome);

    if (this.metronome.step == this.stepCount) {
      this.metronome.step = 0;
      this.metronome.bar++;
      this._barStartTime = this._nextStepTime;
    }

    if (this.metronome.step % this._stepsPerBeat == 0) {
      this.metronome.beat++;

      if (this.metronome.beat == this._beatsPerBar) {
        this.metronome.beat = 0;
      }
    }
  }

  get stepCount() {
    return this._beatsPerBar * this._stepsPerBeat;
  }

  get barStartTime() {
    return this._barStartTime;
  }

  get barDuration() {
    return this._barDuration;
  }

  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------

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
        // this.iterationCallbacks.forEach((cb) => cb(this.tick, this.phase));
      }
      this.phase += this._duration; // increment phase by duration
      this.tick++;
    }
  }

  public async start() {
    if (!this._paused) return;
    // ---------------------------------------------------------------
    this.ctx.resume();
    this._nextStepTime = this.ctx.currentTime + this.scheduleAheadTime;
    this._barStartTime = this._nextStepTime;
    // this.iterationCallbacks.forEach((cb) =>
    //   cb(this.metronome.bar, this.ctx.currentTime)
    // );
    this.onStartCallback?.();
    this.timerId = setInterval(this.scheduler.bind(this), this.lookAhead);
    // ---------------------------------------------------------------
    this._paused = false;
    this.onTick();
    this.intervalID = setInterval(this.onTick.bind(this), this.interval * 1000);
    this.startCallbacks.forEach((cb) => cb());
  }

  public pause() {
    clearInterval(this.intervalID);
    // ---------------------------------------------------------------
    if (this._paused || this.timerId === null) return;
    this._paused = true;
    clearInterval(this.timerId);
    this.timerId = null;
    // ---------------------------------------------------------------
    this._paused = true;
  }

  public stop() {
    this.tick = 0;
    this.phase = 0;
    // this.pause();
    this.stopCallbacks.forEach((cb) => cb());
    // ---------------------------------------------------------------
    if (this._paused || this.timerId === null) return;
    this.pause();
    this.metronome.step = 0;
    this.metronome.beat = 0;
    this.metronome.bar = 0;
    console.log(this.metronome);

    this._nextStepTime = 0;
    this.onStopCallback?.();
  }

  public setDuration(setter: (n: number) => number) {
    this._duration = setter(this._duration);
  }

  public bpm(bpm: number) {
    if (bpm <= 0) return;
    this._duration = (60 / bpm) * 4;
    // ---------------------------------------------------------------
    this._bpm = bpm;
    this.setStepDuration();
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
