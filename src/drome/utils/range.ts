function range(
  start: number,
  end?: number,
  stepOrIncl: number | boolean = 1
): number[] {
  const actualStart = end === undefined ? 0 : start;
  let actualEnd = end === undefined ? start : end;
  const step = typeof stepOrIncl === "number" ? stepOrIncl : 1;
  const inclusive = typeof stepOrIncl === "boolean" ? stepOrIncl : false;
  if (inclusive) actualEnd++;

  const length = Math.ceil(Math.abs((actualEnd - actualStart) / step));
  const direction = actualStart < actualEnd ? 1 : -1;

  return Array.from({ length }, (_, i) => actualStart + i * step * direction);
}

export { range };
