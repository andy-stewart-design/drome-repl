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
  depth?: number;
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
  startTime: number;
  duration: number;
}

const defaultAdsr = { a: 0.01, d: 0.125, s: 0.0, r: 0.1 };

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
    env: ADSREnvelope
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

  play() {
    this.applyGain();
    this.oscNode.start(this.startTime);
    this.oscNode.stop(this.startTime + this.duration);
  }

  //   private applyEnvelope(
  //     target: AudioParam,
  //     startVal: number,
  //     maxVal: number,
  //     env: ADSREnvelope
  //   ) {
  //     const MIN_ENV_TIME = 0.002; // 2 ms safety fade
  //     const a = Math.max(env.a, MIN_ENV_TIME);
  //     const d = Math.max(env.d, MIN_ENV_TIME);
  //     const r = Math.max(env.r, MIN_ENV_TIME);

  //     const sustainLevel = maxVal * env.s;
  //     const attackEnd = this.startTime + a;
  //     const decayEnd = attackEnd + d;
  //     const sustainEnd = this.startTime + this.duration - r;
  //     const releaseEnd = sustainEnd + r;

  //     // Ensure any prior schedules are cleared
  //     target.cancelScheduledValues(this.startTime);

  //     // Attack
  //     target.setValueAtTime(startVal, this.startTime);
  //     target.linearRampToValueAtTime(maxVal, attackEnd);

  //     // Decay
  //     target.linearRampToValueAtTime(sustainLevel, decayEnd);

  //     // Sustain
  //     target.setValueAtTime(sustainLevel, sustainEnd);

  //     // Release (fade to zero)
  //     target.linearRampToValueAtTime(0, releaseEnd);
  //   }

  //   private applyGain() {
  //     this.applyEnvelope(
  //       this.gainNode.gain,
  //       0,
  //       this.baseGain * this.gain.value,
  //       this.gain.env
  //     );
  //   }

  //   private applyFilter() {
  //     if (!this.filter || !this.filterNode) return;
  //     this.filterNode.type = this.filter.type;
  //     const env = this.filter.env ?? { a: 0.01, d: 0.01, s: 1, r: 0.05 };
  //     this.applyEnvelope(
  //       this.filterNode.frequency,
  //       this.filter.value,
  //       this.filter.value * (this.filter.depth ?? 2),
  //       env
  //     );
  //   }

  //   play(onComplete?: () => void) {
  //     this.applyGain();
  //     this.applyFilter();

  //     // Ensure the oscillator lasts through the release phase
  //     const totalEnvTime = Math.max(
  //       this.duration,
  //       this.gain.env.a + this.gain.env.d + this.gain.env.r,
  //       this.filter?.env
  //         ? this.filter.env.a + this.filter.env.d + this.filter.env.r
  //         : 0
  //     );

  //     const stopTime = this.startTime + totalEnvTime + 0.002; // micro fade cushion

  //     this.oscNode.start(this.startTime);
  //     this.oscNode.stop(stopTime);

  //     this.oscNode.onended = () => {
  //       this.oscNode.disconnect();
  //       this.gainNode.disconnect();
  //       if (this.filterNode) {
  //         this.filterNode.disconnect();
  //       }
  //       onComplete?.();
  //     };
  //   }

  get type() {
    return this.oscNode.type;
  }
}

export default Oscillator;
