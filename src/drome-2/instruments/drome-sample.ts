import DromeInstrument from "./drome-instrument";
import _drumMachines from "../dictionaries/samples/drum-machines.json";
import DromeAudioSource from "./drome-audio-source";
import FilterEffect from "../effects/filter";
import { drumAliases as _drumAliases } from "../dictionaries/samples/drum-alias";
import type Drome from "../core/drome";
import type {
  DromeCycleValue,
  DromeAudioNode,
  SampleBank,
  SampleName,
  SampleNote,
} from "../types";

const drumMachines: Record<string, string | string[]> = _drumMachines;
const drumAliases: Record<string, string> = _drumAliases;

class DromeSample extends DromeInstrument {
  private sampleNames: SampleName[];
  private sampleBank: SampleBank = "rolandtr909";
  private sources: Set<DromeAudioSource> = new Set();
  private _playbackRate = 1;

  constructor(drome: Drome, dest: DromeAudioNode, ...names: SampleNote[]) {
    super(drome, dest, "sample");
    if (names.length) this.sampleNames = names;
    else this.sampleNames = ["bd"];
  }

  push() {
    if (!this.drome.paused) this.preloadSamples();
    this.drome.push(this);
    return this;
  }

  async loadSample(note: SampleNote) {
    const baseUrl = drumMachines._base;
    const [sampleName, _index] = note.split(":");
    const index = parseInt(_index) || 0;
    const bankName = drumAliases[this.sampleBank.toLocaleLowerCase()];

    const sampleSlugs = drumMachines[`${bankName}_${sampleName}`];
    const sampleSlug = sampleSlugs[index % sampleSlugs.length];
    const sampleUrl = `${baseUrl}${sampleSlug}`;

    if (this.drome.sampleBuffers.has(sampleUrl)) {
      const audioBuffer = this.drome.sampleBuffers.get(sampleUrl)!;
      return [audioBuffer, sampleUrl] as const;
    }

    try {
      const response = await fetch(sampleUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.drome.ctx.decodeAudioData(arrayBuffer);
      this.drome.sampleBuffers.set(sampleUrl, audioBuffer);
      return [audioBuffer, sampleUrl] as const;
    } catch (error) {
      console.error(`[DromeSample]: couldn't load sample from ${sampleUrl}`);
    } finally {
      return [undefined, sampleUrl] as const;
    }
  }

  preloadSamples() {
    return this.sampleNames.map(async (name) => {
      let [buffer, sampleUrl] = await this.loadSample(name);
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

  start() {
    const nodes = super.connectChain();
    const cycleIndex = this.drome.metronome.bar % this.cycles.value.length;
    const cycle = this.cycles.value[cycleIndex];
    const startTime = this.drome.barStartTime;
    const noteDuration = this.drome.barDuration / cycle.length;

    const play = async (note: DromeCycleValue, i: number) => {
      if (!note) return;
      this.sampleNames.forEach(async (name) => {
        let [buffer] = await this.loadSample(name);
        if (!buffer) return;

        const source = new DromeAudioSource(this.drome.ctx, nodes[0].input, {
          type: "buffer",
          buffer,
          rate: this._playbackRate,
          gain: this.getCurrentGain(cycleIndex, i),
          env: this._env,
          filters: this._filters,
          pan: this.getCurrentPan(cycleIndex, i),
        });

        nodes.forEach((node) => {
          if (!(node instanceof FilterEffect)) return;
          node.apply(startTime + noteDuration * i, noteDuration);
        });

        source.play(startTime + noteDuration * i, noteDuration);
        this.sources.add(source);
        source.node.onended = () => this.sources.delete(source);
      });
    };

    cycle.forEach(async (pat, i) => {
      if (!pat) return;
      else if (Array.isArray(pat)) pat.forEach((el) => play(el, i));
      else play(pat, i);
    });
  }

  stop() {
    this.sources.forEach((src) => src.stop());
  }
}

export default DromeSample;
