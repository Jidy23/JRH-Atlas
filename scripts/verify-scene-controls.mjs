// Verifies that app/scene.tsx only uses three.js APIs that exist in the
// installed three version.
//
// A previous camera fix referenced `controls.listenKeyEvents` and
// `TOUCH.DOLLY_PAN_ROTATE`. Neither exists in three r159, so the viewer
// failed to build, and the only signal was a bare tsc error that did not say
// which runtime was expected.
//
// This script checks the identifiers against the real installed package rather
// than a hardcoded list, so it stays correct if the pinned three version changes.
//
// It also guards the theme contract: three.js paints its own canvas, so the
// 3D background can never come from CSS. A hardcoded setClearColor leaves a
// bright grey rectangle in the middle of the dark UI, which is exactly the bug
// this check now prevents from coming back.
//
// Finally it guards the camera contract. The viewer used to spin on its own and
// let the camera drift overhead, which made the model feel out of control. Those
// are design decisions, not accidents, so they are asserted here instead of
// relying on someone remembering them.
//
// The azimuth rule was inverted once already. An earlier version bounded it to
// +-90 degrees, which quietly removed the back view and forced the "B" button to
// be deleted. That was a regression disguised as a fix: the complaint was never
// "I can rotate too far", it was "it moves by itself" and "it tilts away". So the
// guard now asserts the opposite: horizontal rotation must stay unbounded, and
// the back view must remain reachable.
//
// The theme guard was itself wrong for a long time. It demanded
// `attributeFilter: [...'data-theme'...]`, but app/tema.ts writes `data-tema`
// and `data-palet` (Indonesian, matching tema.css). So the check passed while
// scene.tsx read `dataset.theme` — an attribute nobody ever set. `dark` was
// always false, the 3D canvas stayed light in dark mode, and the
// MutationObserver never fired on a theme switch. axe could not catch it
// because it inspects the DOM, not the canvas pixels. The guard now pins the
// real attribute names and explicitly rejects the invented English ones.
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
  if (!(member in T.MOUSE)) problems.push(`MOUSE has no "${member}" action (available: ${Object.keys(T.MOUSE).join(', ')})`);
}

const cameraMethods = unique([...source.matchAll(/\bcamera\.([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]));
for (const method of cameraMethods) {
  if (!(method in T.PerspectiveCamera.prototype)) problems.push(`PerspectiveCamera has no "${method}" method`);
}

// Theme contract: the canvas colour must be derived from CSS custom properties
// and re-applied when the theme actually changes.
const literalClearColor = /setClearColor\(\s*['"`]/.test(source);
if (literalClearColor) {
  problems.push('setClearColor() is called with a colour literal; read --background so the canvas follows the theme');
}
if (!/getComputedStyle\(\s*document\.documentElement\s*\)/.test(source)) {
  problems.push('scene.tsx does not read CSS custom properties from document.documentElement');
}

// The attribute names are the whole bug: tema.ts writes data-tema / data-palet.
if (/dataset\.(?:theme|palette)\b/.test(source)) {
  problems.push(
    "scene.tsx reads dataset.theme / dataset.palette, but tema.ts writes data-tema / data-palet; " +
      'the canvas would never follow the dark mode',
  );
}
if (!/dataset\.tema\s*===\s*'gelap'/.test(source)) {
  problems.push("scene.tsx does not read documentElement.dataset.tema === 'gelap', so it cannot know the active mode");
}
if (!/attributeFilter:\s*\[[^\]]*'data-tema'/.test(source)) {
  problems.push("scene.tsx does not observe the 'data-tema' attribute, so the canvas will not repaint on theme change");
}
if (!/attributeFilter:\s*\[[^\]]*'data-palet'/.test(source)) {
  problems.push("scene.tsx does not observe the 'data-palet' attribute, so the canvas will not repaint on palette change");
}
if (!/themeObserver\.disconnect\(\)/.test(source)) {
  problems.push('themeObserver is never disconnected in the effect cleanup');
}

// Camera contract 1: no self-rotation. The model must only move when the user
// moves it. Hiding the button while leaving autoRotate wired would be the same
// bug with a smaller surface.
if (/autoRotate\s*=\s*true/.test(source) || /autoRotate\s*=\s*s\./.test(source)) {
  problems.push('scene.tsx re-enables autoRotate; the model must not spin without user input');
}

// Camera contract 2: the vertical axis is locked, so the camera can never rise
// above or drop below the subject.
if (!/controls\.minPolarAngle\s*=\s*POLAR_KUNCI/.test(source) || !/controls\.maxPolarAngle\s*=\s*POLAR_KUNCI/.test(source)) {
  problems.push('scene.tsx does not lock minPolarAngle and maxPolarAngle to the same value, so the camera can drift vertically');
}

// Camera contract 3: horizontal rotation is UNBOUNDED, so the user can spin the
// full 360 degrees. Bounding it again would silently remove the back view.
if (/controls\.(?:min|max)AzimuthAngle\s*=/.test(source)) {
  problems.push('scene.tsx bounds the azimuth angle; horizontal rotation must stay unbounded so the full 360 degrees is reachable');
}

// Camera contract 4: every camera placement must stay on the horizon. A stray
// non-zero Y in a direction vector is what let the camera look down at the model.
const verticalOffsets = [...source.matchAll(/camera\.position\.(?:set|copy)\([^;]*?,\s*([0-9.]+)\s*,/g)]
  .map((m) => m[1])
  .filter((value) => Number(value) !== 0);
if (verticalOffsets.length) {
  problems.push(`scene.tsx places the camera at a non-zero Y (${verticalOffsets.join(', ')}); the camera must stay level with its target`);
}

// Camera contract 5: the back view must actually be wired. Removing the azimuth
// bound is only useful if something still asks for 180 degrees.
if (!/view==='back'\?arah\(180\)/.test(source)) {
  problems.push("scene.tsx never maps view 'back' to arah(180), so the back view is unreachable");
}

if (problems.length) {
  console.error(`app/scene.tsx uses APIs that three@${T.REVISION} does not provide, or breaks the theme/camera contract:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `app/scene.tsx only uses three@${T.REVISION} APIs ` +
    `(${controlProps.length} control props, ${touchMembers.length} touch modes, ` +
    `${mouseMembers.length} mouse actions, ${cameraMethods.length} camera methods checked), ` +
    'keeps the canvas on the CSS theme tokens using the real data-tema / data-palet attributes, ' +
    'holds the camera level while allowing a full 360 degrees of horizontal rotation, ' +
    'and keeps the back view reachable.',
);
