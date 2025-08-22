import { createSignal, onMount } from "solid-js";
import MasterGain from "./drome-2/core/master-gain";
import Synth from "./drome-2/instruments/synth";

export default function TestDemo() {
  const [ctx, setCtx] = createSignal<AudioContext | null>(null);
  const [synth, setSynth] = createSignal<Synth | null>(null);

  onMount(() => {
    const ctx = new AudioContext();
    const master = new MasterGain(ctx, 0.5);
    const synth = new Synth(ctx, master, "sawtooth")
      .lpf(300)
      .lpenv(2, 0.125, 0.125, 0.5, 0.5)
      .adsr(0.01, 0.333, 0.0, 0.5)
      .reverb(0.5)
      .delay(0.1);

    setCtx(ctx);
    setSynth(synth);
  });

  function handlePlay() {
    const _ctx = ctx();
    const _synth = synth();
    if (!_ctx || !_synth) return;

    if (_ctx.state === "suspended") _ctx.resume();
    _synth.play();
  }

  return (
    <button onMouseDown={handlePlay} onKeyDown={handlePlay}>
      Play
    </button>
  );
}
