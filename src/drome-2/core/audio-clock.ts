// inspired by: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques

interface Metronome {
  beat: number;
  bar: number;
}

type DromeEventType = "start" | "pause" | "stop" | "beat" | "bar";
type DromeEventCallback = (m: Metronome) => void;

class AudioClock {
  readonly ctx = new AudioContext();
  readonly metronome: Metronome = { beat: 0, bar: 0 };
  private _paused = true;
  private _bpm = 120;
  private lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
  private scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
  private nextBeatTime = 0.0;
  private timerID: ReturnType<typeof setTimeout> | null = null;
  private listeners: Map<DromeEventType, DromeEventCallback[]> = new Map();

  constructor(bpm = 120) {
    this.bpm(bpm);
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this._bpm;
    this.nextBeatTime += secondsPerBeat; // Add beat length to last beat time
  }

  private schedule() {
    while (this.nextBeatTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.metronome.beat = (this.metronome.beat + 1) % 4;

      if (this.metronome.beat === 0) {
        this.metronome.bar++;
        this.listeners.get("bar")?.forEach((cb) => {
          cb({ ...this.metronome });
        });
      }

      this.listeners.get("beat")?.forEach((cb) => {
        cb({ ...this.metronome });
      });

      this.nextNote();
    }
    this.timerID = setTimeout(this.schedule.bind(this), this.lookahead);
  }

  public async start() {
    if (!this._paused) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.metronome.bar = -1;
    this.metronome.beat = -1;
    this.nextBeatTime = this.ctx.currentTime;
    this.schedule();
    this._paused = false;

    this.listeners.get("start")?.forEach((cb) => {
      cb(this.metronome);
    });
  }

  public pause() {
    if (!this.timerID) return;
    clearTimeout(this.timerID);
    this._paused = true;
    this.listeners.get("pause")?.forEach((cb) => {
      cb(this.metronome);
    });
  }

  public stop() {
    this.listeners.get("stop")?.forEach((cb) => {
      cb(this.metronome);
    });

    this.metronome.bar = 0;
    this.metronome.beat = 0;
    this.nextBeatTime = 0;
    this.pause();
  }

  public bpm(bpm: number) {
    if (bpm > 0) this._bpm = bpm;
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

  public cleanup() {
    this.stop();
    this.listeners.clear();
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  get paused() {
    return this._paused;
  }

  get barStartTime() {
    return this.nextBeatTime;
  }

  get beatStartTime() {
    return this.nextBeatTime;
  }

  get barDuration() {
    return this.beatDuration * 4;
  }

  get beatDuration() {
    return 60.0 / this._bpm;
  }
}

export default AudioClock;
export type { Metronome };
