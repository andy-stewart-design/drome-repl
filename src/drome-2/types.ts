import { drumAliases } from "./dictionaries/samples/drum-alias";
import { scaleAliasMap } from "./dictionaries/notes/scale-alias";
import { synthAliasMap } from "./dictionaries/synths/synth-aliases";
import type DelayEffect from "./effects/delay";
import type DistortionEffect from "./effects/distortion";
import type FilterEffect from "./effects/filter";
import type GainEffect from "./effects/gain";
import type ReverbEffect from "./effects/reverb";

interface Metronome {
  beat: number;
  bar: number;
}

type DromeEventType = "start" | "pause" | "stop" | "beat" | "bar";
type DromeEventCallback = (m: Metronome) => void;

type Falsy = null | undefined;
type DromeCycleValue = number | Falsy;
type DromeCycle = (DromeCycleValue | DromeCycleValue[])[][];

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
  type: FilterType;
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

type SampleBank = keyof typeof drumAliases;

export type {
  ADSRParams,
  DromeCycleValue,
  DromeCycle,
  DromeAudioNode,
  DromeEventCallback,
  DromeEventType,
  FilterType,
  FilterOptions,
  Metronome,
  NoteName,
  NoteValue,
  OscTypeAlias,
  OscType,
  SampleName,
  SampleNote,
  SampleBank,
  ScaleAlias,
};
