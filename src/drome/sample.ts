import type Drome from "@/drome";
import DromeArray from "./drome-array";
import { euclid } from "./utils/euclid";
import { hex } from "./utils/hex";
import {
  loadSample,
  playSample,
  makeSampleId,
  splitSampleId,
} from "./utils/sample-helpers";
import type { SampleName, SampleBank, SampleId } from "./types";

type SoundSlot = { name: SampleName; index: number };

class Sample {
  private drome: Drome;
  private sounds: (SoundSlot | null)[];
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
    this.sounds = [{ name, index }];
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
      return p === 0 ? null : this.sounds[noteIndex++ % this.sounds.length];
    });

    return this;
  }

  public hex(hexNotation: string | number) {
    const pattern = hex(hexNotation);
    this.soundOffsets = this.drome.duration / pattern.length;
    let noteIndex = 0;
    this.sounds = pattern.map((p) => {
      return p === 0 ? null : this.sounds[noteIndex++ % this.sounds.length];
    });
    return this;
  }

  public struct(pattern: number[] | DromeArray) {
    const pat = pattern instanceof DromeArray ? pattern.value : pattern;
    this.soundOffsets = this.drome.duration / pat.length;
    let noteIndex = 0;
    this.sounds = pat.map((p) => {
      return p === 0 ? null : this.sounds[noteIndex++ % this.sounds.length];
    });
    return this;
  }

  public async play(time: number) {
    const { drome, sounds, soundOffsets } = this;

    const foo = [...new Set(sounds)].map(async (soundSlot) => {
      if (soundSlot === null) return;
      const { name, index } = soundSlot;
      const id: SampleId = makeSampleId(this._bank, name, index);

      const bar = drome.sampleBuffers.get(id);
      if (bar) return bar;

      const arrayBuffer = await loadSample(name, this._bank, index);
      if (!arrayBuffer) return; // TODO: error handling
      const audioBuffer = await drome.ctx.decodeAudioData(arrayBuffer);
      drome.sampleBuffers.set(id, audioBuffer);
      return audioBuffer;
    });

    await Promise.all(foo);

    sounds.forEach((soundSlot, i) => {
      if (soundSlot === null) return;
      const { name, index } = soundSlot;
      const id: SampleId = makeSampleId(this._bank, name, index);
      const buffer = drome.sampleBuffers.get(id);
      if (!buffer) return;
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
