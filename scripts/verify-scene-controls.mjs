// Verifies that app/scene.tsx only uses three.js APIs that exist in the
// installed three version.
//
// A previous camera fix referenced `controls.listenKeyEvents` and
// `TOUCH.DOLLY_PAN_ROTATE`. Neither exists in three r159, so the viewer
// failed to build, and the only signal was a bare tsc error that did not say
// which runtime was expected.
//
// This script checks the identifiers against the real installed package
// rather than a hardcoded list, so it stays correct if the pinned three
// version changes.
//
// Usage: node scripts/verify-scene-controls.mjs
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

const scenePath = 'app/scene.tsx';
const source = readFileSync(scenePath, 'utf8');
const problems = [];

// OrbitControls assigns its API on the instance in the constructor, so build
// one against a minimal DOM stub instead of guessing the property list.
const stub = {
  style: {},
  addEventListener() {},
  removeEventListener() {},
  setPointerCapture() {},
  releasePointerCapture() {},
};
const controls = new OrbitControls(new T.PerspectiveCamera(), stub);

const unique = (values) => [...new Set(values)];

const controlProps = unique([...source.matchAll(/\bcontrols\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
for (const prop of controlProps) {
  if (!(prop in controls)) problems.push(`OrbitControls has no "${prop}" property`);
}

const touchMembers = unique([...source.matchAll(/\bT\.TOUCH\.([A-Z_]+)/g)].map((m) => m[1]));
for (const member of touchMembers) {
  if (!(member in T.TOUCH)) problems.push(`TOUCH has no "${member}" member (available: ${Object.keys(T.TOUCH).join(', ')})`);
}

const mouseMembers = unique([...source.matchAll(/\bT\.MOUSE\.([A-Z_]+)/g)].map((m) => m[1]));
for (const member of mouseMembers) {
  if (!(member in T.MOUSE)) problems.push(`MOUSE has no "${member}" member (available: ${Object.keys(T.MOUSE).join(', ')})`);
}

const cameraMethods = unique([...source.matchAll(/\bcamera\.([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]));
for (const method of cameraMethods) {
  if (!(method in T.PerspectiveCamera.prototype)) problems.push(`PerspectiveCamera has no "${method}" method`);
}

if (problems.length) {
  console.error(`app/scene.tsx uses APIs that three@${T.REVISION} does not provide:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `app/scene.tsx only uses three@${T.REVISION} APIs ` +
    `(${controlProps.length} control props, ${touchMembers.length} touch modes, ` +
    `${mouseMembers.length} mouse actions, ${cameraMethods.length} camera methods checked).`,
);
