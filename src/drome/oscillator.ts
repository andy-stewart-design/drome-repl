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

type OscillatorEventType = "ended" | "destroy";

const defaultEnv = { a: 0.01, d: 0.01, s: 1.0, r: 0.1 };

class Oscillator {
  private ctx: AudioContext;
  private frequency: number;
  private startTime: number;
  private duration: number;
  private baseGain = 0.2;
  private gain: GainParams;
  private filters: Map<FilterType, FilterParamsWithNode> = new Map();
  private listeners: Map<OscillatorEventType, (() => void)[]> = new Map();

  private oscNode: OscillatorNode;
  private gainNode: GainNode;

  constructor(params: OscillatorParameters) {
    this.ctx = params.ctx;
    this.frequency = params.frequency;
    this.startTime = params.startTime + 0.01;
    this.gain = {
      value: params.gain?.value ?? 1,
      env: params.gain?.env ?? defaultEnv,
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
      this.listeners.get("ended")?.forEach((cb) => cb());
      this.destroy();
    };
  }

  private applyEnvelope(
    target: AudioParam,
    startVal: number,
    maxVal: number,
    env: Partial<ADSRParams>
  ) {
    const adsr = { ...defaultEnv, ...env };
    const sustainLevel = maxVal * adsr.s;
    const minDuration = adsr.a + adsr.d + adsr.r;
    const scale = this.duration < minDuration ? this.duration / minDuration : 1;

    const attackEnd = this.startTime + adsr.a * scale;
    const decayEnd = attackEnd + adsr.d * scale;
    const sustainEnd = this.startTime + this.duration - adsr.r * scale;
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
        filter.env ?? defaultEnv
      );
    });
  }

  public start() {
    this.applyGain();
    this.applyFilter();
    this.oscNode.start(this.startTime);
    this.oscNode.stop(this.startTime + this.duration);
  }

  public stop(when?: number) {
    // if (!this.isPlaying || this.isStopped) return; // Todo: do I need this???
    const stopTime = when ?? this.ctx.currentTime;
    const releaseTime = 0.25;

    if (this.startTime > this.ctx.currentTime) {
      this.oscNode.stop();
    } else {
      // Cancel any scheduled value changes after the stop time
      this.gainNode.gain.cancelScheduledValues(stopTime);

      // Apply a quick release envelope to avoid clicks
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, stopTime);
      this.gainNode.gain.linearRampToValueAtTime(0, stopTime + releaseTime);

      // Stop the oscillator after the release
      this.oscNode.stop(stopTime + releaseTime);
    }
  }

  public on(eventType: OscillatorEventType, listener: () => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(listener);
  }

  public off(eventType: OscillatorEventType, listener: () => void) {
    const arr = this.listeners.get(eventType);
    if (!arr) return;
    const idx = arr.indexOf(listener);
    if (idx !== -1) arr.splice(idx, 1);
  }

  public destroy() {
    this.oscNode.disconnect();
    this.gainNode.disconnect();
    this.filters.forEach((f) => f.node.disconnect());
    this.listeners.get("destroy")?.forEach((cb) => cb());
    this.listeners.clear();
    this.filters.clear();
  }

  get type() {
    return this.oscNode.type;
  }
}

export default Oscillator;
