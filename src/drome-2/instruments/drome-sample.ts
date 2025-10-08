import DromeInstrument from "./drome-instrument";
import DromeAudioSource from "./drome-audio-source";
import FilterEffect from "../effects/filter";
import { getSampleUrl } from "../utils/get-sample";
import type Drome from "../core/drome";
import type {
  DromeAudioNode,
  SampleBank,
  SampleName,
  SampleNote,
} from "../types";
import type { DromeCycleValue } from "../core/drome-array";

class DromeSample extends DromeInstrument<number> {
  private sampleNames: SampleName[];
  private sampleBank: SampleBank = "tr909";
  private sources: Set<DromeAudioSource> = new Set();
  private _playbackRate = 1;
  private _fitValue: number | undefined;
  private _chopPoints: number[] | undefined;

  public play: () => this;

  constructor(drome: Drome, dest: DromeAudioNode[], ...names: SampleNote[]) {
    super(drome, dest, [[1]]);
    if (names.length) this.sampleNames = names;
    else this.sampleNames = ["bd"];
    this._channelIndex = 1;
    this.play = this.push.bind(this);
  }

  private getPlaybackParams(buffer: AudioBuffer) {
    const rate = this._fitValue
      ? buffer.duration / this.drome.barDuration / this._fitValue
      : this._playbackRate;

    const startIndex = this._chopPoints
      ? this.drome.metronome.bar % this._chopPoints.length
      : 0;
    const startPoint = this._chopPoints ? this._chopPoints[startIndex] : 0;
    const start = buffer.duration * startPoint;

    const duration = this._fitValue
      ? buffer.duration * (1 / this._fitValue)
      : buffer.duration;

    return { start, rate, duration };
  }

  push() {
    if (!this.drome.paused) this.preloadSamples();
    this.drome.push(this);
    return this;
  }

  async loadSample(note: SampleNote) {
    const [sampleName, _index] = note.split(":");
    const sampleUrl = getSampleUrl(this.sampleBank, sampleName, _index);
    if (!sampleUrl) {
      console.warn(`Couldn't find a sample: ${this.sampleBank} ${sampleName}`);
      return [undefined, undefined] as const;
    }

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
      if (!buffer || !sampleUrl) return;

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

  fit(numBars = 1) {
    this._fitValue = numBars;
    this._chopPoints = Array.from({ length: numBars }, (_, i) => i / numBars);
    return this;
  }

  begin(pos: number | number[]) {
    this._chopPoints = Array.isArray(pos) ? pos : [pos];
    return this;
  }

  // chop(numChops: number, sequence: number[]) {}

  start() {
    const nodes = super.connectChain();
    const cycles = this.cycles.value;
    const cycleIndex = this.drome.metronome.bar % cycles.length;
    const cycle = cycles[cycleIndex];
    const startTime = this.drome.barStartTime;
    const noteDuration = this.drome.barDuration / cycle.length;

    const play = async (note: DromeCycleValue<number>, i: number) => {
      if (!note) return;
      this.sampleNames.forEach(async (name) => {
        let [buffer] = await this.loadSample(name);
        if (!buffer) return;

        const time = startTime + noteDuration * i;
        const source = new DromeAudioSource(this.drome.ctx, nodes[0].input, {
          type: "buffer",
          buffer,
          gain: this.getCurrentGain(cycleIndex, i),
          env: this._env,
          filters: this._filters,
          pan: this.getCurrentPan(cycleIndex, i),
          ...this.getPlaybackParams(buffer),
        });

        this.applyVibrato(source);

        nodes.forEach((node) => {
          if (!(node instanceof FilterEffect)) return;
          node.apply(time, noteDuration);
        });

        source.play(time, noteDuration);
        this.sources.add(source);
        source.node.onended = () => this.sources.delete(source);
      });
    };

    cycle.forEach(async (pat, i) => {
      if (pat) play(pat, i);
    });
  }

  stop() {
    this.sources.forEach((src) => src.stop());
  }
}

export default DromeSample;
