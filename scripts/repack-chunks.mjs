// Repack anatomy chunks so each chunk holds exactly one organ system.
//
// The source BodyParts3D OBJ files are not in this repository, but they are not
// needed: atlas.json stores, for every part, an exact byte range (positions,
// normals, indices) inside an existing chunk. Repacking therefore copies those
// ranges verbatim into new buffers and rewrites only the offsets and chunk ids.
// Geometry, normals and indices are bit-for-bit identical; only packing changes.
import fs from 'node:fs';

const dir = new URL('../public/models/', import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, dir));
const manifest = JSON.parse(read('atlas.json').toString('utf8'));

const sourceBuffers = new Map();
for (const chunk of manifest.chunks) {
  const name = chunk.url.split('/').pop();
  sourceBuffers.set(name, read(name));
}

const groups = new Map();
for (const part of manifest.parts) {
  const list = groups.get(part.system) ?? [];
  list.push(part);
  groups.set(part.system, list);
}

const chunks = [];
const systems = {};
let totalBytes = 0;
let copiedBytes = 0;

for (const [system, parts] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
  const segments = [];
  let bytes = 0;
  const append = (buffer) => {
    const padding = (4 - (bytes % 4)) % 4;
    if (padding) {
      segments.push(Buffer.alloc(padding));
      bytes += padding;
    }
    const offset = bytes;
    segments.push(buffer);
    bytes += buffer.length;
    return offset;
  };

  for (const part of parts) {
    const source = sourceBuffers.get(manifest.chunks[part.chunk].url.split('/').pop());
    const position = Buffer.from(source.subarray(part.positions, part.positions + part.vertexCount * 12));
    const normal = Buffer.from(source.subarray(part.normals, part.normals + part.vertexCount * 6));
    const index = Buffer.from(source.subarray(part.indices, part.indices + part.indexCount * 4));
    if (position.length !== part.vertexCount * 12) throw new Error(`${part.id}: truncated positions`);
    if (normal.length !== part.vertexCount * 6) throw new Error(`${part.id}: truncated normals`);
    if (index.length !== part.indexCount * 4) throw new Error(`${part.id}: truncated indices`);
    copiedBytes += position.length + normal.length + index.length;
    part.positions = append(position);
    part.normals = append(normal);
    part.indices = append(index);
    part.chunk = chunks.length;
  }

  const name = `${system}-0.bin`;
  const payload = Buffer.concat(segments);
  fs.writeFileSync(new URL(name, dir), payload);
  chunks.push({ url: `/models/${name}`, bytes: payload.length });
  systems[system] = { parts: parts.length, bytes: payload.length };
  totalBytes += payload.length;
}

manifest.chunks = chunks;
manifest.repacked = {
  by: 'scripts/repack-chunks.mjs',
  layout: 'one chunk per organ system',
  parts: manifest.parts.length,
  systems: Object.keys(systems).length,
};
fs.writeFileSync(new URL('atlas.json', dir), JSON.stringify(manifest));

// Remove superseded payloads so stale binaries are never deployed.
const kept = new Set(['atlas.json', ...chunks.map((c) => c.url.split('/').pop())]);
for (const entry of fs.readdirSync(dir)) {
  if (!kept.has(entry)) fs.unlinkSync(new URL(entry, dir));
}

console.log(
  JSON.stringify(
    {
      parts: manifest.parts.length,
      systems,
      chunks: chunks.length,
      totalBytes,
      copiedBytes,
      paddingBytes: totalBytes - copiedBytes,
    },
    null,
    2,
  ),
);
