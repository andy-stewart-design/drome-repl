import { createSignal, onCleanup, onMount } from "solid-js";
import Drome from "@/drome";
import { play, stop } from "./repl";
import { examples, textAreaPlaceholder } from "@/assets/examples";

export type LogType = "input" | "output" | "error";

interface ReplLog {
  type: LogType;
  message: string;
}

function App() {
  const [playing, setPlaying] = createSignal(false);
  const [code, setCode] = createSignal("");
  const [logs, setLogs] = createSignal<ReplLog[]>([]);
  const drome = new Drome(120);
  let codeEditor: HTMLTextAreaElement | undefined;
  let logOutput: HTMLDivElement | undefined;

  function handlePlay() {
    const code = codeEditor?.value.trim();
    if (!code) return;
    play(drome, code, log);
  }

  function handleStop() {
    stop(drome);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.altKey && e.key === "Enter") {
      e.preventDefault();
      handlePlay();
    } else if (e.altKey && e.key === "≥") {
      e.preventDefault();
      handleStop();
    }
  }

  onMount(() => {
    if (!codeEditor) return;
    codeEditor.addEventListener("keydown", handleKeydown);
    drome.onStart(() => {
      setPlaying(true);
      log(`▶ Starting playback loop...`, "output");
    });
    drome.onIterationStart((n: number) => {
      log(`♻️ Starting cycle ${n}`);
    });
    drome.onStop(() => {
      setPlaying(false);
      log(`⏹ Stopping playback`, "output");
    });
  });

  onCleanup(() => {
    if (!codeEditor) return;
    codeEditor.removeEventListener("keydown", handleKeydown);
    drome.destroy();
  });

  function handleInsertExample(code: string) {
    setCode(code);
    codeEditor?.focus();
    play(drome, code, log);
  }

  function log(message: string, type: LogType = "output") {
    setLogs([...logs(), { type, message }]);
    if (logOutput) logOutput.scrollTop = logOutput.scrollHeight;
  }

  return (
    <>
      <div class="header">
        <div class="title">Drome REPL</div>
        <div class="controls">
          <div class="status">
            <div class="status-dot" id="statusDot" data-playing={playing()} />
            <span id="statusText">{playing() ? "Playing" : "Stopped"}</span>
          </div>
          <button onclick={handlePlay}>{playing() ? "Update" : "Play"}</button>
          <button onclick={handleStop} disabled={!playing()}>
            Stop
          </button>
        </div>
      </div>

      <div class="container">
        <div class="repl-section">
          <textarea
            ref={codeEditor}
            class="code-editor"
            value={code()}
            onChange={(e) => setCode(e.target.value)}
            placeholder={textAreaPlaceholder}
            spellcheck="false"
          />
          <div class="section-header">Output</div>
          <div ref={logOutput} class="output">
            {logs().map((log) => (
              <div class="log-entry" data-type={log.type}>
                {log.message}
              </div>
            ))}
          </div>
        </div>
        <div class="examples-section">
          <div class="section-header">Examples</div>
          <div class="examples">
            {examples.map((ex) => (
              <button
                class="example"
                onClick={() => handleInsertExample(ex.code)}
              >
                <div class="example-title">{ex.title}</div>
                <div class="example-code">
                  {ex.code
                    .split(/\r?\n|\r/)
                    .slice(0, 5)
                    .map((line) => (
                      <p>{line}</p>
                    ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
