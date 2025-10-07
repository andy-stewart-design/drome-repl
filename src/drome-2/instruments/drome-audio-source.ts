import FilterEffect from "../effects/filter";
import { applyEnvelope } from "../utils/adsr";
import type { ADSRParams, FilterOptions, FilterType, OscType } from "../types";

interface BaseAudioSourceOptions {
  gain: number;
  env: ADSRParams;
  filters: Map<FilterType, FilterOptions>;
  pan: number;
  panSpread?: number;
}

interface DromeOscillatorOptions extends BaseAudioSourceOptions {
  type: "oscillator";
  waveform: OscType;
  frequency: number;
}

interface DromeBufferOptions extends BaseAudioSourceOptions {
  type: "buffer";
  buffer: AudioBuffer;
  rate: number;
  start?: number;
}

interface LFO {
  osc: OscillatorNode;
  gain: GainNode;
}

type DromeAudioSourceOptions = DromeOscillatorOptions | DromeBufferOptions;

const startOffsets = [
  0.0037173433480637208, 0.0036399005414373565, 0.004805912343136861,
  0.008835915924177914, 0.0010848983101914178, 0.009249816039756987,
  0.008960220899601473, 0.0033275763528526417, 0.008992876217121193,
  0.0017311246659923974, 0.000011548745340322908, 0.006543725187045033,
  0.007157623846783098, 0.004417757250503166, 0.00696252757730683,
  0.0001743504746143354, 0.006431837170037681, 0.0020687575086174624,
  0.0057192790612300235, 0.0026010047087347875, 0.0006599113349611319,
  0.0007921460560189053, 0.008698528828336757, 0.007802407803619387,
  0.007860481516273603, 0.003387970143172543, 0.0033498809218984117,
  0.0019562771237912756,
];

