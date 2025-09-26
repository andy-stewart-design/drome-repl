const examples = [
  {
    title: "Minimal example",
    code: `drome.synth().push() // default waveform is "sine"`,
  },
  {
    title: "Roots + Scales",
    code: `const r = "c"

d.stack(
  d.synth("saw").root(r+5).scale("maj").note([0,2,4,6],[-2,0,2,4])
    .euclid(4,8).fast(4).adsr(0,1,0.75,0).lpf(1000).lpenv(2,0,0.333,0.125,0.1)
    .postgain(1.25),
  d.synth("ssaw").root(r+4).scale("maj").note([[0,2,4,6]],[[-2,0,2,4]])
    .hex("ff").stretch(2)
    .lpf(600).lpenv(2, 0.333, 0.333, 0, 0).hpf(800).reverb(0.2),
  d.synth("saw","sine").root(r+3).scale("maj").note([[-7,0]],[[-9,-2]])
    .euclid(8,8).stretch(2)
    .lpf(300).lpenv(2,0.25,0.25,0.5,0).postgain(0.75),
  d.sample("bd:3").euclid([3,5], 8).reverb(0.1),
  d.sample("hh:4").hex("ff").gain(0.375),
  d.sample("oh:1").euclid(4,8,1).gain(0.5)
)`,
  },
  {
    title: "360",
    code: `d.bpm(120)

const bass_notes = [[2,2,3,-4], [2,2,3,-4], [2,2,2,3,-4], [4,4,4,5]]
const kick_seq = [[0,6,7,10], [0,6,7,10], [2,4,6,7,10], [0,4,6,7]]
const lead_arr = [[3, [[-5,-1],,0,,-5,,-4,0,,0,5,,,,,,]], [1, [,,[-3,-1],,-3,-2,,0,,0,7,,0,,4,,]]]

d.stack(
  d.synth("saw").arrange(...lead_arr).root("c4").scale("maj")
    .adsr(0,1,0.5,0.125)
    .lpf(400).lpenv(7,0,0.5,0.2,0.1)
    .delay(0.2).reverb(0.2).postgain(1.5),
  d.synth("sq","sine").note(...bass_notes).root("c2").scale("maj").sequence(...kick_seq,16)
    .adsr(0,1,0.5,0.2).lpf(200).lpenv(2,0,1,0,0),
)

d.stack(
  d.sample("bd").sequence(...kick_seq,16),
  d.sample("cp").bank("RolandTR808").euclid(2,4,1).gain(0.75)
)`,
  },
  {
    title: "Randomness",
    code: `const root = "a"
const scale = "min"
d.bpm(140)

d.sample("bd:3").bank("tr909").euclid(3,8).push()
d.sample("hh:4").bank("tr909").hex("ff").gain(d.rand.range(0.5,0.75).get(8)).pan(0.5).push()
d.sample("cp").bank("tr808").euclid(1,4,2).push()

d.synth("sine","saw").root("c3").scale(scale).note(d.euclid(6,16)).legato()
  .lpf(500).lpenv(3,0,1,0,0.2).postgain(0.5).push()

d.synth("saw").root(root + 3).scale(scale)
  .note(d.irand([100,88],1).range(0,7).get(8))
  .euclid(8,8).legato().reverb(0.5).pan([-1,1]).delay(0.5, 0.25)
  .adsr(0,1,0,0).lpf(600).lpenv(3,0.25,0.25,0.333,0).push()

d.synth("sq","sine").root(root + 1).scale(scale)
  .note(6,5).euclid(8,8).reverb(0.1)
  .adsr(0,0.5,0.5,0.1).lpf(400).lpenv(2,0,0.5,0.5,0).push()`,
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
    .adsr(0.01,0.95,0.5,0.225).gain(1.25)
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
  drome.synth("saw") // can use either "saw" or "sawtooth"
    .note(57).euclid(3,8).adsr(0,1,0.5,0.1)
    .lpf(800).lpenv(2).delay(0.2).reverb(0.5).postgain(1.25), 
  drome.synth("sq").note([43,43,43,50,43,43,53,54])
    .lpf(300).lpenv(2,0,0.5,0.5,0.1)
    .fast(2).gain(2).reverb(0.25),
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
    title: "Samples",
    code: `drome.bpm(140)

drome.stack(
  drome.sample("hh").euclid(8,8).gain(0.625),
  drome.sample("oh").euclid(4,8,1).gain(0.575),
  drome.sample("cp").euclid(2,4,1).gain(1.5),
)
  
const kick = drome.sample("bd").hex("f")
kick.push()`,
  },
  {
    title: "Custom struct",
    code: `const risset = Array.from({ length: 14 + 1 }, (_, i) => Array.from({ length: i }, (_, j) => j === i - 1 ? 1 : 0)).flat().reverse().slice(0, -1)

drome.synth("saw").note(69).adsr(0.01, 0.99, 0.75, 0.1).struct(risset).bpf(800).bpenv(3).gain(0.625).push() 

drome.synth("saw").note(45).adsr(0.95, 0.05, 0.25, 0.1).lpf(200).lpenv(3).euclid(4,4).gain(1.5).push()

d.stack(
  drome.sample("bd").bank("tr909").euclid(4,4),
  drome.sample("hh").bank("tr808").euclid(4,8,1).gain(0.75),
  drome.sample("cp").bank("tr808").euclid(2,4,1).gain(0.75),
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
d.synth("saw").root("c4").scale("maj").note([[0,2,4,6]])
  .euclid(3,8).adsr(0,1,0.25,0.333).lpf(1200).push()
*/

/* 
const root = "a"
const scale = "min"
d.bpm(140)

d.sample("bd:3").bank("tr909").euclid(3,8).gain(0.75).push()
d.sample("hh:4").bank("tr909").hex("ff").gain(d.rand.range(0.5,0.75).get(8)).pan(0.5).push()
d.sample("cp").bank("tr808").euclid(1,4,2).push()

// d.sample("bd:3").bank("tr909").hex("f").gain(0.75).push()
// d.sample("hh:4").bank("tr909").euclid(5,8).gain(d.rand.range(0.5,0.75).get(8)).pan(0.5).push()
// d.sample("oh:2").bank("tr909").euclid(4,8,1).gain(0.375).pan(0.75).push()
// d.sample("cp").bank("tr808").euclid(2,4,1).gain(0.75).push()
// d.sample("sd:2").bank("tr909").euclid(2,4,1).gain(0.75).push()
  
d.synth("sine","saw").root("c3").scale(scale).note(d.euclid(6,16)).legato()
  .lpf(500).lpenv(3,0,1,0,0.2).postgain(0.5).push()

// d.sample("hh:4").bank("tr909")
//   .apply(d.brand(100,1).get(8)).fast(2)
//   .gain(d.rand.range(0.5,0.75).get(8)).pan(0.5)
//   .push()

d.synth("saw").root(root + 3).scale(scale)
  .note(d.irand([100,88],1).range(0,7).get(8))
  .euclid(8,8).legato().reverb(0.5).pan([-1,1]).delay(0.5, 0.25)
  .adsr(0,1,0,0).lpf(600).lpenv(3,0.25,0.25,0.333,0).push()

d.synth("sq","sine").root(root + 1).scale(scale)
  .note(6,5).euclid(8,8).reverb(0.1)
  .adsr(0,0.5,0.5,0.1).lpf(400).lpenv(2,0,0.5,0.5,0).push()
*/
