import { createSignal, onMount } from "solid-js";
import MasterGain from "./drome-2/core/master-gain";
import Synth from "./drome-2/instruments/synth";
import Sample from "./drome-2/instruments/sample";

export default function TestDemo() {
  const [ctx, setCtx] = createSignal<AudioContext | null>(null);
  const [synth, setSynth] = createSignal<Synth | null>(null);
  const [sample, setSample] = createSignal<Sample | null>(null);

  onMount(() => {
    const ctx = new AudioContext();
    const master = new MasterGain(ctx, 0.5);
    const synth = new Synth(ctx, master, "sawtooth")
      .lpf(300)
      .lpenv(2, 0.125, 0.125, 0.5, 0.5)
      .adsr(0.01, 0.333, 0.0, 0.5)
      .reverb(0.5)
      .delay(0.1);

    const sample = new Sample(ctx, master).reverb(0.1);
    // .adsr(0.001, 0.125, 0.0);
    // .reverb(0.2)
    // .delay(0.1)
    // .lpf(1600)

    setCtx(ctx);
    setSynth(synth);
    setSample(sample);
  });

  function handlePlay() {
    const _ctx = ctx();
    const _synth = synth();
    const _samp = sample();
    if (!_ctx || !_synth || !_samp) return;

    if (_ctx.state === "suspended") _ctx.resume();
    // _synth.play();
    _samp.play();
  }

  return (
    <button onMouseDown={handlePlay} onKeyDown={handlePlay}>
      Play
    </button>
  );
}
