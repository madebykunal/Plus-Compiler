import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");
const SIZE = 32;
const px = new Uint8Array(SIZE * SIZE * 4);

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : undefined;
};

for (const [tag] of svg.matchAll(/<rect\b[^>]*>/g)) {
  const x = Number(attr(tag, "x") ?? 0);
  const y = Number(attr(tag, "y") ?? 0);
  const w = Number(attr(tag, "width"));
  const h = Number(attr(tag, "height"));
  const hex = (attr(tag, "fill") ?? "#000000").replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      px.set([...rgb, 255], (j * SIZE + i) * 4);
    }
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 6;

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let row = 0; row < SIZE; row++) {
  raw[row * (SIZE * 4 + 1)] = 0;
  Buffer.from(px.buffer, row * SIZE * 4, SIZE * 4).copy(raw, row * (SIZE * 4 + 1) + 1);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);
writeFileSync(new URL("../public/favicon-32.png", import.meta.url), png);
console.log("wrote public/favicon-32.png");
