interface ADSREnvelope {
  a: number;
  d: number;
  s: number;
  r: number;
}

interface OptionalOscillatorParameters {
  type: OscillatorType;
  adsr: ADSREnvelope;
  gain: number;
}

interface OscillatorParameters extends Partial<OptionalOscillatorParameters> {
  ctx: AudioContext;
  frequency: number;
  time: number;
  duration: number;
}

const defaultAdsr = { a: 0.01, d: 0.05, s: 0, r: 0 };

class Oscillator {
  private ctx: AudioContext;
  private frequency: number;
  private type: OscillatorType;
  private startTime: number;
  private duration: number;
  private adsr: ADSREnvelope;
  private baseGain = 0.25;
  private gain: number;

  private oscNode: OscillatorNode;
  private gainNode: GainNode;

  constructor(params: OscillatorParameters) {
    this.ctx = params.ctx;
    this.frequency = params.frequency;
    this.startTime = params.time;
    this.duration = params.duration;
    this.type = params.type ?? "sine";
    this.gain = params.gain ?? 1;
    this.adsr = params.adsr ?? defaultAdsr;

    this.oscNode = this.ctx.createOscillator();
    this.oscNode.type = this.type;
    this.oscNode.frequency.setValueAtTime(this.frequency, this.startTime);

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, this.startTime);
  }

  private applyEnvelope() {
    const maxVolume = this.baseGain * (this.gain ?? 1);
    const sustainLevel = maxVolume * this.adsr.s;

    const attackEnd = this.startTime + this.adsr.a;
    const decayEnd = attackEnd + this.adsr.d;
    const sustainEnd = this.startTime + this.duration - this.adsr.r;
    const releaseEnd = this.startTime + this.duration;

    this.gainNode.gain.setValueAtTime(0, this.startTime);
    // Attack
    this.gainNode.gain.linearRampToValueAtTime(maxVolume, attackEnd);
    // Decay
    this.gainNode.gain.linearRampToValueAtTime(sustainLevel, decayEnd);
    // Sustain
    this.gainNode.gain.setValueAtTime(sustainLevel, sustainEnd);
    // Release
    this.gainNode.gain.linearRampToValueAtTime(0, releaseEnd);
  }

  play() {
    this.applyEnvelope();

    this.oscNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.oscNode.start(this.startTime);
    this.oscNode.stop(this.startTime + this.duration + 0.1);

    this.oscNode.onended = () => {
      this.oscNode.disconnect();
      this.gainNode.disconnect();
    };
  }
}

export default Oscillator;
