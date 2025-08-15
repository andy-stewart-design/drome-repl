import AudioClock, { type AudioClockCallbackData } from "@/drome/audio-clock";
import Synth from "./synth-2";
import DromeArray from "./drome-array";
import type { OscType } from "./types";

// drome.synth().note([60, 64, 67, 64, 60]).push()

class Drome extends AudioClock {
  private instruments: Set<Synth> = new Set();
  private queue: Synth[] = [];
  readonly granularity: 4 | 8 | 16 = 8;

  constructor(bpm?: number) {
    super(bpm);
    this.onStep = this.onTick.bind(this);
  }

  private onTick() {
    this.dequeue();
    this.play();
  }

  public play() {
    if (this.metronome.step % this.granularity === 0 && this.instruments.size) {
      this.instruments.forEach((inst) => inst.play());
    }
  }

  public enqueue(instrument: Synth) {
    this.queue.push(instrument);
  }

  private dequeue() {
    if (this.metronome.step % this.granularity === 0 && this.queue.length) {
      console.log("[DROME] updating queue", this.queue.length);
      this.queue.forEach((inst) => {
        this.instruments.add(inst);
        // Never do this on the first step of a bar
        // if (this.metronome.step) {
        //   console.log("[DROME] calling play after pushing from queue");
        //   inst.play();
        // }
      });
      this.queue.length = 0;
    }
  }

  public synth(type?: OscType) {
    return new Synth(this, type);
  }

  public stack(...intruments: Synth[]) {
    intruments.forEach((inst) => inst.push());
  }

  public clearInstruments() {
    this.instruments.clear();
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

  public destroy() {}
}

export default Drome;
export { Drome, type AudioClockCallbackData as DromeCallbackData };
