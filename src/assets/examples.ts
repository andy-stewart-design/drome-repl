const examples = [
  {
    title: "Minimal example",
    code: `drome.synth().push() // default waveform is "sine"`,
  },
  {
    title: "Roots & Scales",
    code: `drome.stack(
  d.synth("saw").root("c4").scale("maj").note([[0,2,4,6]],[[-2,0,2,4]])
    .hex("ff").stretch(2)
    .adsr(0.25, 0.25, 0.5, 0.1)
    .lpf(300).lpenv(2, 0.25, 0.25, 0, 0)
    .reverb(0.5).distort(1).postgain(1),
  d.synth("saw","sine").root("c3").scale("maj").note([[-7,0]],[[-9,-2]])
    .euclid(8,8).stretch(2)
    .lpf(300).lpenv(2,0.25,0.25,0.5,0).postgain(0.75),
  d.sample("bd:3").euclid([3, 5], 8).reverb(0.1),
  d.sample("hh:4").hex("ff").gain(0.375),
  d.sample("oh:1").euclid(4, 8, 1).gain(0.5)
);`,
  },
  {
    title: "360",
    code: `d.bpm(120)

const bass_notes = [[4,4,5,-7],[4,4,5,-7],[4,4,4,5,-7],[7,7,7,9]]
const kick_seq = [[0,6,7,10],[0,6,7,10],[2,4,6,7,10],[0,4,6,7]]
const lead_arr = [
  [3, [[-8,-1],,0,,-8,,-7,0,,0,9,,,,,,]],
  [1, [,,[-5,-1],,-5,-3,,0,,0,12,,0,,7,,]],
]

d.stack(
  d.synth("saw").arrange(...lead_arr).root(60)
    .adsr(0,1,0.5,0.125)
    .lpf(400).lpenv(7,0,0.5,0.2,0.1)
    .delay(0.2).reverb(0.2).postgain(1.5),
  d.synth("sq","sine").note(...bass_notes).root(36).sequence(...kick_seq,16)
    .adsr(0,1,0.5,0.2).lpf(200).lpenv(2,0,0.5,0,0),
)

d.stack(
  d.sample("bd").sequence(...kick_seq,16),
  d.sample("cp").bank("RolandTR808").euclid(2,4,1).gain(0.75)
)`,
  },
  {
    title: "Music 4 Machines",
    code: `d.bpm(134)

const arp_notes = [
  [-7, 5, 20, -7, 5, 19, -7, 15],
  [-12, 0, 15, -12, 0, 14, -12, 12],
  [-16, -4, 12, -16, -4, 10, -16, 12],
  [-16, -4, 12, -16, -4, 10, -14, 12],
  [-7, 5, 20, -7, 5, 19, -7, 15],
  [-12, 0, 15, -12, 15, 17, -9, 12],
  [-16, -4, 12, -16, -4, 10, -16, 12],
  [-14, -2, 12, -14, -2, 14, -14, 14],
] // Root: G3 / 55
const lead_notes = [
  [20, 19, 15],[15, 14, 12],
  [12, 10, 12],[12, 10, 12],
  [20, 19, 15],[15, 17, 12],
  [12, 10, 12],[12, 14, 14],
] // Root: G3 / 55
const bass_notes = [[-7,5],[-12,0],[-16,-4],[-16,-4,-16,-4,-14],[-7,5],[-12,0,-12,0,-9],[-16,-4],[-14,-2]] // Root: G3 / 55
const sub_notes = [5,0,-4,[-4,-4,-2,-2],5,[0,0,3,3],-4,-2] // Root: G1 / 31

d.stack(
  d.synth("ssaw").note(...lead_notes).root(55)
    .adsr(0.01,0.95,0.5,0.225)
    .lpf(1600).lpenv(2).euclid(3,8,1).reverb(0.5).delay(0.3,0.225),
  d.synth("saw").note(...arp_notes).root(55)
    .adsr(0.25,0.25,0.75,0.01).lpf(400).lpenv(6).reverb(0.5),
  d.synth("saw","sine").note(...bass_notes).root(55)
    .lpf(800).lpenv(2,0.1,0.25,0.375,1).euclid(5,8,2).reverb(0.1).gain(0.75),
  d.synth("saw","sq").note(...sub_notes).root(31).euclid(4,4)
    .lpf(50).lpenv(30,0.9,0.1,0.8,0.01).gain(0.375),
)

d.stack(
  d.sample("bd:0").hex("f"),
  d.sample("sd").euclid(2,4,1),
  d.sample("cp:3").euclid(2,4,1),
  d.sample("hh:2").euclid(4,8,1).gain(0.625),
  d.sample("sh").bank("RolandTR808").hex("ff").gain(0.375),
)`,
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

/* 
drome.stack(
  d.synth("saw").note([[60, 64, 67, 71]], [[57, 60, 64, 67]])
    .hex("ff").stretch(2)
    .adsr(0.25, 0.25, 0.5, 0.5)
    .lpf(300).lpenv(2, 0.25, 0.25, 0, 0)
    .reverb(0.5).distort(1).postgain(1),
  d.synth("saw").note([[36,48]], [[33,45]]).euclid(8,8).stretch(2).lpf(300).lpenv(2,0.25,0.25,0.5,0).postgain(0.75),
  d.synth("sine").note([[36,48]], [[33,45]]).euclid(8,8).stretch(2).adsr(0.1,0,1,0.1),
  d.sample("bd:3").euclid([3, 5], 8).reverb(0.1),
  d.sample("hh:4").hex("ff").gain(0.375),
  d.sample("oh:1").euclid(4, 8, 1).gain(0.5)
);
*/

/* 
drome.stack(
  d.synth("saw").root("c4").scale("maj").note([[0,2,4,6]], [[-3,0,4,7]])
    .hex("ff").stretch(2)
    .adsr(0.25, 0.25, 0.5, 0.1)
    .lpf(300).lpenv(2, 0.25, 0.25, 0, 0)
    .reverb(0.5).distort(1).postgain(1),
  d.synth("saw", "sine").note([[36,48]], [[33,45]]).euclid(8,8).stretch(2).lpf(300).lpenv(2,0.25,0.25,0.5,0).postgain(0.75),
  d.sample("bd:3").euclid([3, 5], 8).reverb(0.1),
  d.sample("hh:4").hex("ff").gain(0.375),
  d.sample("oh:1").euclid(4, 8, 1).gain(0.5)
);
*/

/* 
d.synth("saw").root("c4").scale("maj").note([[0,2,4,6]])
  .euclid(3,8).adsr(0,1,0.25,0.333).lpf(1200).push()
*/
