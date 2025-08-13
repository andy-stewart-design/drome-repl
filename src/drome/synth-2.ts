import type { Drome } from "./drome-2";

class Synth {
  private drome: Drome;
  public notes = [
    880, 440, 440, 440, 440, 440, 440, 440, 440, 440, 440, 440, 440, 440, 440,
    440,
  ];

  constructor(drome: Drome) {
    this.drome = drome;
  }

  private _play(skippedNotesCount = 0) {
    const startOffset = this.drome.barDuration / this.notes.length;

    this.notes.forEach((note, i) => {
      if (i < skippedNotesCount) return;
      const freq = note;
      const noteLength = this.drome.stepLength / 2;

      // Create oscillator
      const oscillator = this.drome.ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, this.drome.ctx.currentTime);

      // Create gain node for envelope
      const gainNode = this.drome.ctx.createGain();
      gainNode.gain.setValueAtTime(0, this.drome.ctx.currentTime);

      // Connect: oscillator -> gain -> destination
      oscillator.connect(gainNode);
      gainNode.connect(this.drome.ctx.destination);

      // Define envelope timing
      const attackTime = 0.01; // 10ms attack
      const releaseTime = 0.05; // 50ms release
      const sustainTime = Math.max(0, noteLength - attackTime - releaseTime);

      // Schedule gain envelope
      const startTime = this.drome.barStartTime + startOffset * i;
      const attackEnd = this.drome.barStartTime + startOffset * i + attackTime;
      const sustainEnd = attackEnd + sustainTime;
      const releaseEnd = sustainEnd + releaseTime;

      // Attack: fade in
      gainNode.gain.linearRampToValueAtTime(0.5, attackEnd);

      // Sustain: hold at full volume
      gainNode.gain.setValueAtTime(0.5, sustainEnd);

      // Release: fade out
      gainNode.gain.linearRampToValueAtTime(0, releaseEnd);

      // Start and stop oscillator
      oscillator.start(startTime);
      oscillator.stop(releaseEnd + 0.1); // Small buffer to ensure clean stop
    });
  }

  onPush() {
    const barProgress = this.drome.metronome.step / this.drome.stepCount;
    const skippedNotesCount = this.notes.length * barProgress;
    console.log("notes to skip", skippedNotesCount);
    this._play(skippedNotesCount);
  }

  play() {
    this._play();
  }
}

export default Synth;
