import type { DromeAudioNode } from "../types";
import { applyEnvelope } from "../utils/adsr";
import DromeInstrument from "./drome-instrument";

const sampleUrl =
  "https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/RolandTR909/rolandtr909-bd/Bassdrum-04.wav";

class DromeSample extends DromeInstrument {
  private buffer: AudioBuffer | undefined;
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

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = this._gain;

    applyEnvelope({
      target: gainNode.gain,
      startTime,
      duration,
      maxVal: this._gain,
      startVal: 0,
      env: this._env,
    });

    const source = new AudioBufferSourceNode(this.ctx, {
      playbackRate: this._playbackRate,
    });
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(destination.input);

    source.start(startTime);
    source.stop(startTime + duration + 0.1);
  }
}

export default DromeSample;