class DromeAudioSource {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private baseGain: number;
  private gain: number;
  private srcNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private lfoNodes: LFO[] = [];
  private panNodes: StereoPannerNode[] = [];
  private env: ADSRParams;
  private startTime: number | undefined;
  private filters: Map<FilterType, FilterEffect> = new Map();

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    opts: DromeAudioSourceOptions
  ) {
    this.ctx = ctx;
    this.gainNode = new GainNode(this.ctx, { gain: 0 });
    this.gain = opts.gain;
    this.env = opts.env;
    this.baseGain = opts.type === "oscillator" ? 0.2 : 1;

    if (opts.type === "oscillator") {
      this.createOscillator(opts.waveform, opts.frequency);
    } else {
      this.createBuffer(opts);
    }

    const filterNodes: BiquadFilterNode[] = [];

    opts.filters?.forEach((fOpts) => {
      if (fOpts.env?.depth && !fOpts.env.adsr) fOpts.env.adsr = { ...opts.env };
      const effect = new FilterEffect(this.ctx, fOpts);
      this.filters.set(fOpts.type, effect);
      filterNodes.push(effect.input);
    });

    const spread = opts.panSpread ?? (isSuperSaw(opts) ? 0.5 : 0);
    const count = this.srcNodes.length;
    let panValue = opts.pan; // base (center)

    this.srcNodes.forEach((src, i) => {
      if (count > 1 && spread > 0) {
        const offset = (i / (count - 1) - 0.5) * 2 * spread; // offset across [-spread, +spread]
        panValue = Math.min(Math.max(opts.pan + offset, -1), 1); // cluster around opts.pan
      }

      const panNode = new StereoPannerNode(ctx, { pan: panValue });
      this.panNodes.push(panNode);

      const nodes = [src, panNode, this.gainNode, ...filterNodes, destination];
      for (let j = 0; j < nodes.length - 1; j++) {
        nodes[j].connect(nodes[j + 1]);
      }
    });
  }

  private createBuffer(opts: DromeBufferOptions) {
    const src = new AudioBufferSourceNode(this.ctx, {
      playbackRate: opts.rate,
      buffer: opts.buffer,
      loopStart: opts.start ?? 0,
    });
    this.srcNodes.push(src);
  }

  private createOscillator(type: OscType, frequency: number) {
    if (type !== "supersaw") {
      this.srcNodes.push(new OscillatorNode(this.ctx, { type, frequency }));
      this.srcNodes[0].addEventListener("ended", this.destroy.bind(this));
      return;
    }

    const voices = 7;
    const detune = 12; // in cents
    const oscType = "sawtooth";

    for (let i = 0; i < voices; i++) {
      const osc = new OscillatorNode(this.ctx, {
        type: oscType,
        frequency,
        detune: (i / (voices - 1) - 0.5) * 2 * detune,
      });

      // --- add independent slow LFO to detune ---
      const lfo = new OscillatorNode(this.ctx, {
        type: "sine",
        frequency: 0.1 + Math.random() * 0.3, // 0.1–0.4 Hz, very slow drift
      });

      const lfoGain = new GainNode(this.ctx, {
        gain: 2 + Math.random() * 3, // depth in cents (2–5 cents is enough)
      });

      lfo.connect(lfoGain).connect(osc.detune);
      lfo.start();

      osc.addEventListener("ended", this.destroy.bind(this));

      this.srcNodes.push(osc);
      this.lfoNodes.push({ osc: lfo, gain: lfoGain });
    }
  }

  private getDuration(duration: number) {
    const src = this.srcNodes[0];
    if (src instanceof OscillatorNode) return duration;
    else return Math.max(duration, src.buffer?.duration ?? 0);
  }

  play(startTime: number, duration: number, chordIndex = 0) {
    this.filters.forEach((filter) => {
      filter.apply(startTime, duration);
    });

    applyEnvelope({
      target: this.gainNode.gain,
      startTime,
      duration: this.getDuration(duration),
      maxVal: (this.gain * this.baseGain) / Math.sqrt(this.srcNodes.length),
      minVal: 0,
      startVal: 0.01,
      env: this.env,
    });

    this.srcNodes.forEach((node, noteIndex) => {
      const jitter =
        this.srcNodes.length > 1
          ? startOffsets[noteIndex + this.srcNodes.length * chordIndex]
          : 0;
      const offset = node instanceof AudioBufferSourceNode ? node.loopStart : 0;

      node.start(startTime + jitter, offset);
      const releaseTime = this.env.r * duration;
      node.stop(startTime + this.getDuration(duration) + releaseTime + 0.2);
    });

    this.startTime = startTime;
  }

  stop(when?: number) {
    if (!this.startTime) return;
    const stopTime = when ?? this.ctx.currentTime;
    const releaseTime = 0.125;

    if (this.startTime > this.ctx.currentTime) {
      this.srcNodes.forEach((osc) => osc.stop());
      this.lfoNodes.forEach((lfo) => lfo.osc.stop());
    } else {
      this.gainNode.gain.cancelScheduledValues(stopTime);

      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, stopTime);
      this.gainNode.gain.linearRampToValueAtTime(0, stopTime + releaseTime);

      this.srcNodes.forEach((osc) => osc.stop(stopTime + releaseTime));
      this.lfoNodes.forEach((lfo) => lfo.osc.stop(stopTime + releaseTime));
    }
  }

  destroy() {
    this.srcNodes.forEach((node) => {
      node.disconnect();
    });
    this.lfoNodes.forEach((node) => {
      node.osc.disconnect();
      node.gain.disconnect();
    });
    this.filters.forEach((filter) => {
      filter.disconnect();
    });
    this.panNodes.forEach((node) => {
      node.disconnect();
    });
    this.gainNode.disconnect();
    this.filters.clear();
    this.srcNodes.length = 0;
    this.lfoNodes.length = 0;
  }

  get node() {
    return this.srcNodes[0];
  }

  get nodes() {
    return this.srcNodes;
  }
}

export default DromeAudioSource;

function isSuperSaw(opts: DromeAudioSourceOptions) {
  return opts.type === "oscillator" && opts.waveform === "supersaw";
}
