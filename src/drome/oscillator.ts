interface ADSREnvelope {
  a: number;
  d: number;
  s: number;
  r: number;
}

interface GainParams {
  value: number;
  env: ADSREnvelope;
}

interface FilterParams {
  type: BiquadFilterType;
  value: number;
  env?: ADSREnvelope;
}

interface OptionalOscillatorParameters {
  type: OscillatorType;
  gain: Partial<GainParams>;
  filter: FilterParams;
}

interface OscillatorParameters extends Partial<OptionalOscillatorParameters> {
  ctx: AudioContext;
  frequency: number;
  time: number;
  duration: number;
}

const defaultAdsr = { a: 0.01, d: 0.125, s: 0, r: 0.01 };

class Oscillator {
  private ctx: AudioContext;
  private frequency: number;
  private startTime: number;
  private duration: number;
  private baseGain = 0.25;
  private gain: GainParams;
  private filter: FilterParams | undefined;

  private oscNode: OscillatorNode;
  private gainNode: GainNode;
  private filterNode: BiquadFilterNode | undefined;

  constructor(params: OscillatorParameters) {
    this.ctx = params.ctx;
    this.frequency = params.frequency;
    this.startTime = params.time;
    this.gain = {
      value: params.gain?.value ?? 1,
      env: params.gain?.env ?? defaultAdsr,
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
    this.gainNode.gain.setValueAtTime(0, this.startTime);

    if (this.filter) {
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = this.filter.type;
      this.filterNode.frequency.setValueAtTime(
        this.filter.value,
        this.startTime
      );
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
  }

  private applyEnvelope(target: AudioParam, maxVal: number, env: ADSREnvelope) {
    const sustainLevel = maxVal * env.s;
    const attackEnd = this.startTime + env.a;
    const decayEnd = attackEnd + env.d;
    const sustainEnd = this.startTime + this.duration - env.r;
    const releaseEnd = this.startTime + this.duration;

    target.setValueAtTime(0, this.startTime);
    target.linearRampToValueAtTime(maxVal, attackEnd); // Attack
    target.linearRampToValueAtTime(sustainLevel, decayEnd); // Decay
    target.setValueAtTime(sustainLevel, sustainEnd); // Sustain
    target.linearRampToValueAtTime(0, releaseEnd); // Release
  }

  private applyGain() {
    this.applyEnvelope(
      this.gainNode.gain,
      this.baseGain * this.gain.value,
      this.gain.env
    );
  }

  private applyFilter() {
    if (!this.filter || !this.filterNode) return;
    this.filterNode.type = this.filter.type;
    const adsr = this.filter.env ?? { a: 0.01, d: 0.01, s: 1, r: 0.05 };
    this.applyEnvelope(this.filterNode.frequency, this.filter.value, adsr);
  }

  play() {
    this.applyGain();
    this.applyFilter();

    this.oscNode.start(this.startTime);
    this.oscNode.stop(this.startTime + this.duration + 0.1);

    this.oscNode.onended = () => {
      this.oscNode.disconnect();
      this.gainNode.disconnect();
    };
  }

  get type() {
    return this.oscNode.type;
  }
}

export default Oscillator;
