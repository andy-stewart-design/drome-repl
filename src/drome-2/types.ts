import type DelayEffect from "./effects/delay";
import type FilterEffect from "./effects/filter";
import type MasterGain from "./core/master-gain";
import type ReverbEffect from "./effects/reverb";

interface ADSRParams {
  a: number;
  d: number;
  s: number;
  r: number;
}

type DromeAudioNode = DelayEffect | FilterEffect | ReverbEffect | MasterGain;

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
