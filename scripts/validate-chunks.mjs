// Asserts that chunk packing actually matches organ systems.
// Fails when a chunk mixes systems, because visibility-driven loading can then
// only skip a chunk whose parts are ALL hidden, which is the whole point.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const manifest = JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8'));
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
const report = {
  chunks: manifest.chunks.length,
  parts: manifest.parts.length,
  systems: allSystems.length,
  defaultVisible: DEFAULT_VISIBLE.length,
  defaultNeeded: defaultNeeded.length,
  allNeeded: allNeeded.length,
  mixedChunks: mixed,
  savedChunks: allNeeded.length - defaultNeeded.length,
};
console.log(JSON.stringify(report, null, 2));

assert.deepEqual(mixed, [], 'Every chunk must belong to a single organ system');
assert.ok(
  report.defaultNeeded < report.allNeeded,
  `Default visibility must need fewer chunks than the full atlas (${report.defaultNeeded} vs ${report.allNeeded})`,
);
assert.equal(report.defaultNeeded, Math.min(DEFAULT_VISIBLE.length, manifest.chunks.length));
