import type { FilterParams, ADSRParams, GainParams } from "./types";

interface OptionalOscillatorParameters {
  type: OscillatorType;
  gain: Partial<GainParams>;
  filter: FilterParams;
}

interface OscillatorParameters extends Partial<OptionalOscillatorParameters> {
  ctx: AudioContext;
  frequency: number;
  startTime: number;
  duration: number;
}

const defaultGainEnv = { a: 0.01, d: 0.125, s: 0.0, r: 0.1 };
const defaultFilterEnv = { a: 0.01, d: 0.01, s: 1.0, r: 0.1 };

class Oscillator {
  private ctx: AudioContext;
  private frequency: number;
  private startTime: number;
  private duration: number;
  private baseGain = 0.2;
  private gain: GainParams;
  private filter: FilterParams | undefined;

  private oscNode: OscillatorNode;
  private gainNode: GainNode;
  private filterNode: BiquadFilterNode | undefined;

  constructor(params: OscillatorParameters) {
    this.ctx = params.ctx;
    this.frequency = params.frequency;
    this.startTime = params.startTime + 0.01;
    this.gain = {
      value: params.gain?.value ?? 1,
      env: params.gain?.env ?? defaultGainEnv,
    };
    this.filter = params.filter;

    const gainEnvDuration = this.gain.env.a + this.gain.env.d + this.gain.env.r;
    const filterEnvDuration =
      this.filter?.env &&
      this.filter.env.a + this.filter.env.d + this.filter.env.r;
    const stopTime = Math.max(
      params.duration,
      gainEnvDuration,
      filterEnvDuration ?? 0
    );
    this.duration = stopTime;

    this.oscNode = this.ctx.createOscillator();
    this.oscNode.type = params.type ?? "sine";
    this.oscNode.frequency.setValueAtTime(this.frequency, this.startTime);

    this.gainNode = this.ctx.createGain();

    if (this.filter) {
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = this.filter.type;
      this.filterNode.Q.value = this.filter.q ?? 1;
    }

    const nodes = [
      this.oscNode,
      this.filterNode,
      this.gainNode,
      this.ctx.destination,
    ].filter(Boolean) as AudioNode[];

    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].connect(nodes[i + 1]);
    }

    this.oscNode.onended = () => {
      this.oscNode.disconnect();
      this.gainNode.disconnect();
      if (this.filterNode) this.filterNode.disconnect();
    };
  }

  private applyEnvelope(
    target: AudioParam,
    startVal: number,
    maxVal: number,
    env: ADSRParams
  ) {
    const sustainLevel = maxVal * env.s;
    const minDuration = env.a + env.d + env.r;
    const scale = this.duration < minDuration ? this.duration / minDuration : 1;

    const attackEnd = this.startTime + env.a * scale;
    const decayEnd = attackEnd + env.d * scale;
    const sustainEnd = this.startTime + this.duration - env.r * scale;
    const releaseEnd = this.startTime + this.duration;

    target.setValueAtTime(startVal, this.startTime);
    target.linearRampToValueAtTime(maxVal, attackEnd); // Attack
    target.linearRampToValueAtTime(sustainLevel, decayEnd); // Decay
    target.setValueAtTime(sustainLevel, sustainEnd); // Sustain
    target.linearRampToValueAtTime(0, releaseEnd); // Release
  }

  private applyGain() {
    this.applyEnvelope(
      this.gainNode.gain,
      0,
      this.gain.value * this.baseGain,
      this.gain.env
    );
  }

  private applyFilter() {
    if (!this.filter || !this.filterNode) return;
    this.applyEnvelope(
      this.filterNode.frequency,
      this.filter.value,
      this.filter.value * (this.filter.depth ?? 1),
      this.filter.env ?? defaultFilterEnv
    );
  }

  play() {
    this.applyGain();
    this.applyFilter();
    this.oscNode.start(this.startTime);
    this.oscNode.stop(this.startTime + this.duration);
  }

  get type() {
    return this.oscNode.type;
  }
}

export default Oscillator;
