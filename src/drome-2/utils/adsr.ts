import { clamp } from "./math";
import type { ADSRParams } from "../types";

interface ApplyEnvArgs {
  target: AudioParam;
  startTime: number;
  duration: number;
  startVal: number;
  maxVal: number;
  env?: Partial<ADSRParams>;
  minVal?: number;
}

const defaultEnv = { a: 0.01, d: 0.01, s: 1.0, r: 0.01 };

function applyEnvelope({
  target,
  startTime,
  duration,
  startVal,
  maxVal,
  env = {},
  minVal, // New parameter
}: ApplyEnvArgs) {
  const adsr = { ...defaultEnv, ...env };

  // Cancel anything that was already scheduled
  target.cancelAndHoldAtTime(startTime);

  const attDur = Math.max(clamp(adsr.a, 0.01, 0.98) * duration, 0.01);
  const attEnd = startTime + attDur;
  const decDur = Math.max(clamp(adsr.d, 0.01, 0.98) * duration, 0.01);
  const decEnd = attEnd + decDur;
  const susVal = maxVal * Math.max(adsr.s, 0.01);
  const susEnd = startTime + duration + 0.01;
  const relDur = adsr.r * duration;
  const relEnd = susEnd + relDur;

  // Use minVal if provided, otherwise use startVal for release
  const releaseTarget = minVal !== undefined ? minVal : startVal;

  target.linearRampToValueAtTime(startVal, startTime);
  target.linearRampToValueAtTime(maxVal, attEnd); // Attack
  target.linearRampToValueAtTime(susVal, decEnd); // Decay
  target.linearRampToValueAtTime(susVal, susEnd); // Sustain
  target.linearRampToValueAtTime(releaseTarget, relEnd); // Release to minVal or startVal
}

export { applyEnvelope };
