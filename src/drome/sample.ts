import type Drome from "@/drome";
import DromeArray from "./drome-array";
import { euclid } from "./utils/euclid";
import { hex } from "./utils/hex";
import { loadSamples, playSample, makeSampleId } from "./utils/sample-helpers";
import type { SampleName, SampleBank, SampleId } from "./types";

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
    const { drome, sounds, sampleMap, sampleBank, soundOffsets } = this;
    if (this.drome.metronome.bar && this.drome.metronome.bar > 0) {
      await Promise.all(loadSamples(drome, sampleMap, sampleBank));
    }

    for (const [i, name] of sounds.entries()) {
      if (name === "") continue;
      const index = this.sampleMap[name] ?? 0;
      const id: SampleId = makeSampleId(this._bank, name, index);
      const buffer = drome.sampleBuffers.get(id);
      if (!buffer) continue;
      const offset = Array.isArray(soundOffsets)
        ? soundOffsets[i]
        : soundOffsets;
      const t = time + offset * i;
      playSample({ ctx: drome.ctx, time: t, buffer, gain: this._gain });
    }
  }

  public destroy() {}

  get sampleBank() {
    return this._bank;
  }
}

export default Sample;
