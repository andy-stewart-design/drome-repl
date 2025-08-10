function hex(hexNotation: string | number) {
  return hexNotation.toString().split("").flatMap(hexToPattern);
}

function hexToPattern(hexValue: string) {
  const bin = parseInt(hexValue, 16).toString(2).padStart(4, "0");
  return bin.split("").map((b) => parseInt(b));
}

export { hex };
