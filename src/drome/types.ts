import { synthAliasMap } from "./synth";

type DromeStatus = "stopped" | "stopping" | "playing" | "queued";

type OscType = Exclude<OscillatorType, "custom">;
type SynthTypeMap = typeof synthAliasMap;
type SynthAlias = keyof SynthTypeMap;
type SynthType = SynthTypeMap[keyof SynthTypeMap];

type SampleName = "bd" | "hh" | "oh";
type SampleBank = "RolandTR909";

interface ADSRParams {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

interface FilterParams {
  type: BiquadFilterType;
  frequency: number;
  Q?: number;
}

export type {
  DromeStatus,
  OscType,
  SynthTypeMap,
  SynthAlias,
  SynthType,
  SampleName,
  SampleBank,
  ADSRParams,
  FilterParams,
};
