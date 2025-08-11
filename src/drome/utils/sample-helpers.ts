import type { SampleBank, SampleId, SampleName } from "../types";
import rawSampleMap from "../samples/tr909.json";

const sampleMap = rawSampleMap as Record<string, string[]>;
const baseUrl =
  "https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/";

async function loadSample(name: SampleName, bank: SampleBank, index = 0) {
  const key: `${SampleBank}_${SampleName}` = `${bank}_${name}`;
  const sampleBank = sampleMap[key];
  if (!sampleBank) return;
  const slug = sampleBank[index % sampleBank.length];
  console.log({ sampleBank, slug });

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
  gain?: number;
  //   frequency?: number;
  //   duration?: number;
  //   adsr?: ADSRParams;
  //   filter?: FilterParams;
}

function playSample({ ctx, time, buffer, gain = 1 }: PlaySampleOptions) {
  const t = time + 0.01;
  const baseVolume = 0.5;
  const maxVolume = gain * baseVolume;

  try {
    const gainNode = ctx.createGain();
    gainNode.gain.value = maxVolume;

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
