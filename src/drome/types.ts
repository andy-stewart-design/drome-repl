import { synthAliasMap } from "./synth";

type DromeStatus = "stopped" | "stopping" | "playing" | "queued";

type OscType = Exclude<OscillatorType, "custom">;
type SynthTypeMap = typeof synthAliasMap;
type SynthAlias = keyof SynthTypeMap;
type SynthType = SynthTypeMap[keyof SynthTypeMap];

type SampleId<
  B extends SampleBank = SampleBank,
  N extends SampleName = SampleName
> = `${B}-${N}-${number}`;
type SampleName =
  | "bd"
  | "hh"
  | "oh"
  | "cp"
  | "cr"
  | "ht"
  | "lt"
  | "mt"
  | "sd"
  | "rim"
  | "rd";
type SampleBank = "RolandTR909" | "RolandTR808";

interface ADSRParams {
  a: number;
  d: number;
  s: number;
  r: number;
}

interface GainParams {
  value: number;
  env: ADSRParams;
}

type FilterType = Exclude<
  BiquadFilterType,
  "allpass" | "highshelf" | "lowshelf" | "notch" | "peaking"
>;

interface FilterParams {
  type: FilterType;
  value: number;
  q?: number;
  depth?: number;
  env?: ADSRParams;
}

export type {
  DromeStatus,
  OscType,
  SynthTypeMap,
  SynthAlias,
  SynthType,
  SampleId,
  SampleName,
  SampleBank,
  ADSRParams,
  GainParams,
  FilterType,
  FilterParams,
};

// type FutureSampleName =
//   | "bd"
//   | "sd"
//   | "rim"
//   | "cp"
//   | "hh"
//   | "oh"
//   | "cr"
//   | "rd"
//   | "ht"
//   | "mt"
//   | "lt"
//   | "sh"
//   | "cb"
//   | "tb"
//   | "perc"
//   | "misc"
//   | "fx";
