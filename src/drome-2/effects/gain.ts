class GainEffect {
  private node: GainNode;
  public baseGain: number;

  constructor(ctx: AudioContext, initial = 1) {
    this.node = new GainNode(ctx, { gain: initial });
    this.baseGain = initial;
  }
  connect(dest: AudioNode) {
    this.node.connect(dest);
  }
  disconnect() {
    this.node.disconnect();
  }
  reset() {
    this.node.gain.value = this.baseGain;
  }
  get input() {
    return this.node;
  }
  set volume(v: number) {
    this.baseGain = v;
    this.node.gain.value = v;
  }
  get gain() {
    return this.node.gain;
  }
}

export default GainEffect;
