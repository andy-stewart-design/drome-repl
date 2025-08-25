import Sample from "./sample";
import drumMachines from "../sample-dictionaries/drum-machines.json";
import type Drome from "../core/drome";
import type { DromeAudioNode } from "../types";

class DromeSample extends Sample {
  private drome: Drome;
  private sampleBank: string = "RolandTR909";
  private notes: string[] = ["bd", "bd", "bd", "bd"];

  constructor(drome: Drome, destination: DromeAudioNode) {
    super(drome.ctx, destination);
    this.drome = drome;
  }

  async start() {
    const startTime = this.drome.beatStartTime + 0.01;
    const duration = this.drome.barDuration;
    const offset = duration / this.notes.length;
    const baseUrl = drumMachines._base;

    this.notes.forEach(async (note, i) => {
      // TODO: FIX THIS
      const sampleSlugs = (drumMachines as unknown as Record<string, string[]>)[
        `${this.sampleBank}_${note}`
      ] as string[];
      const sampleSlug = sampleSlugs[3 % sampleSlugs.length];
      const sampleUrl = `${baseUrl}${sampleSlug}`;

      let buffer =
        this.drome.sampleBuffers.get(sampleUrl) ??
        (await this.loadSample(sampleUrl));

      if (!buffer) {
        console.error(`[DromeSample]: couldn't load sample from ${sampleUrl}`);
        return;
      }

      this.drome.sampleBuffers.set(sampleUrl, buffer);
      this.play(buffer, startTime + offset * i, duration);
    });
  }
}

export default DromeSample;
