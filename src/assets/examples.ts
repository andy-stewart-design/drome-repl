const examples = [
  {
    title: "Minimal example",
    code: `drome.synth().note(60).push() // default waveform is "sine"`,
  },
  {
    title: "Multiple synths",
    code: `drome.stack(
  drome.synth().note(60).adsr(0.25, 0.1, 0).euclid(4, 4).lpf(400).gain(1.5),
  drome.synth("sawtooth").note(48).euclid(3, 8).lpf(1200).lpenv(1.5).adsr({d: 0.333, s: 0.2, r: 0.1}),
)`,
  },
  {
    title: "Multiple speeds",
    code: `drome.stack(
  drome.synth("sawtooth").note(57).euclid(3,8).lpf(1200).adsr(0.01,0.333,0.1,0.1), 
  drome.synth("sawtooth").note([43,43,43,50,43,43,53,54]).lpf(1000).adsr(0.01,0.125,0.1,0.1).fast(2).gain(1.5),
)`,
  },
  {
    title: "Static methods",
    code: `const struct = drome.euclid(5,8)

drome.stack(
  drome.synth("sawtooth").note(48).struct(struct).adsr(0, 0.1, 0.5, 0.3).lpf(800),
  drome.synth("square").note(60).struct(struct.rotate(4).stretch(3)).adsr(0, 0.125).lpf(2000).gain(0.75),
)`,
  },
  //   {
  //     title: "Samples",
  //     code: `drome.bpm(140)

  // drome.stack(
  //   drome.sample("hh", 1).euclid(8,8).gain(0.625),
  //   drome.sample("oh").euclid(4,8,1).gain(0.575),
  //   drome.sample("cp").euclid(2,4,1).gain(1.5),
  // )

  // const kick = drome.sample("bd", 2).hex("f")
  // kick.push()`,
  //   },
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
