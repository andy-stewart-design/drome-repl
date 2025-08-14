import AudioClock, { type AudioClockCallbackData } from "@/drome/audio-clock";
import Synth from "./synth-2";

class Drome extends AudioClock {
  private instruments: Synth[] = [];
  private queue: Synth[] = [];
  private _granularity: 4 | 8 | 16 = 16;

  constructor() {
    super();
    this.onStep = this.onTick.bind(this);
    this.queue.push(new Synth(this));
  }

  private onTick() {
    this.pushQueue();
    this.play();
  }

  private pushQueue() {
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

  play() {
    if (!this.queue.length && !this.instruments.length) {
      this.queue.push(new Synth(this));
    }
    if (this.metronome.step % 16 === 0 && this.instruments.length) {
      this.instruments.forEach((inst) => inst.play());
    }
  }
}

export default Drome;
export { Drome, type AudioClockCallbackData as DromeCallbackData };
