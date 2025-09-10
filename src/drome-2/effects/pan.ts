class PanEffect {
  private node: StereoPannerNode;

  constructor(ctx: AudioContext, initial = 0) {
    this.node = new StereoPannerNode(ctx, { pan: initial });
  }
  connect(dest: AudioNode) {
    this.node.connect(dest);
  }
  disconnect() {
    this.node.disconnect();
  }
  get input() {
    return this.node;
  }
  set pan(v: number) {
    this.node.pan.value = v;
  }
}

export default PanEffect;
