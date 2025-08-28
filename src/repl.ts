import Drome from "@/drome-2/core/drome";
import type { LogType } from "./App";

type LogCallback = (message: string, type?: LogType) => void;

function runCode(drome: Drome, code: string, log: LogCallback) {
  const msg = drome.paused ? `🔧 Running code...` : `🔧 Queuing update...`;
  log(msg, "input");

  try {
    drome.clear();
    const result = new Function("drome, d", `${code}`)(drome, drome);

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
  drome.clear();
}

export { play, stop };
