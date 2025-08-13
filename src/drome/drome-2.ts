import AudioClock, { type AudioClockCallbackData } from "@/drome/audio-clock";
import Synth from "./synth-2";

class Drome extends AudioClock {
  private instruments: Synth[] = [];
  private queue: Synth[] = [];
  private _granularity: 4 | 8 | 16 = 8;

  constructor() {
    super();
    this.callback = this.onTick.bind(this);
    // this.queue.push(new Synth(this));
  }

  private onTick() {
    this.pushQueue();
    this.play();
  }

  private pushQueue() {
    if (this.metronome.step % this._granularity === 0 && this.queue.length) {
      console.log("updating queue");
      this.queue.forEach((inst) => {
        this.instruments.push(inst);
        if (!this.isFirstTick && this._granularity < this.stepCount) {
          console.log("calling instrument's onPush method");
          inst.onPush();
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
      console.log("playing");
      this.instruments.forEach((inst) => inst.play());
    }
  }
}

export default Drome;
export { Drome, type AudioClockCallbackData as DromeCallbackData };
