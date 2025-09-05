import { noteNames } from "../dictionaries/notes/note-names";
import type { NoteName, NoteValue } from "../types";

function noteToMidi(noteString: NoteName | NoteValue) {
  const match = noteString.match(/([CDEFGAB][#b]?)(-?\d+)?/i);
  if (!match) return null;

  const noteName = match[1].toLocaleUpperCase();
  const octave = parseInt(match[2] || "5", 10);
  const baseValue = noteNames[noteName];

  if (baseValue === undefined) return null;
  // Calculate MIDI number: A2: (2 + 1) * 12 + 9 = 45.
  // (Octave + 1) * 12 gives the base MIDI number for the octave's C note.
  // Adding the note's base value gives the final MIDI number.
  return (octave + 1) * 12 + baseValue;
}

export { noteToMidi };
