export type LineMap = [number, number, number][][];

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function decodeMappings(mappings: string): LineMap {
  let sourceLine = 0;
  let sourceColumn = 0;
  return mappings.split(";").map((line) => {
    let column = 0;
    const segments: [number, number, number][] = [];
    for (const segment of line.split(",")) {
      if (!segment) continue;
      const fields = decodeVlq(segment);
      column += fields[0];
      if (fields.length < 4) continue;
      sourceLine += fields[2];
      sourceColumn += fields[3];
      segments.push([column, sourceLine, sourceColumn]);
    }
    return segments;
  });
}

function decodeVlq(segment: string): number[] {
  const values: number[] = [];
  let value = 0;
  let shift = 0;
  for (const char of segment) {
    const digit = BASE64.indexOf(char);
    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
    } else {
      values.push(value & 1 ? -(value >>> 1) : value >>> 1);
      value = 0;
      shift = 0;
    }
  }
  return values;
}
