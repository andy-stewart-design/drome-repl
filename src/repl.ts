import Drome from "@/drome";
import type { LogType } from "./App";

type LogCallback = (message: string, type?: LogType) => void;

function runCode(drome: Drome, code: string, log: LogCallback) {
  const msg = drome.paused ? `🔧 Running code...` : `🔧 Queuing update...`;
  log(msg, "input");

  try {
    drome.clearInstruments();
    const result = new Function("drome", `${code}`)(drome);

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
