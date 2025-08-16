import type { FilterParams, ADSRParams, GainParams, FilterType } from "./types";

interface OptionalOscillatorParameters {
  type: OscillatorType;
  gain: Partial<GainParams>;
  filters: Map<FilterType, FilterParams>;
}

interface OscillatorParameters extends Partial<OptionalOscillatorParameters> {
  ctx: AudioContext;
  frequency: number;
  startTime: number;
  duration: number;
}

interface FilterParamsWithNode extends FilterParams {
  node: BiquadFilterNode;
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
  private filters: Map<FilterType, FilterParamsWithNode> = new Map();

  private oscNode: OscillatorNode;
  private gainNode: GainNode;

  constructor(params: OscillatorParameters) {
    this.ctx = params.ctx;
    this.frequency = params.frequency;
    this.startTime = params.startTime + 0.01;
    this.gain = {
      value: params.gain?.value ?? 1,
      env: params.gain?.env ?? defaultGainEnv,
    };

    const gainEnvDuration = this.gain.env.a + this.gain.env.d + this.gain.env.r;
    const stopTime = Math.max(params.duration, gainEnvDuration);
    this.duration = stopTime;

    this.oscNode = this.ctx.createOscillator();
    this.oscNode.type = params.type ?? "sine";
    this.oscNode.frequency.setValueAtTime(this.frequency, this.startTime);

    this.gainNode = this.ctx.createGain();

    params.filters?.forEach((filter) => {
      const node = this.ctx.createBiquadFilter();
      node.type = filter.type;
      node.Q.value = filter.q ?? 1;
      this.filters.set(filter.type, { ...filter, node });
    });

    const nodes = [
      this.oscNode,
      ...Array.from(this.filters.values(), (f) => f.node),
      this.gainNode,
      this.ctx.destination,
    ].filter(Boolean) as AudioNode[];

    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].connect(nodes[i + 1]);
    }

    this.oscNode.onended = () => {
      this.oscNode.disconnect();
      this.gainNode.disconnect();
      this.filters.forEach((f) => f.node.disconnect());
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
    this.filters.forEach((filter) => {
      this.applyEnvelope(
        filter.node.frequency,
        filter.value,
        filter.value * (filter.depth ?? 1),
        filter.env ?? defaultFilterEnv
      );
    });
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
