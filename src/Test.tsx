import { createSignal, onMount } from "solid-js";
import PulseOscillator from "./drome-2/instruments/pulse-oscillator";
import FilterEffect from "./drome-2/effects/filter";
import DelayEffect from "./drome-2/effects/delay";
import ReverbEffect from "./drome-2/effects/reverb";
import MasterGain from "./drome-2/core/master-gain";

export default function TestDemo() {
  const [ctx, setCtx] = createSignal<AudioContext | null>(null);
  const [filter, setFilter] = createSignal<FilterEffect | null>(null);

  onMount(() => {
    const ctx = new AudioContext();
    const master = new MasterGain(ctx, 0.6);
    const filter = new FilterEffect(ctx, { type: "lowpass", frequency: 600 });
    const delay = new DelayEffect(ctx, {
      delayTime: 0.25,
      feedback: 0.3,
      mix: 0.3,
    });
    const reverb = new ReverbEffect(ctx, { duration: 1, decay: 1, mix: 0.5 });

    const nodes = [filter, reverb, delay, master];

    nodes.forEach((node, i) => {
      const nextInput = nodes[i + 1]?.input ?? ctx.destination;
      node.connect(nextInput);
    });

    setCtx(ctx);
    setFilter(filter);
  });

  function handlePlay() {
    const _ctx = ctx();
    const _filter = filter();
    if (!_ctx || !_filter) return;
    const pulse = new PulseOscillator(_ctx, { frequency: 130.81 });

    if (_ctx.state === "suspended") _ctx.resume();
    pulse.trigger(_filter.input);
  }

  return <button onClick={handlePlay}>Play</button>;
}
