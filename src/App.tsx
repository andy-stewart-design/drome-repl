import { createSignal, onCleanup, onMount, Show } from "solid-js";
import Drome from "@/drome-2/core/drome";
import { play, stop } from "./repl";
import { examples } from "@/assets/examples";
import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import {
  javascript,
  theme,
  flash,
  flashField,
  autocomplete,
} from "./codemirror";
import type { Metronome } from "./drome/audio-clock";

export type LogType = "input" | "output" | "error";

interface ReplLog {
  type: LogType;
  message: string;
}

const LS_KEY = "drome_sketch";

function App() {
  const [playing, setPlaying] = createSignal(false);
  const [editor, setEditor] = createSignal<EditorView | null>(null);
  const [logs, setLogs] = createSignal<ReplLog[]>([]);
  const [metronome, setMetronome] = createSignal<Metronome | null>(null);
  const drome = new Drome(120);
  let editorContainer: HTMLDivElement | undefined;
  let logOutput: HTMLDivElement | undefined;

  function handlePlay() {
    const ed = editor();
    if (!ed) return;
    const code = ed.state.doc.toString();
    if (!code) return;
    drome.bpm(120);
    play(drome, code, log);
    flash(ed);
    localStorage.setItem(LS_KEY, code);
  }

  function handleStop() {
    stop(drome);
    setMetronome(null);
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
    if (!editorContainer) return;
    const doc =
      localStorage.getItem(LS_KEY) ??
      examples[Math.floor(Math.random() * examples.length)].code;
    const view = new EditorView({
      doc,
      parent: editorContainer,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        javascript(),
        theme,
        flashField,
        autocomplete,
      ],
    });
    setEditor(view);
    window.addEventListener("keydown", handleKeydown);
    drome.on("start", () => {
      setPlaying(true);
      log(`▶ Starting playback loop...`, "output");
    });
    drome.on("beat", (m) => setMetronome(m));
    drome.on("stop", () => {
      setPlaying(false);
      log(`⏹ Stopping playback`, "output");
    });
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeydown);
    drome.cleanup();
  });

  function handleInsertExample(code: string) {
    const ed = editor();
    if (!ed) return;
    drome.bpm(120);
    ed.dispatch({
      changes: { from: 0, to: ed.state.doc.length, insert: code },
    });
    ed.focus();
    drome.stop();
    requestAnimationFrame(() => {
      play(drome, code, log);
      flash(ed);
    });
  }

  function log(message: string, type: LogType = "output") {
    setLogs([...logs(), { type, message }]);
    if (logOutput) logOutput.scrollTop = logOutput.scrollHeight;
  }

  return (
    <div class="container">
      <div class="repl-section">
        <div class="header">
          <div class="title">
            <div class="status-dot" id="statusDot" data-playing={playing()} />
            Drome
          </div>
          <div class="controls">
            <Show when={metronome()}>
              <span class="metronome">
                <span>beat</span> {metronome()?.beat} <span>: bar </span>
                {metronome()?.bar.toString().padStart(2, "0")}
              </span>
            </Show>
            <button onclick={handlePlay}>
              {playing() ? "Update" : "Play"}
            </button>
            <button onclick={handleStop} disabled={!playing()}>
              Stop
            </button>
          </div>
        </div>
        <div ref={editorContainer} class="editor-container" />
      </div>
      <div class="sidebar">
        <section>
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
                    .replace(/(\r?\n){2,}/g, "\n")
                    .split(/\r?\n|\r/)
                    .slice(0, 3)
                    .map((line) => (
                      <p>{line}</p>
                    ))}
                </div>
              </button>
            ))}
          </div>
        </section>
        <section>
          <div class="section-header">Output</div>
          <div ref={logOutput} class="output">
            {logs().map((log) => (
              <div class="log-entry" data-type={log.type}>
                {log.message}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
