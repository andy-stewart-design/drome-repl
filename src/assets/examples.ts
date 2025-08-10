const examples = [
  {
    title: "Minimal example",
    code: `drome.synth().note(60)`,
  },
  {
    title: "Multiple elements",
    code: `drome.synth().note(60).adsr(0.25, 0.1, 0).euclid(4, 4).lpf(400).gain(1.5)

drome.synth("sawtooth", 8).note(48).euclid(3, 8).dec(0.5).sus(0.2)`,
  },
  {
    title: "Multiple speeds",
    code: `drome.synth("sawtooth",8).note(57).euclid(3,8).adsr(0.001,0.333)

drome.synth("sawtooth",24).note([43,43,43,50,43,43,53,54]).lpf(1000).adsr(0.001,0.25).fast(2).gain(1.5)`,
  },
  {
    title: "Static methods",
    code: `const struct = drome.euclid(5,8).stretch(4)

drome.synth("sawtooth",12).struct(struct).adsr(0, 0.1)`,
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
