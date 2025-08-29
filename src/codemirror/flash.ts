import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

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
              attributes: {
                style: `background-color: rgba(255,255,255, .4); filter: invert(10%)`,
              },
            });
            flash = Decoration.set([mark.range(0, tr.newDoc.length)]);
          } else {
            flash = Decoration.set([]);
          }
        }
      }
      return flash;
    } catch (err) {
      console.warn("flash error", err);
      return flash;
    }
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const flash = (view: EditorView, ms = 200) => {
  view.dispatch({ effects: setFlash.of(true) });
  console.log("flash", view);

  setTimeout(() => {
    view.dispatch({ effects: setFlash.of(false) });
  }, ms);
};

export const isFlashEnabled = (on: boolean) => (on ? flashField : []);
