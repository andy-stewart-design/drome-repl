const types = {
  sawtooth: (n: number) => [0, -1 / n],
  square: (n: number) => [0, n % 2 === 0 ? 0 : 1 / n],
  triangle: (n: number) => [n % 2 === 0 ? 0 : 1 / (n * n), 0],
};

type WaveformType = keyof typeof types;

function createPeriodicWave(
  ctx: AudioContext,
  type: WaveformType,
  partials: number
) {
  const real = new Float32Array(partials + 1);
  const imag = new Float32Array(partials + 1);

  real[0] = 0; // dc offset
  imag[0] = 0;
  let n = 1;
  while (n <= partials) {
    const [r, i] = types[type](n);
    real[n] = r;
    imag[n] = i;
    n++;
  }

  return ctx.createPeriodicWave(real, imag);
}

export { createPeriodicWave };
