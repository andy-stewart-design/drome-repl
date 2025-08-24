import DromeInstrument from "./drome-instrument";
import DromeBuffer from "./drome-buffer";
import type { DromeAudioNode } from "../types";

const sampleUrl =
  "https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/RolandTR909/rolandtr909-bd/Bassdrum-04.wav";

class DromeSample extends DromeInstrument {
  private buffer: AudioBuffer | undefined;
  private sources: Set<DromeBuffer> = new Set();
  private _playbackRate = 1;

  constructor(ctx: AudioContext, destination: DromeAudioNode) {
    super(ctx, destination);
  }

  async loadSample() {
    try {
      const response = await fetch(sampleUrl);
      const arrayBuffer = await response.arrayBuffer();
      this.buffer = await this.ctx.decodeAudioData(arrayBuffer);

      return this.buffer;
    } catch (error) {
      console.error("Error loading or playing sample:", error);
    }
  }

  rate(n: number) {
    this._playbackRate = n;
    return this;
  }

  async play() {
    const buffer = this.buffer ?? (await this.loadSample());
    if (!buffer) return;

    const startTime = this.ctx.currentTime + 0.01;
    const duration = buffer.duration;
    const destination = super._play(startTime, duration);

    const source = new DromeBuffer(this.ctx, destination.input, buffer, {
      rate: this._playbackRate,
      gain: this._gain,
      env: this._env,
    });

    source.play(startTime, duration);
    this.sources.add(source);
    source.node.onended = () => this.sources.delete(source);
  }
}

export default DromeSample;
