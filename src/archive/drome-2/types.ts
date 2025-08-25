import type DelayEffect from "./effects/delay";
import type FilterEffect from "./effects/filter";
import type DromeGain from "./core/drome-gain";
import type ReverbEffect from "./effects/reverb";
import type DistortionEffect from "./effects/distortion";

interface ADSRParams {
  a: number;
  d: number;
  s: number;
  r: number;
}

type DromeAudioNode =
  | DelayEffect
  | FilterEffect
  | ReverbEffect
  | DistortionEffect
  | DromeGain;

type FilterType = Exclude<
  BiquadFilterType,
  "allpass" | "highshelf" | "lowshelf" | "notch" | "peaking"
>;

interface FilterOptions {
  type: BiquadFilterType;
  frequency: number;
  q: number;
  env: { depth: number; adsr: ADSRParams };
}

export type { ADSRParams, DromeAudioNode, FilterType, FilterOptions };
