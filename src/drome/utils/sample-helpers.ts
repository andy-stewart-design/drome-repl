import type { SampleBank, SampleName } from "../types";

const baseUrl =
  "https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/";

const sampleMap: Record<string, string[]> = {
  RolandTR909_bd: [
    "RolandTR909/rolandtr909-bd/Bassdrum-01.wav",
    "RolandTR909/rolandtr909-bd/Bassdrum-02.wav",
    "RolandTR909/rolandtr909-bd/Bassdrum-03.wav",
    "RolandTR909/rolandtr909-bd/Bassdrum-04.wav",
  ],
  RolandTR909_hh: [
    "RolandTR909/rolandtr909-hh/hh01.wav",
    "RolandTR909/rolandtr909-hh/hh02.wav",
    "RolandTR909/rolandtr909-hh/hh03.wav",
    "RolandTR909/rolandtr909-hh/hh04.wav",
  ],
  RolandTR909_oh: [
    "RolandTR909/rolandtr909-oh/Hat Open.wav",
    "RolandTR909/rolandtr909-oh/oh01.wav",
    "RolandTR909/rolandtr909-oh/oh02.wav",
    "RolandTR909/rolandtr909-oh/oh03.wav",
    "RolandTR909/rolandtr909-oh/oh04.wav",
  ],
};

async function loadSample(name: SampleName, bank: SampleBank, index = 0) {
  const key = `${bank}_${name}`;
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
    gainNode.gain.value = 0.875;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(t);
  } catch (error) {
    console.error("Error loading or playing sample:", error);
  }
}

type SampleId2<
  B extends SampleBank = SampleBank,
  N extends SampleName = SampleName
> = `${B}-${N}-${number}`;

function splitSampleId<
  B extends SampleBank,
  N extends SampleName,
  Num extends number
>(id: SampleId2<B, N>): [B, N, Num] {
  const [bank, name, numStr] = id.split("-");
  return [bank as B, name as N, Number(numStr) as Num];
}

export { playSample, loadSample, splitSampleId };
