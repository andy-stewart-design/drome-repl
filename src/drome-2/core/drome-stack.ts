import type DromeArray from "./drome-array";
import type DromeSample from "../instruments/drome-sample";
import type DromeSynth from "../instruments/drome-synth";

class DromeStack {
  private instruments: (DromeSynth | DromeSample)[];

  constructor(instruments: (DromeSynth | DromeSample)[]) {
    this.instruments = instruments;
  }

  adsr(a: number, d?: number, s?: number, r?: number) {
    this.instruments.forEach((inst) => inst.adsr(a, d, s, r));
    return this;
  }

  gain(...n: (number | number[])[] | [DromeArray<number>]) {
    this.instruments.forEach((inst) => inst.gain(...n));
    return this;
  }

  pan(...n: (number | number[])[] | [DromeArray<number>]) {
    this.instruments.forEach((inst) => inst.pan(...n));
    return this;
  }

  postgain(n: number) {
    this.instruments.forEach((inst) => inst.postgain(n));
    return this;
  }

  bpf(frequency: number) {
    this.instruments.forEach((inst) => inst.bpf(frequency));
    return this;
  }

  bpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this.instruments.forEach((inst) => inst.bpenv(depth, a, d, s, r));
    return this;
  }

  hpf(frequency: number) {
    this.instruments.forEach((inst) => inst.hpf(frequency));
    return this;
  }

  hpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this.instruments.forEach((inst) => inst.hpenv(depth, a, d, s, r));
    return this;
  }

  lpf(frequency: number) {
    this.instruments.forEach((inst) => inst.lpf(frequency));
    return this;
  }

  lpenv(depth: number, a?: number, d?: number, s?: number, r?: number) {
    this.instruments.forEach((inst) => inst.lpenv(depth, a, d, s, r));
    return this;
  }

  delay(feedback: number, delayTime?: number, mix?: number) {
    this.instruments.forEach((inst) => inst.delay(feedback, delayTime, mix));
    return this;
  }

  distort(amount: number, mix?: number, oversample?: OverSampleType) {
    this.instruments.forEach((inst) => inst.distort(amount, mix, oversample));
    return this;
  }

  reverb(mix: number, duration?: number) {
    this.instruments.forEach((inst) => inst.distort(mix, duration));
    return this;
  }

  achan(n: number) {
    this.instruments.forEach((inst) => inst.achan(n));
    return this;
  }

  push() {
    this.instruments.forEach((inst) => inst.push());
    return this;
  }
}

export default DromeStack;
