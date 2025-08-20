import type {
  FilterParams,
  ADSRParams,
  GainParams,
  FilterType,
  OscType,
} from "./types";
import { clamp } from "./utils/math";

interface OptionalOscillatorParameters {
  type: OscType;
  gain: Partial<GainParams>;
  filters: Map<FilterType, FilterParams>;
  voices: number;
  detune: number;
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

const defaultEnv = { a: 0.01, d: 0.01, s: 1.0, r: 0.025 };

class Oscillator {
  private ctx: AudioContext;
  private frequency: number;
  private startTime: number;
  private duration: number;
  private totalDuration: number;
  private baseGain = 0.15;
  private gain: GainParams;
  private filters: Map<FilterType, FilterParamsWithNode> = new Map();
  private listeners: Map<OscillatorEventType, (() => void)[]> = new Map();

  private oscNodes: OscillatorNode[] = [];
  private gainNode: GainNode;

  constructor(params: OscillatorParameters) {
    this.ctx = params.ctx;
    this.frequency = params.frequency;
    this.startTime = params.startTime + 0.01;
    this.duration = params.duration;
    this.gain = {
      value: params.gain?.value ?? 1,
      env: params.gain?.env ?? { ...{ ...defaultEnv } },
    };
    const releaseTime = this.gain.env.r;
    this.totalDuration = this.duration + releaseTime;

    this.gainNode = this.ctx.createGain();

    const voices = params.type === "supersaw" ? params.voices ?? 7 : 1;
    const detune = params.detune ?? 12;

    for (let i = 0; i < voices; i++) {
      const osc = this.ctx.createOscillator();
      osc.type =
        params.type === "supersaw" ? "sawtooth" : params.type ?? "sine";
      osc.frequency.setValueAtTime(this.frequency, this.startTime);

      if (params.type === "supersaw") {
        const detuneAmount = (i / (voices - 1) - 0.5) * 2 * detune;
        osc.detune.setValueAtTime(detuneAmount, this.startTime);
      }

      this.oscNodes.push(osc);
    }

    params.filters?.forEach((filter) => {
      const node = this.ctx.createBiquadFilter();
      node.type = filter.type;
      node.Q.value = filter.q ?? 1;
      this.filters.set(filter.type, { ...filter, node });
    });

    const filterNodes = Array.from(this.filters.values(), (f) => f.node);

    for (const osc of this.oscNodes) {
      const nodes = [osc, ...filterNodes, this.gainNode, this.ctx.destination];
      for (let i = 0; i < nodes.length - 1; i++) {
        nodes[i].connect(nodes[i + 1]);
      }
    }

    this.oscNodes[0].onended = () => {
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
    const attDur = clamp(env.a || 0.01, 0.01, 0.98) * this.duration;
    const attEnd = this.startTime + attDur;
    const decDur = clamp(env.d || 0.01, 0.01, 0.98) * this.duration;
    const decEnd = attEnd + decDur;
    const susVal = maxVal * adsr.s;
    const susEnd = this.startTime + this.duration;
    const relDur = adsr.r * this.duration;
    const relEnd = susEnd + relDur;

    target.setValueAtTime(startVal, this.startTime);
    target.linearRampToValueAtTime(maxVal, attEnd); // Attack
    target.linearRampToValueAtTime(susVal, decEnd); // Decay
    target.setValueAtTime(susVal, susEnd); // Sustain
    target.linearRampToValueAtTime(0, relEnd); // Release
  }

  private applyGain() {
    this.applyEnvelope(
      this.gainNode.gain,
      0,
      (this.gain.value * this.baseGain) / Math.sqrt(this.oscNodes.length),
      this.gain.env
    );
  }

  private applyFilter() {
    this.filters.forEach((filter) => {
      this.applyEnvelope(
        filter.node.frequency,
        filter.value,
        filter.value * (filter.depth ?? 1),
        filter.env ?? { ...this.gain.env }
      );
    });
  }

  public start() {
    this.applyGain();
    this.applyFilter();
    this.oscNodes.forEach((osc) => {
      const jitter = this.oscNodes.length > 1 ? Math.random() * 0.002 : 0;
      osc.start(this.startTime + jitter);
      osc.stop(this.startTime + this.totalDuration);
    });
  }

  public stop(when?: number) {
    // if (!this.isPlaying || this.isStopped) return; // Todo: do I need this???
    const stopTime = when ?? this.ctx.currentTime;
    const releaseTime = 0.125;

    if (this.startTime > this.ctx.currentTime) {
      this.oscNodes.forEach((osc) => osc.stop());
    } else {
      // Cancel any scheduled value changes after the stop time
      this.gainNode.gain.cancelScheduledValues(stopTime);

      // Apply a quick release envelope to avoid clicks
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, stopTime);
      this.gainNode.gain.linearRampToValueAtTime(0, stopTime + releaseTime);

      // Stop the oscillator after the release
      this.oscNodes.forEach((osc) => osc.stop(stopTime + releaseTime));
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
    this.oscNodes.forEach((osc) => osc.disconnect());
    this.gainNode.disconnect();
    this.filters.forEach((f) => f.node.disconnect());
    this.listeners.get("destroy")?.forEach((cb) => cb());
    this.listeners.clear();
    this.filters.clear();
  }

  get type() {
    return this.oscNodes[0].type;
  }
}

export default Oscillator;
