import DromeInstrument from "./drome-instrument";
import DromeBuffer from "./drome-buffer";
import drumMachines from "../dictionaries/samples/drum-machines.json";
import FilterEffect from "../effects/filter";
import type Drome from "../core/drome";
import type { DromeAudioNode, SampleBank, SampleNote } from "../types";

class DromeSample extends DromeInstrument {
  private drome: Drome;
  readonly notes: SampleNote[] = [];
  private sampleBank: SampleBank = "RolandTR909";
  private sources: Set<DromeBuffer> = new Set();
  private _playbackRate = 1;

  constructor(drome: Drome, destination: DromeAudioNode) {
    super(drome.ctx, destination);
    this.drome = drome;
  }

  async loadSample(note: SampleNote) {
    const baseUrl = drumMachines._base;
    const [name, _index] = note.split(":");
    const index = parseInt(_index) || 0;
    // TODO: FIX THIS
    const sampleSlugs = (drumMachines as unknown as Record<string, string[]>)[
      `${this.sampleBank}_${name}`
    ] as string[];
    const sampleSlug = sampleSlugs[index % sampleSlugs.length];
    const sampleUrl = `${baseUrl}${sampleSlug}`;

    if (this.drome.sampleBuffers.has(sampleUrl)) {
      const audioBuffer = this.drome.sampleBuffers.get(sampleUrl)!;
      return [audioBuffer, sampleUrl] as const;
    }

    try {
      const response = await fetch(sampleUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.drome.sampleBuffers.set(sampleUrl, audioBuffer);
      return [audioBuffer, sampleUrl] as const;
    } catch (error) {
      console.error(`[DromeSample]: couldn't load sample from ${sampleUrl}`);
    } finally {
      return [undefined, sampleUrl] as const;
    }
  }

  preloadSamples() {
    const notes = [...new Set(this.notes)].filter(Boolean);
    return notes.map(async (note) => {
      let [buffer, sampleUrl] = await this.loadSample(note);
      if (!buffer) return;

      this.drome.sampleBuffers.set(sampleUrl, buffer);
      return [sampleUrl, buffer] as const;
    });
  }

  bank(bank: SampleBank) {
    this.sampleBank = bank;
    return this;
  }

  rate(n: number) {
    this._playbackRate = n;
    return this;
  }

  async start() {
    const nodes = super.connectChain();
    const startTime = this.drome.barStartTime;
    const noteDuration = this.drome.barDuration / this.notes.length;

    this.notes.forEach(async (note, i) => {
      let [buffer] = await this.loadSample(note);
      if (!buffer) return;

      const source = new DromeBuffer(this.ctx, nodes[0].input, buffer, {
        rate: this._playbackRate,
        gain: this._gain,
        env: this._env,
      });

      nodes.forEach((node) => {
        if (!(node instanceof FilterEffect)) return;
        node.apply(startTime + noteDuration * i, noteDuration);
      });
      source.play(startTime + noteDuration * i, noteDuration);
      this.sources.add(source);
      source.node.onended = () => this.sources.delete(source);
    });
  }

  stop() {
    this.sources.forEach((src) => src.stop());
  }
}

export default DromeSample;
