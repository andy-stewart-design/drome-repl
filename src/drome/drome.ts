import AudioClock from "./audio-clock";
import DromeArray from "./drome-array";
import Sample from "./sample";
import Synth, { synthAliasMap } from "./synth";
import { loadSamples } from "./utils/sample-helpers";
import type { SampleName, SynthAlias } from "./types";

class Drome extends AudioClock {
  private instruments: Set<Synth | Sample> = new Set();
  readonly sampleBuffers = new Map<string, AudioBuffer>();

  constructor(bpm = 120) {
    super(bpm);
    this.on("bar", this.handleTick.bind(this));
  }

  private handleTick() {
    this.instruments.forEach((inst) => inst.play(this.barStartTime));
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

  public stop() {
    super.stop();
    this.instruments.forEach((inst) => inst instanceof Synth && inst.stop());
  }

  public addInstrument(inst: Synth | Sample) {
    this.instruments.add(inst);
  }

  public clearInstruments() {
    this.instruments.clear();
  }

  public synth(type: SynthAlias = "sine") {
    return new Synth(this, synthAliasMap[type]);
  }

  public sample(name: SampleName = "bd", index = 0) {
    return new Sample(this, name, index);
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
    this.instruments.clear();
  }
}

export default Drome;
