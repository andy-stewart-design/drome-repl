import type { OscType } from "../../types";

export const synthAliasMap = {
  saw: "sawtooth",
  sawtooth: "sawtooth",
  tri: "triangle",
  triangle: "triangle",
  sq: "square",
  square: "square",
  sin: "sine",
  sine: "sine",
  supersaw: "supersaw",
  ssaw: "supersaw",
} satisfies Record<string, OscType>;
