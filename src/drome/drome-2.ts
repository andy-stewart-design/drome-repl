import AudioClock, { type AudioClockCallbackData } from "@/drome/audio-clock";

class Drome extends AudioClock {
  constructor() {
    super();
    this.callback = this.play.bind(this);
  }

  play(data: AudioClockCallbackData) {
    const stepsPerBeat = 4;
    const { step } = this.metronome;

    if (this.metronome.step % 4 == 0) console.log(data);

    const freq = step % stepsPerBeat == 0 ? 880 : 440;
    const noteLength = this.stepLength / 2;

    // Create oscillator
    const oscillator = this.ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Create gain node for envelope
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    // Connect: oscillator -> gain -> destination
    oscillator.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    // Define envelope timing
    const attackTime = 0.01; // 10ms attack
    const releaseTime = 0.05; // 50ms release
    const sustainTime = Math.max(0, noteLength - attackTime - releaseTime);

    // Schedule gain envelope
    const startTime = this.startTime;
    const attackEnd = this.startTime + attackTime;
    const sustainEnd = attackEnd + sustainTime;
    const releaseEnd = sustainEnd + releaseTime;

    // Attack: fade in
    gainNode.gain.linearRampToValueAtTime(1, attackEnd);

    // Sustain: hold at full volume
    gainNode.gain.setValueAtTime(1, sustainEnd);

    // Release: fade out
    gainNode.gain.linearRampToValueAtTime(0, releaseEnd);

    // Start and stop oscillator
    oscillator.start(startTime);
    oscillator.stop(releaseEnd + 0.1); // Small buffer to ensure clean stop
  }
}

export default Drome;
export { Drome, type AudioClockCallbackData as DromeCallbackData };
