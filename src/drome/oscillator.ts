interface ADSREnvelope {
  a: number;
  d: number;
  s: number;
  r: number;
}

interface FilterParams {
  type: BiquadFilterType;
  value: number;
  adsr?: ADSREnvelope;
}

interface OptionalOscillatorParameters {
  type: OscillatorType;
  adsr: ADSREnvelope;
  gain: number;
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
  private adsr: ADSREnvelope;
  private baseGain = 0.25;
  private gain: number;
  private filter: FilterParams | undefined;

  private oscNode: OscillatorNode;
  private gainNode: GainNode;
  private filterNode: BiquadFilterNode | undefined;

  constructor(params: OscillatorParameters) {
    this.ctx = params.ctx;
    this.frequency = params.frequency;
    this.startTime = params.time;
    this.duration = params.duration;
    this.gain = params.gain ?? 1;
    this.adsr = params.adsr ?? defaultAdsr;
    this.filter = params.filter;

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
      this.baseGain * this.gain,
      this.adsr
    );
  }

  private applyFilter() {
    if (!this.filter || !this.filterNode) return;
    this.filterNode.type = this.filter.type;
    const adsr = this.filter.adsr ?? { a: 0.01, d: 0.01, s: 1, r: 0.05 };
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
