import type { SampleBank, SampleId, SampleName } from "../types";
import sampleMap from "../samples/tr909.json";

const baseUrl =
  "https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/";

async function loadSample(name: SampleName, bank: SampleBank, index = 0) {
  const key: `${SampleBank}_${SampleName}` = `${bank}_${name}`;
  const slug = sampleMap[key][index];
  const sampleUrl = baseUrl + slug;

  try {
    const response = await fetch(sampleUrl);
    return response.arrayBuffer();
  } catch (error) {
    console.error("Error loading or playing sample:", error);
  }
}

interface PlaySampleOptions {
  ctx: AudioContext;
  buffer: AudioBuffer;
  time: number;
  //   frequency?: number;
  //   duration?: number;
  //   adsr?: ADSRParams;
  //   gain?: number;
  //   filter?: FilterParams;
}

function playSample({ ctx, time, buffer }: PlaySampleOptions) {
  const t = time + 0.01;

  try {
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(t);
  } catch (error) {
    console.error("Error loading or playing sample:", error);
  }
}

function makeSampleId<
  B extends SampleBank,
  N extends SampleName,
  Num extends number
>(bank: B, name: N, num: Num): SampleId<B, N> {
  return `${bank}-${name}-${num}` as SampleId<B, N>;
}

function splitSampleId<
  B extends SampleBank,
  N extends SampleName,
  Num extends number
>(id: SampleId<B, N>): [B, N, Num] {
  const [bank, name, numStr] = id.split("-");
  return [bank as B, name as N, Number(numStr) as Num];
}

export { playSample, loadSample, makeSampleId, splitSampleId };
