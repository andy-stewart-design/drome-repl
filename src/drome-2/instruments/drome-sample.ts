import Sample from "./sample";
import type Drome from "../core/drome";
import type { DromeAudioNode } from "../types";

const sampleUrl =
  "https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/RolandTR909/rolandtr909-bd/Bassdrum-04.wav";

class DromeSample extends Sample {
  private drome: Drome;

  constructor(drome: Drome, destination: DromeAudioNode) {
    super(drome.ctx, destination);
    this.drome = drome;
  }

  async start() {
    const startTime = this.drome.ctx.currentTime + 0.01;
    const duration = 1;

    let buffer =
      this.drome.sampleBuffers.get(sampleUrl) ??
      (await this.loadSample(sampleUrl));

    if (!buffer) {
      console.error(`[DromeSample]: couldn't load sample from ${sampleUrl}`);
      return;
    }

    // console.log("starting sample", this.drome.sampleBuffers);
    this.drome.sampleBuffers.set(sampleUrl, buffer);
    this.play(buffer, startTime, duration);
  }
}

export default DromeSample;
