const examples = [
  {
    title: "Minimal example",
    code: `drome.synth().note(60).push() // default waveform is "sine"`,
  },
  {
    title: "Multiple synths",
    code: `d.bpm(135)

d.stack(
  d.synth("saw").note([48,60],[43,55]).adsr(0.1,0.25,0.5,1).lpf(800).lpenv(2).euclid(5,8,2),
  d.synth("sine").note([48,60],[43,55]).adsr(0.1,0.25,0.5,1).euclid(5,8,2),
  d.synth("ssaw").note([75,74,70],[70,69,67]).adsr(0.01,0.75,0.75,1.5).lpf(1600).lpenv(2).euclid(3,8,1),
)

d.sample("bd",1).hex("f").gain(0.75).push()`,
  },
  {
    title: "Multiple speeds",
    code: `drome.stack(
  drome.synth("sawtooth").note(57).euclid(3,8).adsr(0.001,0.666).lpf(1600), // can use either "saw" or "sawtooth"
  drome.synth("saw").note([43,43,43,50,43,43,53,54]).lpf(400).lpenv(2).adsr(0.001,0.75).fast(2).gain(1.5),
)`,
  },
  {
    title: "Static methods",
    code: `const struct = drome.euclid(5,8)

drome.stack(
  drome.synth("saw").note(48).struct(struct).adsr(0.01, 0.99).lpf(800).gain(1.25),
  drome.synth("sq").note(60).struct(struct.rotate(4).stretch(3)).adsr(0, 0.5).lpf(1600).gain(0.75)
)`,
  },
  {
    title: "Chords and melodies",
    code: `drome.synth("saw").note([48,52,43],[50,53,45]).lpf(400).adsr(0.01,0.9).push() 

drome.synth("sq").note([[60,64,67]],[[62,65,69]]).lpf(600).adsr(0.01,0.9).push() 

drome.synth("supersaw").note([72,76,79,81,79,76]).adsr(0.001,0.75).fast(2).lpf(1000).lpenv(2,{a:0.001,d:0.75}).gain(0.75).push()`,
  },
  {
    title: "Samples",
    code: `drome.bpm(140)

drome.stack(
  drome.sample("hh", 1).euclid(8,8).gain(0.625),
  drome.sample("oh").euclid(4,8,1).gain(0.575),
  drome.sample("cp").euclid(2,4,1).gain(1.5),
)
  
const kick = drome.sample("bd", 2).hex("f")
kick.push()`,
  },
  {
    title: "Custom struct",
    code: `const risset = Array.from({ length: 14 + 1 }, (_, i) => Array.from({ length: i }, (_, j) => j === i - 1 ? 1 : 0)).flat().reverse().slice(0, -1)

drome.synth("saw").note(69).adsr(0.01, 0.333, 0.01, 0.01).struct(risset).bpf(800).bpenv(3).gain(0.625).push() 

drome.synth("ssaw").note(45).adsr(0.95, 0.05, 0.25, 0.1).lpf(200).lpenv(1.5).euclid(4,4).gain(1.25).push()

d.stack(
  drome.sample("bd").bank("RolandTR909").euclid(4,4),
  drome.sample("hh").bank("RolandTR808").euclid(4,8,1).gain(0.75),
  drome.sample("cp").bank("RolandTR808").euclid(2,4,1).gain(0.75),
)`,
  },
];

const textAreaPlaceholder = `Write your code here...
        
Examples:
// Create a simple pattern
drome.synth().note([60, 64, 67]).euclid(5, 8).adsr(0,0.2)

// Add a bass line
drome.synth('sawtooth', 10).note([36,43]).adsr(0.25,0.75,0)

// Then click Play to start the loop!`;

export { examples, textAreaPlaceholder };

// const notes = drome.range(44, 48);

// drome.synth("sawtooth", 12).note(notes).adsr(0, 0.1);
