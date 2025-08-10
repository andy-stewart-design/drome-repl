function rotateArray<T>(arr: T[], amt: number): T[] {
  if (amt === 0) return arr;
  if (arr.length === 0) return [];

  const n = arr.length;
  const actualK = amt % n; // Handle cases where k is larger than n or negative
  const effectiveK = actualK < 0 ? actualK + n : actualK; // Ensure positive k for consistent calculation
  const rotatedArray: T[] = new Array(n);

  for (let i = 0; i < n; i++) {
    // Calculate the new index for each element
    const newIndex = (i + effectiveK) % n;
    rotatedArray[newIndex] = arr[i];
  }

  return rotatedArray;
}

export { rotateArray };
