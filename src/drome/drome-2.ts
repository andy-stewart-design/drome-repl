import AudioClock, { type AudioClockCallbackData } from "@/drome/audio-clock";
import Synth from "./synth-2";
import DromeArray from "./drome-array";

class Drome extends AudioClock {
  private instruments: Synth[] = [];
  private queue: Synth[] = [];
  private _granularity: 4 | 8 | 16 = 16;

  constructor(bpm?: number) {
    super(bpm);
    this.onStep = this.onTick.bind(this);
    this.queue.push(new Synth(this));
  }

  private onTick() {
    this.dequeue();
    this.play();
  }

  public enqueue(instrument: Synth) {
    this.queue.push(instrument);
  }

  private dequeue() {
    if (this.metronome.step % this._granularity === 0 && this.queue.length) {
      console.log("[DROME] updating queue");
      this.queue.forEach((inst) => {
        this.instruments.push(inst);
        // Never do this on the first step because
        if (this.metronome.step) {
          console.log("[DROME] calling play after pushing from queue");
          inst.play();
        }
      });
      this.queue.length = 0;
    }
  }

  public clearInstruments() {
    this.instruments.length = 0;
  }

  play() {
    if (!this.queue.length && !this.instruments.length) {
      this.queue.push(new Synth(this));
    }
    if (this.metronome.step % 16 === 0 && this.instruments.length) {
      this.instruments.forEach((inst) => inst.play());
    }
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
}

export default Drome;
export { Drome, type AudioClockCallbackData as DromeCallbackData };
