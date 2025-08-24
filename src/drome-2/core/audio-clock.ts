interface Metronome {
  beat: number;
  bar: number;
}

type DromeEventType = "start" | "pause" | "stop" | "beat" | "bar";
type DromeEventCallback = (m: Metronome) => void;

class AudioClock {
  readonly ctx = new AudioContext();
  readonly metronome: Metronome = { beat: 0, bar: 0 };
  private currentBarDuration = 2;
  private _duration = 2; // set by bpm method, applied to currentBarDuration at beginning of each cycle
  private nextBarStart = 0;
  private nextBeatStart = 0;
  private _beatsPerBar = 4;
  private _paused = true;
  private precision = 10 ** 4;
  private minLatency = 0.01;
  private interval = 0.1;
  private overlap = 0.05;
  private intervalID: ReturnType<typeof setInterval> | undefined;
  private listeners: Map<DromeEventType, DromeEventCallback[]> = new Map();

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

      if (this.nextBarStart >= t) {
        this.listeners.get("bar")?.forEach((cb) => {
          cb(this.metronome);
        });
      }

      this.currentBarDuration = this._duration;
      this.nextBarStart += this._duration;
      this.metronome.bar++;
    }

    while (this.nextBeatStart < lookahead) {
      this.nextBeatStart =
        Math.round(this.nextBeatStart * this.precision) / this.precision;
      this.nextBeatStart += this.currentBarDuration / this._beatsPerBar;

      this.listeners.get("beat")?.forEach((cb) => {
        cb({ ...this.metronome, beat: this.metronome.beat + 1 });
      });

      this.metronome.beat = (this.metronome.beat + 1) % this._beatsPerBar;
    }
  }

  public async start() {
    if (!this._paused) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.onTick();
    this.intervalID = setInterval(this.onTick.bind(this), this.interval * 1000);
    this._paused = false;

    this.listeners.get("start")?.forEach((cb) => {
      cb(this.metronome);
    });
  }

  public pause() {
    clearInterval(this.intervalID);
    this._paused = true;
    this.listeners.get("pause")?.forEach((cb) => {
      cb(this.metronome);
    });
  }

  public stop() {
    this.metronome.bar = 0;
    this.metronome.beat = 0;
    this.nextBarStart = 0;
    this.nextBeatStart = 0;
    this.pause();

    this.listeners.get("stop")?.forEach((cb) => {
      cb(this.metronome);
    });
  }

  public bpm(bpm: number) {
    if (bpm <= 0) return;
    this._duration = (60 / bpm) * 4;
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
    // Stop everything immediately
    this.stop();
    // Clear all callbacks to break references
    this.listeners.clear();
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
export type { Metronome };
