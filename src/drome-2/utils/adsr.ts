import { clamp } from "./math";
import type { ADSRParams } from "../types";

interface ApplyEnvArgs {
  target: AudioParam;
  startTime: number;
  duration: number;
  startVal: number;
  maxVal: number;
  env?: Partial<ADSRParams>;
}

const defaultEnv = { a: 0.01, d: 0.01, s: 1.0, r: 0.025 };

function applyEnvelope({
  target,
  startTime,
  duration,
  startVal,
  maxVal,
  env = {},
}: // ctx,
ApplyEnvArgs) {
  const adsr = { ...defaultEnv, ...env };

  // Cancel anything that was already scheduled
  target.cancelScheduledValues(startTime);

  const attDur = clamp(adsr.a, 0.01, 0.98) * duration;
  const attEnd = startTime + attDur;
  const decDur = clamp(adsr.d, 0.01, 0.98) * duration;
  const decEnd = attEnd + decDur;
  const susVal = maxVal * Math.max(adsr.s, 0.01);
  const susEnd = startTime + duration;
  const relDur = adsr.r * duration;
  const relEnd = susEnd + relDur;

  target.setValueAtTime(startVal, startTime);
  target.linearRampToValueAtTime(maxVal, attEnd); // Attack
  target.linearRampToValueAtTime(susVal, decEnd); // Decay
  target.setValueAtTime(susVal, susEnd); // Sustain
  target.linearRampToValueAtTime(0, relEnd); // Release
}

export { applyEnvelope };
