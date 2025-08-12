import type Drome from "@/drome";
import DromeArray from "./drome-array";
import { euclid } from "./utils/euclid";
import { hex } from "./utils/hex";
import { loadSample, playSample, makeSampleId } from "./utils/sample-helpers";
import type { SampleName, SampleBank, SampleId } from "./types";

type Foo = SampleName | `${SampleName}:${number}`;

class Sample {
  private drome: Drome;
  public sampleMap: Partial<Record<SampleName, number>> = {};
  private sounds: (SampleName | "")[];
  private soundOffsets: number | number[] = 0;
  private _bank: SampleBank;
  private _gain = 1;

  constructor(
    drome: Drome,
    name: SampleName = "bd",
    index = 0,
    bank: SampleBank = "RolandTR909"
  ) {
    this.drome = drome;
    this.sampleMap[name] = index;
    this.sounds = [name];
    this._bank = bank;
  }

  public push() {
    this.drome.addInstrument(this);
    return this;
  }

  public bank(bank: SampleBank) {
    this._bank = bank;
    return this;
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

    const bufferPromises = sounds.map(async (name) => {
      if (name === "") return null;
      const index = this.sampleMap[name] ?? 0;
      const id: SampleId = makeSampleId(this._bank, name, index);

      if (drome.sampleBuffers.has(id)) return drome.sampleBuffers.get(id)!;

      const arrayBuffer = await loadSample(name, this._bank, index);
      if (!arrayBuffer) return null;

      const audioBuffer = await drome.ctx.decodeAudioData(arrayBuffer);
      drome.sampleBuffers.set(id, audioBuffer);
      return audioBuffer;
    });

    Promise.all(bufferPromises).then((buffers) => {
      buffers.forEach((buffer, i) => {
        if (!buffer) return;
        const offset = Array.isArray(soundOffsets)
          ? soundOffsets[i]
          : soundOffsets;
        const t = time + offset * i;
        playSample({ ctx: drome.ctx, time: t, buffer, gain: this._gain });
      });
    });
  }

  public destroy() {}

  get sampleBank() {
    return this._bank;
  }
}

export default Sample;
