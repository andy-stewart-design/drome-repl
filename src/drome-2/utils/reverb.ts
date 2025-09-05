async function generateImpulseResponse(
  ctx: AudioContext,
  duration = 3,
  fadeInTime = 0.1,
  lpFreqStart = 15000,
  lpFreqEnd = 1000
): Promise<AudioBuffer> {
  const sampleRate = ctx.sampleRate;
  const numChannels = 2;
  const totalTime = duration * 1.5;
  const decaySampleFrames = Math.round(duration * sampleRate);
  const numSampleFrames = Math.round(totalTime * sampleRate);
  const fadeInFrames = Math.round(fadeInTime * sampleRate);
  const decayBase = Math.pow(1 / 1000, 1 / decaySampleFrames);

  // Create base IR
  const impulse = ctx.createBuffer(numChannels, numSampleFrames, sampleRate);
  for (let ch = 0; ch < numChannels; ch++) {
    const chan = impulse.getChannelData(ch);
    for (let i = 0; i < numSampleFrames; i++) {
      chan[i] = (Math.random() * 2 - 1) * Math.pow(decayBase, i);
    }
    for (let i = 0; i < fadeInFrames; i++) {
      chan[i] *= i / fadeInFrames;
    }
  }

  // Apply offline lowpass filtering (async)
  if (!lpFreqStart || lpFreqStart <= 0) return impulse;

  const offline = new OfflineAudioContext(
    numChannels,
    numSampleFrames,
    sampleRate
  );
  const src = offline.createBufferSource();
  src.buffer = impulse;

  const filter = offline.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.0001;
  filter.frequency.setValueAtTime(lpFreqStart, 0);
  filter.frequency.linearRampToValueAtTime(lpFreqEnd, duration);

  src.connect(filter).connect(offline.destination);
  src.start();

  const rendered = await offline.startRendering();

  return rendered;
}

export { generateImpulseResponse as generateHighQualityImpulseResponse };
