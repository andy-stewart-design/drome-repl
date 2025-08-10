import { createPeriodicWave } from "./utils/create-periodic-wave";
import type { ADSRParams, FilterParams, OscType } from "./types";

interface OscillatorOptions {
  ctx: AudioContext;
  time: number;
  waveform?: OscType;
  harmonics?: number | null;
  frequency?: number;
  duration?: number;
  adsr?: ADSRParams;
  gain?: number;
  filter?: FilterParams;
}

const defaultAdsr: ADSRParams = {
  attack: 0.01,
  decay: 0.2,
  sustain: 0.0,
  release: 0.1,
};

function oscillator({
  ctx,
  time,
  waveform = "sine",
  harmonics = null,
  frequency: freq = 330,
  duration = 0.5,
  adsr = defaultAdsr,
  gain = 1,
  filter,
}: OscillatorOptions) {
  const t = time + 0.01;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const f = filter ? ctx.createBiquadFilter() : null;

  if (f && filter) {
    f.type = filter.type;
    f.frequency.value = filter.frequency;
    if (filter.Q !== undefined) {
      f.Q.value = filter.Q;
    }
  }

  o.frequency.value = freq;
  if (!harmonics || waveform === "sine") o.type = waveform;
  else o.setPeriodicWave(createPeriodicWave(ctx, waveform, harmonics));

  o.start(t);
  o.stop(t + duration);

  // ADSR Envelope
  const baseVolume = 0.15;
  const maxVolume = gain * baseVolume;
  const sustainLevel = maxVolume * adsr.sustain;

  const minDuration = adsr.attack + adsr.decay + adsr.release;
  const scale = duration < minDuration ? duration / minDuration : 1;

  // Calculate time points
  const attackEnd = t + adsr.attack * scale;
  const decayEnd = attackEnd + adsr.decay * scale;
  const sustainEnd = t + duration - adsr.release * scale;
  const releaseEnd = t + duration;

  g.gain.setValueAtTime(0, t);
  // Attack
  g.gain.linearRampToValueAtTime(maxVolume, attackEnd);
  // Decay
  g.gain.linearRampToValueAtTime(sustainLevel, decayEnd);
  // Sustain
  g.gain.setValueAtTime(sustainLevel, sustainEnd);
  // Release
  g.gain.linearRampToValueAtTime(0, releaseEnd);

  // Connect the audio chain
  if (f) {
    // oscillator -> filter -> gain -> destination
    o.connect(f);
    f.connect(g);
  } else {
    // oscillator -> gain -> destination
    o.connect(g);
  }

  g.connect(ctx.destination);

  o.onended = () => {
    o.disconnect();
    g.disconnect();
    if (f) f.disconnect();
  };
}

export { oscillator };
