import { createSignal, onMount } from "solid-js";
import MainGain from "./drome-2/core/main-gain";
import PulseOscillator from "./drome-2/instruments/pulse-oscillator";
import FilterEffect from "./drome-2/effects/filter";
import DelayEffect from "./drome-2/effects/delay";
import ReverbEffect from "./drome-2/effects/reverb";

export default function TestDemo() {
  const [ctx, setCtx] = createSignal<AudioContext | null>(null);
  const [filter, setFilter] = createSignal<FilterEffect | null>(null);

  onMount(() => {
    const ctx = new AudioContext();
    const master = new MainGain(ctx, 0.5);
    const filter = new FilterEffect(ctx, { type: "lowpass", frequency: 600 });
    const delay = new DelayEffect(ctx, {
      delayTime: 0.3,
      feedback: 0.2,
      mix: 0.2,
    });
    const reverb = new ReverbEffect(ctx, { duration: 2, decay: 2, mix: 0.4 });

    filter.connect(reverb.input);
    reverb.connect(delay.input);
    delay.connect(master.input);
    master.connect(ctx.destination);

    setCtx(ctx);
    setFilter(filter);
  });

  function handlePlay() {
    const _ctx = ctx();
    const _filter = filter();
    if (!_ctx || !_filter) return;
    const pulse = new PulseOscillator(_ctx, { frequency: 220 });

    if (_ctx.state === "suspended") _ctx.resume();
    pulse.trigger(_filter.input);
  }

  return <button onClick={handlePlay}>Play</button>;
}
