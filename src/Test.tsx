import { createSignal, onMount } from "solid-js";
import DromeGain from "./drome-2/core/drome-gain";
import Synth from "./drome-2/instruments/synth";
import DromeSample from "./drome-2/instruments/drome-sample";

export default function TestDemo() {
  const [ctx, setCtx] = createSignal<AudioContext | null>(null);
  const [synth, setSynth] = createSignal<Synth | null>(null);
  const [sample, setSample] = createSignal<DromeSample | null>(null);

  onMount(() => {
    const ctx = new AudioContext();
    const master = new DromeGain(ctx, 0.5);
    const synth = new Synth(ctx, master, "sawtooth")
      .lpf(300)
      .lpenv(2, 0.125, 0.125, 0.5, 0.5)
      .adsr(0.01, 0.333, 0.0, 0.5)
      .reverb(0.5)
      .delay(0.1);

    const sample = new DromeSample(ctx, master)
      .reverb(0.1)
      // .distort(50, 1)
      // .postgain(0.75);
      // .adsr(0.001, 0.125, 0.0);
      .delay(0.1)
      .lpf(1600);

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
