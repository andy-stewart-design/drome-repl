const examples = [
  {
    title: "Minimal example",
    code: `drome.synth().note(60).push() // default waveform is "sine"`,
  },
  {
    title: "Multiple synths",
    code: `drome.stack(
  drome.synth().note(60).adsr(0.25,0.1,0).euclid(4, 4).lpf(400).gain(1),
  drome.synth("sawtooth").note(48).euclid(3, 8).adsr(0.01,0.5,0.2,0.05).lpf(400).lpenv(2,{a: 0.125})
)`,
  },
  {
    title: "Multiple speeds",
    code: `drome.stack(
  drome.synth("sawtooth").note(57).euclid(3,8).adsr(0.001,0.333).lpf(1600), // can use either "saw" or "sawtooth"
  drome.synth("saw").note([43,43,43,50,43,43,53,54]).lpf(400).lpenv(2,{a:0.125,d:0.1,s:0.01,r:0.01}).adsr(0.001,0.2).fast(2).gain(1.5),
)`,
  },
  {
    title: "Static methods",
    code: `const struct = drome.euclid(5,8)

drome.stack(
  drome.synth("saw").note(48).struct(struct).adsr(0, 0.333).lpf(800).gain(1.25),
  drome.synth("sq").note(60).struct(struct.rotate(4).stretch(3)).adsr(0, 0.1).lpf(1600).gain(0.75)
)`,
  },
  {
    title: "Chords and melodies",
    code: `drome.synth().note([[60,64,67]],[[62,65,69]]).adsr(0.01,0.75).push() 

drome.synth("saw").note([72,76,79],[81,79,76]).adsr(0.01,0.5).lpf(800).push()`,
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

drome.synth("saw").note(69).adsr(0.01, 0.1, 0.01, 0.01).struct(risset).bpf(800).bpenv(3,{a:0.01, d:0.1, s:0.01, r:0.01}).gain(0.625).push() 

drome.synth("saw").note(45).lpf(200).adsr(0.5, 0.01, 0.01, 0.1).lpenv(2,{a:0.5, d:0.01, s:0.01, r:0.1}).euclid(4,4).push()

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
