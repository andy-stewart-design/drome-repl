type DromeStatus = "stopped" | "stopping" | "playing" | "queued";

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

export type { DromeStatus, OscType, ADSRParams, FilterParams };
