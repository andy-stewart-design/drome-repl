import { audioBuffer } from "@/drome/audio-buffer";
import { euclid } from "@/drome/utils/euclid";
import type Drome from "@/drome";

class Sample {
  private ctx: AudioContext;
  private sounds: string[];
  private soundOffsets: number | number[] = 0;
  private duration: number;

  constructor(drome: Drome, name: string = "bd") {
    this.ctx = drome.ctx;
    this.duration = drome.duration;
    this.sounds = [name];
  }

  public euclid(pulses: number, steps: number, rotation = 0) {
    const pattern = euclid(pulses, steps, rotation);
    this.soundOffsets = this.duration / steps;

    let noteIndex = 0;
    this.sounds = pattern.map((p) => {
      return p === 0 ? "" : this.sounds[noteIndex++ % this.sounds.length];
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
      const t = time + offset * i;
      audioBuffer({ ctx, name: sound, time: t });
    });
  }

  public destroy() {}
}

export default Sample;
