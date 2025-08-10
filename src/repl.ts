import Drome from "@/drome";
import { beep } from "@/drome/beep";
import { euclid } from "@/drome/utils/euclid";
import { midiToFreq } from "@/drome/utils/midi";
import Synth from "@/drome/synth";
import type { LogType } from "./App";

type LogCallback = (message: string, type?: LogType) => void;

function runCode(drome: Drome, code: string, log: LogCallback) {
  log(`🔧 Running code...`, "input");

  try {
    drome.clearInstruments();
    const result = new Function(
      "drome",
      "Synth",
      "AudioClock",
      "euclid",
      "beep",
      "midiToFreq",
      `
                    ${code}
                `
    )(drome, Synth, Drome, euclid, beep, midiToFreq);

    log(`✓ Code executed successfully`, "output");
    if (result !== undefined) {
      log(`← ${result}`, "output");
    }
  } catch (error) {
    log(`✗ ${(error as Error).message}`, "error");
  }
}

function play(drome: Drome, code: string, log: LogCallback) {
  runCode(drome, code, log);
  if (drome.paused) {
    drome.start();
  }
}

function stop(drome: Drome) {
  drome.stop();
  drome.clearInstruments();
}

export { play, stop };
