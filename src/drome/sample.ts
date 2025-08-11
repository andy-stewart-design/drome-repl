import { euclid } from "./utils/euclid";
import {
  loadSample,
  playSample,
  makeSampleId,
  splitSampleId,
} from "./utils/sample-helpers";
import type Drome from "@/drome";
import type { SampleName, SampleBank } from "./types";
import { hex } from "./utils/hex";
import DromeArray from "./drome-array";

type SampleId = `${SampleBank}-${SampleName}-${number}`;

class Sample {
  private drome: Drome;
  private sounds: (SampleId | "")[];
  private soundOffsets: number | number[] = 0;
  private _gain = 1;

  constructor(
    drome: Drome,
    name: SampleName = "bd",
    index = 0,
    bank: SampleBank = "RolandTR909"
  ) {
    this.drome = drome;
    const id: SampleId = makeSampleId(bank, name, index);
    this.sounds = [id];
  }

  public gain(n: number) {
    this._gain = n;
    return this;
  }

  public fast(multiplier: number) {
    const newLength = Math.floor(this.sounds.length * multiplier);
    this.sounds = Array.from(
      { length: newLength },
      (_, i) => this.sounds[i % this.sounds.length]
    );
    this.soundOffsets = this.drome.duration / this.sounds.length;
    return this;
  }

  public euclid(pulses: number, steps: number, rotation = 0) {
    const pattern = euclid(pulses, steps, rotation);
    this.soundOffsets = this.drome.duration / steps;

    let noteIndex = 0;
    this.sounds = pattern.map((p) => {
      return p === 0 ? "" : this.sounds[noteIndex++ % this.sounds.length];
    });

    return this;
  }

  public hex(hexNotation: string | number) {
    const pattern = hex(hexNotation);
    this.soundOffsets = this.drome.duration / pattern.length;
    let noteIndex = 0;
    this.sounds = pattern.map((p) => {
      return p === 0 ? "" : this.sounds[noteIndex++ % this.sounds.length];
    });
    return this;
  }

  public struct(pattern: number[] | DromeArray) {
    const pat = pattern instanceof DromeArray ? pattern.value : pattern;
    this.soundOffsets = this.drome.duration / pat.length;
    let noteIndex = 0;
    this.sounds = pat.map((p) => {
      return p === 0 ? "" : this.sounds[noteIndex++ % this.sounds.length];
    });
    return this;
  }

  public async play(time: number) {
    const { drome, sounds, soundOffsets } = this;

    const foo = [...new Set(sounds)].map(async (id) => {
      if (id === "") return;
      const bar = drome.sampleBuffers.get(id);
      if (bar) return bar;

      const [bank, name, index] = splitSampleId(id);
      const arrayBuffer = await loadSample(name, bank, index);
      if (!arrayBuffer) return; // TODO: error handling
      const audioBuffer = await drome.ctx.decodeAudioData(arrayBuffer);
      drome.sampleBuffers.set(id, audioBuffer);
      return audioBuffer;
    });

    await Promise.all(foo);

    sounds.forEach((id, i) => {
      const buffer = drome.sampleBuffers.get(id);
      if (id === "" || !buffer) return;
      const offset = Array.isArray(soundOffsets)
        ? soundOffsets[i]
        : soundOffsets;
      const t = time + offset * i;
      playSample({ ctx: drome.ctx, time: t, buffer, gain: this._gain });
    });
  }

  public destroy() {}
}

export default Sample;
