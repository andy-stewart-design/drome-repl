function generateImpulseResponse(
  ctx: AudioContext,
  duration = 3,
  decay = 2.0
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const n = i;
      channelData[i] =
        (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
  }

  return impulse;
}

export { generateImpulseResponse };
