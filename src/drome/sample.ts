import { audioBuffer } from "@/drome/audio-buffer";
import { euclid } from "@/drome/utils/euclid";
import type Drome from "@/drome";

class Sample {
  private ctx: AudioContext;
  private sounds: string[];
  private soundIndexes: number[];
  private soundOffsets: number | number[] = 0;
  private duration: number;

  constructor(drome: Drome, name: string = "bd", index = 0) {
    this.ctx = drome.ctx;
    this.duration = drome.duration;
    this.sounds = [name];
    this.soundIndexes = [index];
  }

  public euclid(pulses: number, steps: number, rotation = 0) {
    const pattern = euclid(pulses, steps, rotation);
    this.soundOffsets = this.duration / steps;

    let noteIndex = 0;
    this.sounds = pattern.map((p) => {
      return p === 0 ? "" : this.sounds[noteIndex++ % this.sounds.length];
    });
    this.soundIndexes = pattern.map((p) => {
      return p === 0
        ? 0
        : this.soundIndexes[noteIndex++ % this.soundIndexes.length];
    });

    return this;
  }

  public play(time: number) {
    const { ctx, sounds, soundOffsets } = this;
    sounds.forEach((sound, i) => {
      if (sound === "") return;
      const offset = Array.isArray(soundOffsets)
        ? soundOffsets[i]
        : soundOffsets;
      const index = this.soundIndexes[i] ?? 0;
      const t = time + offset * i;
      audioBuffer({ ctx, name: sound, time: t, index });
    });
  }

  public destroy() {}
}

export default Sample;
