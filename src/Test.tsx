import { createSignal, onCleanup, onMount } from "solid-js";
import Drome from "./drome-2/core/drome";

export default function TestDemo() {
  const [drome, setDrome] = createSignal<Drome | null>(null);

  onMount(() => {
    const drome = new Drome(140);
    // const inst = drome
    //   .synth("square")
    //   .note(130.81)
    //   .adsr(0.01, 0.333, 0, 0)
    //   .euclid(5, 8, 2)
    //   .lpf(800);

    const foo = drome
      .synth("sawtooth")
      .note([[60, 64, 67, 71]], [[57, 60, 64, 67]])
      .euclid(8, 8)
      .lpf(300)
      .lpenv(2, 0.333, 0.333, 0.0, 0.5)
      .reverb(0.5)
      // .distort(1)
      .postgain(0.375);
    const foo2 = drome.sample().note("bd:3").sequence([0, 3, 6], 8);

    // const inst = drome
    //   .synth("sawtooth")
    //   .note(130.81)
    //   .euclid(5, 8, 2)
    //   .lpf(300)
    //   .lpenv(2, 0.333, 0.333, 0.25, 0.5)
    //   .reverb(0.25)
    //   .postgain(0.875);

    // const inst2 = drome
    //   .sample("bd:2")
    //   .euclid(5, 8)
    //   .reverb(0.2)
    //   .distort(20, 1)
    //   .postgain(1.25);

    // const inst3 = drome.sample("hh:2").euclid(8, 8).gain(0.25);
    // const inst4 = drome.sample("oh:1").euclid(4, 8, 1).gain(0.5);

    drome.addInstrument(foo);
    drome.addInstrument(foo2);
    // drome.addInstrument(inst);
    // drome.addInstrument(inst2);
    // drome.addInstrument(inst3);
    // drome.addInstrument(inst4);
    setDrome(drome);
  });

  onCleanup(() => {
    drome()?.stop();
    drome()?.destroy();
  });

  function handlePlay() {
    const d = drome();
    if (!d) return;
    if (d.paused) d.start();
    else d.stop();
  }

  return <button onClick={handlePlay}>Play</button>;
}
