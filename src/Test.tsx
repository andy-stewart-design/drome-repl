import { createSignal, onCleanup, onMount } from "solid-js";
import Drome from "./drome-2/core/drome";

export default function TestDemo() {
  const [drome, setDrome] = createSignal<Drome | null>(null);

  onMount(() => {
    const drome = new Drome();
    // const inst = drome
    //   .synth("sawtooth")
    //   .note(130.81)
    //   .euclid(3, 8)
    //   // .adsr(0.01, 0.99, 0.0, 0.5)
    //   .lpf(300)
    //   .lpenv(2, 0.333, 0.333, 0.25, 0.5)
    //   .reverb(0.25);

    // .delay(0.1);
    const inst = drome.sample().note("bd:2").euclid(3, 8).reverb(0.1);
    // .delay(0.1)
    // .distort(50, 1)
    // .postgain(0.75);
    // .adsr(0.001, 0.125, 0.0);
    // .lpf(1600);
    console.log(inst);

    drome.addInstrument(inst);
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
