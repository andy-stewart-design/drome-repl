interface Metronome {
  step: number;
  beat: number;
  bar: number;
}

type DromeEventType = "start" | "step" | "beat" | "bar" | "stop";
type DromeEventCallback = (m: Metronome) => void;

class AudioClock {
  readonly ctx = new AudioContext();
  private _paused = true;
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
  private listeners: Map<DromeEventType, DromeEventCallback[]> = new Map();

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
      if (this._paused) return;
      this.emitEvents();
      this.nextStep();
    }
  }

  private emitEvents() {
    if (this.metronome.step % (this._stepsPerBeat * this._beatsPerBar) === 0) {
      this.listeners.get("bar")?.forEach((cb) => {
        cb(this.metronome);
      });
    }

    if (this.metronome.step % this._stepsPerBeat === 0) {
      this.listeners.get("beat")?.forEach((cb) => {
        cb(this.metronome);
      });
    }

    this.listeners.get("step")?.forEach((cb) => {
      cb(this.metronome);
    });
  }

  private nextStep() {
    if (this._paused) return;

    this._nextStepTime += this._stepDuration;

    this.metronome.step++;

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

  public async start() {
    if (!this._paused) return;
    this.ctx.resume();
    this._nextStepTime = this.ctx.currentTime + this.scheduleAheadTime;
    this._barStartTime = this._nextStepTime;
    this.timerId = setInterval(this.scheduler.bind(this), this.lookAhead);
    this._paused = false;
    this.listeners.get("start")?.forEach((cb) => {
      cb(this.metronome);
    });
  }

  public pause() {
    if (this._paused || this.timerId === null) return;
    clearInterval(this.timerId);
    this.timerId = null;
    this._paused = true;
  }

  public stop() {
    if (this._paused || this.timerId === null) return;
    this.pause();
    this.metronome.step = 0;
    this.metronome.beat = 0;
    this.metronome.bar = 0;
    this._nextStepTime = 0;
    this.listeners.get("stop")?.forEach((cb) => {
      cb(this.metronome);
    });
  }

  public bpm(bpm: number) {
    if (bpm <= 0) return;
    this._bpm = bpm;
    this.setStepDuration();
    if (!this._paused) {
      this._nextStepTime = this.ctx.currentTime + this.scheduleAheadTime;
    }
  }

  public on(eventType: DromeEventType, listener: DromeEventCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(listener);
  }

  public off(eventType: DromeEventType, listener: DromeEventCallback) {
    const arr = this.listeners.get(eventType);
    if (!arr) return;
    const idx = arr.indexOf(listener);
    if (idx !== -1) arr.splice(idx, 1);
  }

  public destroy() {
    this.stop();
    this.listeners.clear();
  }

  get duration() {
    return this._barDuration;
  }

  get paused() {
    return this._paused;
  }
}

export default AudioClock;
