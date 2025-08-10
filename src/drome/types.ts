type OscType = Exclude<OscillatorType, "custom">;

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

export type { OscType, ADSRParams, FilterParams };
