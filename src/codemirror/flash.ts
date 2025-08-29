import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

let timeoutId: ReturnType<typeof setTimeout> | null = null;

export const setFlash = StateEffect.define<boolean>();
export const flashField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(flash, tr) {
    try {
      for (let e of tr.effects) {
        if (e.is(setFlash)) {
          if (e.value && tr.newDoc.length > 0) {
            const mark = Decoration.mark({
              attributes: { style: `background-color: #243a51;` },
            });
            flash = Decoration.set([mark.range(0, tr.newDoc.length)]);
          } else {
            flash = Decoration.set([]);
          }
        }
      }
      return flash;
    } catch (err) {
      console.warn("[DROME] flash error", err);
      return flash;
    }
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const flash = (view: EditorView, ms = 200) => {
  if (timeoutId) clearTimeout(timeoutId);
  view.dispatch({ effects: setFlash.of(true) });
  timeoutId = setTimeout(() => {
    view.dispatch({ effects: setFlash.of(false) });
    timeoutId = null;
  }, ms);
};

export const isFlashEnabled = (on: boolean) => (on ? flashField : []);
