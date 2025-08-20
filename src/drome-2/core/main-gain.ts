class MainGain {
  private node: GainNode;

  constructor(ctx: AudioContext, initial = 0.5) {
    this.node = new GainNode(ctx, { gain: initial });
  }
  connect(dest: AudioNode) {
    this.node.connect(dest);
  }
  get input() {
    return this.node;
  }
  set volume(v: number) {
    this.node.gain.value = v;
  }
}

export default MainGain;
