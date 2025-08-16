import AudioClock from "./audio-clock";
import DromeArray from "./drome-array";
import Sample from "./sample";
import Synth, { synthAliasMap } from "./synth";
import { loadSamples } from "./utils/sample-helpers";
import type { SampleName, SynthAlias } from "./types";

class Drome extends AudioClock {
  private instruments: (Synth | Sample)[] = [];
  readonly sampleBuffers = new Map<string, AudioBuffer>();

  constructor(bpm = 120) {
    super(bpm);
    this.on("bar", this.handleTick.bind(this));
  }

  private handleTick() {
    this.instruments.forEach((inst) =>
      inst.play(this.barStartTime, this.metronome.bar)
    );
  }

  public async preloadSamples() {
    const promises: Promise<AudioBuffer | null>[] = [];

    for (const inst of this.instruments) {
      if (!(inst instanceof Sample)) continue;
      promises.push(...loadSamples(this, inst.sampleMap, inst.sampleBank));
    }

    await Promise.all(promises);
  }

  public async start() {
    if (!this.paused) return;
    await this.preloadSamples();
    super.start(); // will set up the scheduler after samples are loaded
  }

  public addInstrument(inst: Synth | Sample, replace = false) {
    if (replace) this.instruments = [inst];
    else this.instruments.push(inst);
  }

  public clearInstruments() {
    this.instruments.length = 0;
  }

  public synth(type: SynthAlias = "sine", harmonics?: number) {
    const synth = new Synth(this, synthAliasMap[type], harmonics);
    // this.addInstrument(synth);
    return synth;
  }

  public sample(name: SampleName = "bd", index = 0) {
    const sample = new Sample(this, name, index);
    // this.addInstrument(sample);
    return sample;
  }

  public stack(...intruments: (Synth | Sample)[]) {
    intruments.forEach((inst) => inst.push());
  }

  public euclid(pulses: number, steps: number, rotation = 0) {
    return new DromeArray().euclid(pulses, steps, rotation);
  }

  public range(start: number, end?: number, stepOrIncl: number | boolean = 1) {
    return new DromeArray().range(start, end, stepOrIncl);
  }

  public stretch(arr: number[], stretchFactor: number) {
    return new DromeArray(arr).stretch(stretchFactor);
  }

  public destroy() {
    super.destroy();
    this.instruments.forEach((inst) => inst.destroy());
    this.instruments = [];
  }
}

export default Drome;
