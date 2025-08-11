interface OscillatorOptions {
  ctx: AudioContext;
  name: string;
  index?: number;
  time: number;
  //   harmonics?: number | null;
  //   frequency?: number;
  //   duration?: number;
  //   adsr?: ADSRParams;
  //   gain?: number;
  //   filter?: FilterParams;
}

const baseUrl =
  "https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/";

const sampleMap: Record<string, string[]> = {
  bd: [
    "RolandTR909/rolandtr909-bd/Bassdrum-01.wav",
    "RolandTR909/rolandtr909-bd/Bassdrum-02.wav",
    "RolandTR909/rolandtr909-bd/Bassdrum-03.wav",
    "RolandTR909/rolandtr909-bd/Bassdrum-04.wav",
  ],
  hh: [
    "RolandTR909/rolandtr909-hh/hh01.wav",
    "RolandTR909/rolandtr909-hh/hh02.wav",
    "RolandTR909/rolandtr909-hh/hh03.wav",
    "RolandTR909/rolandtr909-hh/hh04.wav",
  ],
};

async function audioBuffer({ ctx, time, name, index = 0 }: OscillatorOptions) {
  const t = time + 0.01;
  const sampleArray = sampleMap[name] ?? sampleMap.bd;
  const sampleSlug = sampleArray[index % sampleArray.length];
  const sampleUrl = baseUrl + sampleSlug;

  try {
    const response = await fetch(sampleUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.875;

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(t);
  } catch (error) {
    console.error("Error loading or playing sample:", error);
  }
}

export { audioBuffer };

// drome.sample("bd")
