import type DelayEffect from "./effects/delay";
import type FilterEffect from "./effects/filter";
import type GainEffect from "./effects/gain";
import type ReverbEffect from "./effects/reverb";
import type DistortionEffect from "./effects/distortion";
import { synthAliasMap } from "./dictionaries/synths/synth-aliases";
import { scaleAliasMap } from "./dictionaries/notes/scale-alias";

type OscType = Exclude<OscillatorType, "custom"> | "supersaw";
type OscTypeAlias = keyof typeof synthAliasMap;

type ScaleAlias = keyof typeof scaleAliasMap;
type NoteLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G";
type Accidental = "#" | "b";
type NaturalNote = NoteLetter;
type AccidentalNote = `${NoteLetter}${Accidental}`;
type NoteNameUpper = NaturalNote | AccidentalNote;
type NoteName = NoteNameUpper | Lowercase<NoteNameUpper>;
type NoteValue = `${NoteName}${number}`;

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
  | GainEffect;

type FilterType = Exclude<
  BiquadFilterType,
  "allpass" | "highshelf" | "lowshelf" | "notch" | "peaking"
>;

interface FilterOptions {
  type: BiquadFilterType;
  frequency: number;
  q: number;
  env: { depth: number; adsr?: ADSRParams } | undefined;
}

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
  | "rd"
  | (string & {});

type SampleNote = SampleName | `${SampleName}:${number}`;

type SampleBank = "RolandTR909" | "RolandTR808";

export type {
  ADSRParams,
  DromeAudioNode,
  FilterType,
  FilterOptions,
  SampleName,
  SampleNote,
  SampleBank,
  OscTypeAlias,
  OscType,
  ScaleAlias,
  NoteName,
  NoteValue,
};
