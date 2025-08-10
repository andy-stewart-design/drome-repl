interface OscillatorOptions {
  ctx: AudioContext;
  name: string;
  time: number;
  //   harmonics?: number | null;
  //   frequency?: number;
  //   duration?: number;
  //   adsr?: ADSRParams;
  //   gain?: number;
  //   filter?: FilterParams;
}

async function audioBuffer({ ctx, time }: OscillatorOptions) {
  const t = time + 0.01;
  const sampleUrl =
    "https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/RolandTR909/rolandtr909-bd/Bassdrum-02.wav";

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
