const examples = [
  {
    title: "Minimal example",
    code: `drome.synth().note(60).push() // default waveform is "sine"`,
  },
  {
    title: "Multiple synths",
    code: `d.bpm(135)

d.stack(
  d.synth("saw").note([48,60],[43,55]).lpf(800).lpenv(2,0.1,0.25,0.375,1).euclid(5,8,2).reverb(0.1),
  d.synth("sine").note([48,60],[43,55]).adsr(0.1,0.25,0.5,0.1).euclid(5,8,2).gain(2),
  d.synth("saw").note([75,74,70],[70,69,67]).adsr(0.01,0.75,0.75,1.5).lpf(1600).lpenv(2).euclid(3,8,1).reverb(0.5),
)

d.sample("bd:3").hex("f").push()
d.sample("hh:3").hex("ff").gain(0.5).push()
d.sample("oh:2").euclid(4,8,1).gain(0.75).push()`,
  },
  {
    title: "Multiple speeds",
    code: `drome.stack(
  drome.synth("sawtooth") // can use either "saw" or "sawtooth"
    .note(57).euclid(3,8).adsr(0.01,0.666,0.1,0.01)
    .lpf(1600).gain(2).delay(0.25).reverb(0.5), 
  drome.synth("saw").note([43,43,43,50,43,43,53,54])
    .lpf(300).lpenv(2,0.01,0.75,0.5,0.1)
    .fast(2).gain(3).reverb(0.25),
)`,
  },
  //   {
  //     title: "Static methods",
  //     code: `const struct = drome.euclid(5,8)

  // drome.stack(
  //   drome.synth("saw").note(48).struct(struct).adsr(0.01, 0.99).lpf(800).gain(1.25),
  //   drome.synth("sq").note(60).struct(struct.rotate(4).stretch(3)).adsr(0, 0.5).lpf(1600).gain(0.75)
  // )`,
  //   },
  {
    title: "Chords and melodies",
    code: `drome.synth("saw").note([48,52,43],[50,53,45]).reverb(0.25).lpf(400).adsr(0.01,0.9).push() 

drome.synth("sq").note([[60,64,67]],[[62,65,69]]).lpf(600).adsr(0.01,0.9).gain(0.875).push() 

drome.synth("saw").note([72,76,79,81,79,76]).adsr(0.01,0.75,0.1,0.01).fast(2).lpf(1000).lpenv(3,0.333,0.666,0.1,0.01).gain(0.875).push()`,
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

drome.synth("saw").note(69).adsr(0.01, 0.99, 0.75, 0.1).struct(risset).bpf(800).bpenv(3).gain(0.625).push() 

drome.synth("saw").note(45).adsr(0.95, 0.05, 0.25, 0.1).lpf(200).lpenv(3).euclid(4,4).gain(1.5).push()

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

// drome.stack(
//   drome
//     .synth("saw")
//     .note([[60, 64, 67, 71]], [[57, 60, 64, 67]])
//     .hex("ff")
//     .stretch(2)
//     .lpf(300)
//     .lpenv(2, 0.333, 0.333, 0.0, 0.5)
//     .reverb(0.5)
//     .distort(1),
//   drome.sample("bd:2").euclid([3, 5], 8).reverb(0.2),
//   drome.sample("hh:4").hex("ff").gain(0.375),
//   drome.sample("oh:1").euclid(4, 8, 1).gain(0.5)
// );
