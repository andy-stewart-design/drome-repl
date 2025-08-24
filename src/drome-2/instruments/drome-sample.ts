import Sample from "./sample";
import type Drome from "../core/drome";
import type { DromeAudioNode } from "../types";

class DromeSample extends Sample {
  private drome: Drome;

  constructor(drome: Drome, destination: DromeAudioNode) {
    super(drome.ctx, destination);
    this.drome = drome;
  }

  start() {
    const startTime = this.drome.ctx.currentTime + 0.01;
    const duration = 1;
    this.play(startTime, duration);
  }
}

export default DromeSample;
