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
  SampleId,
  SampleName,
  SampleBank,
  ADSRParams,
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
