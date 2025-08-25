import drumMachines from "../sample-dictionaries/drum-machines.json";
import type Drome from "../core/drome";
import type { DromeAudioNode } from "../types";
import DromeInstrument from "./drome-instrument";
import DromeBuffer from "./drome-buffer";

class DromeSample extends DromeInstrument {
  private drome: Drome;
  readonly notes: string[] = [];
  private sampleBank: string = "RolandTR909";
  private sources: Set<DromeBuffer> = new Set();
  private _playbackRate = 1;

  constructor(drome: Drome, destination: DromeAudioNode) {
    super(drome.ctx, destination);
    this.drome = drome;
  }

  async loadSample(sampleUrl: string) {
    try {
      const response = await fetch(sampleUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error("Error loading or playing sample:", error);
    }
  }

  rate(n: number) {
    this._playbackRate = n;
    return this;
  }

  async start() {
    const startTime = this.drome.barStartTime;
    const duration = this.drome.barDuration;
    const offset = duration / this.notes.length;
    const baseUrl = drumMachines._base;
    const destination = super._play(startTime, duration);

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

      const source = new DromeBuffer(this.ctx, destination.input, buffer, {
        rate: this._playbackRate,
        gain: this._gain,
        env: this._env,
      });

      //   this.play(buffer, startTime + offset * i, duration);
      source.play(startTime + offset * i, duration);
      this.sources.add(source);
      source.node.onended = () => this.sources.delete(source);
    });
  }

  stop() {
    this.sources.forEach((src) => src.stop());
  }
}

export default DromeSample;
