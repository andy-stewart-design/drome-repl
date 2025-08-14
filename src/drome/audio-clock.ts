interface Metronome {
  step: number;
  beat: number;
  bar: number;
}

interface AudioClockCallbackData extends Metronome {
  startTime: number;
  stepLength: number;
  barStartTime: number;
}

class AudioClock {
  readonly ctx = new AudioContext();
  readonly metronome: Metronome = { step: 0, beat: 0, bar: 0 };

  private timerId: ReturnType<typeof setInterval> | null = null;
  private scheduleAheadTime = 0.18; //How far ahead to schedule events (in seconds)
  private lookAhead = 20.0; //How frequently to call scheduling (in ms)
  private _nextStepTime = 0;
  private _barStartTime = 0;
  private _paused = true;
  private _stepLength = 0.12;
  private _tempo = 120;
  private _stepsPerBeat = 4;
  private _beatsPerBar = 4;
  private _barDuration = 2;
  private onStepCallback: ((n: number) => void) | undefined;
  private onBeatCallback: ((n: number) => void) | undefined;
  private onBarCallback: ((n: number) => void) | undefined;

  constructor() {
    this.setStepLength();
  }

  private setStepLength() {
    this._stepLength = 60.0 / this._tempo / this._stepsPerBeat;
    this._barDuration = (60 / this._tempo) * this._beatsPerBar;
  }

  private scheduler() {
    while (this._nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      if (this._paused) return;
      this.scheduleStep();
      this.nextStep();
    }
  }

  private scheduleStep() {
    this.onStepCallback?.(this.metronome.step);

    if (this.metronome.step % this._stepsPerBeat === 0) {
      this.onBeatCallback?.(this.metronome.beat);
    }

    if (this.metronome.step % (this._stepsPerBeat * this._beatsPerBar) === 0) {
      this.onBarCallback?.(this.metronome.bar);
    }
  }

  private nextStep() {
    if (this._paused) return;

    this._nextStepTime += this._stepLength;

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

  start() {
    if (!this._paused) return;

    this.ctx.resume(); //Context must not be in paused state, so attempt to resume here

    this._paused = false;
    this._nextStepTime = this.ctx.currentTime + this.scheduleAheadTime;
    this._barStartTime = this._nextStepTime;
    this.timerId = setInterval(this.scheduler.bind(this), this.lookAhead);
  }

  stop() {
    if (this._paused || this.timerId === null) return;

    this.pause();
    this.metronome.step = 0;
    this.metronome.bar = 0;
    this._nextStepTime = 0;
  }

  pause() {
    if (this._paused || this.timerId === null) return;
    this._paused = true;
    clearInterval(this.timerId);
    this.timerId = null;
  }

  tempo(tempo: number) {
    this._tempo = tempo;
    this.setStepLength();
  }

  stepsPerBeat(steps: number) {
    this._stepsPerBeat = steps;
    this.setStepLength();
  }

  beatsPerBar(beats: number) {
    this._beatsPerBar = beats;
    this.setStepLength();
  }

  set onStep(cb: (n: number) => void) {
    this.onStepCallback = cb;
  }

  set onBeat(cb: (n: number) => void) {
    this.onBeatCallback = cb;
  }

  set onBar(cb: (n: number) => void) {
    this.onBarCallback = cb;
  }

  get paused() {
    return this._paused;
  }

  get stepStartTime() {
    return this._nextStepTime;
  }

  get barStartTime() {
    return this._barStartTime;
  }

  get barDuration() {
    return this._barDuration;
  }

  get stepLength() {
    return this._stepLength;
  }

  get stepCount() {
    return this._beatsPerBar * this._stepsPerBeat;
  }

  get barDivisions() {
    return this._beatsPerBar;
  }

  get isFirstTick() {
    return this.metronome.bar + this.metronome.beat + this.metronome.step === 0;
  }
}

export default AudioClock;
export type { AudioClock, AudioClockCallbackData };
