// Asserts that chunk packing actually matches organ systems, and that both the
// raw and gzip payloads the viewer can pick between really exist.
// Fails when a chunk mixes systems, because visibility-driven loading can then
// only skip a chunk whose parts are ALL hidden, which is the whole point.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const dir = new URL('../public/models/', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('atlas.json', dir), 'utf8'));
const DEFAULT_VISIBLE = ['skeletal', 'muscular', 'cardiac', 'sensory', 'digestive', 'respiratory', 'urinary'];

const systemsByChunk = manifest.chunks.map(() => new Set());
for (const part of manifest.parts) systemsByChunk[part.chunk]?.add(part.system);

const mixed = systemsByChunk
  .map((systems, index) => ({ chunk: index, systems: [...systems] }))
  .filter((entry) => entry.systems.length > 1);

const allSystems = [...new Set(manifest.parts.map((p) => p.system))];
const neededFor = (visible) => {
  const needed = new Set();
  for (const part of manifest.parts) if (visible.includes(part.system)) needed.add(part.chunk);
  return [...needed].sort((a, b) => a - b);
};

const defaultNeeded = neededFor(DEFAULT_VISIBLE);
const allNeeded = neededFor(allSystems);

// Every chunk must ship both payloads: the viewer uses .gz when it can and the
// raw file otherwise. A missing half only shows up as a 404 for a system that
// starts hidden and is revealed later, which no default-visibility test catches.
const missing = [];
for (const chunk of manifest.chunks) {
  for (const url of [chunk.url, chunk.gzip]) {
    const name = url?.split('/').pop();
    if (!name) {
      missing.push({ chunk: chunk.url, missing: url ?? 'gzip field' });
      continue;
    }
    if (!fs.existsSync(new URL(name, dir))) missing.push({ chunk: chunk.url, missing: name });
  }
  const size = fs.statSync(new URL(chunk.url.split('/').pop(), dir)).size;
  if (size !== chunk.bytes) missing.push({ chunk: chunk.url, missing: `size ${size} != manifest ${chunk.bytes}` });
}

const defaultBytes = defaultNeeded.reduce((n, ci) => n + (manifest.chunks[ci].gzipBytes ?? 0), 0);
const allBytes = allNeeded.reduce((n, ci) => n + (manifest.chunks[ci].gzipBytes ?? 0), 0);
const report = {
  chunks: manifest.chunks.length,
  parts: manifest.parts.length,
  systems: allSystems.length,
  defaultVisible: DEFAULT_VISIBLE.length,
  defaultNeeded: defaultNeeded.length,
  allNeeded: allNeeded.length,
  mixedChunks: mixed,
  missing,
  savedChunks: allNeeded.length - defaultNeeded.length,
  savedGzipBytes: allBytes - defaultBytes,
  savedGzipPercent: allBytes ? +(((allBytes - defaultBytes) / allBytes) * 100).toFixed(1) : 0,
};
console.log(JSON.stringify(report, null, 2));

assert.deepEqual(mixed, [], 'Every chunk must belong to a single organ system');
assert.deepEqual(missing, [], 'Every chunk must ship raw and gzip payloads matching the manifest');
assert.ok(
  report.defaultNeeded < report.allNeeded,
  `Default visibility must need fewer chunks than the full atlas (${report.defaultNeeded} vs ${report.allNeeded})`,
);
assert.equal(report.defaultNeeded, Math.min(DEFAULT_VISIBLE.length, manifest.chunks.length));
