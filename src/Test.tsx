import { createSignal, onMount } from "solid-js";
import MasterGain from "./drome-2/core/master-gain";
import Synth from "./drome-2/instruments/synth";

export default function TestDemo() {
  const [ctx, setCtx] = createSignal<AudioContext | null>(null);
  const [synth, setSynth] = createSignal<Synth | null>(null);

  onMount(() => {
    const ctx = new AudioContext();
    const master = new MasterGain(ctx, 0.5);
    const synth = new Synth(ctx, master, "square").lpf(300).reverb().delay();

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

  return <button onClick={handlePlay}>Play</button>;
}
