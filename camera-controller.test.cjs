'use strict';
const assert = require('node:assert/strict');

(async () => {
  const [controllerModule, THREE] = await Promise.all([
    import('./camera-controller.js'), import('./vendor/three.module.js')
  ]);
  const { createCameraController, constrainCamera, dampCamera, fieldOfView } = controllerModule;
  const bounds = { halfWidth: 6, halfDepth: 7, ceiling: 9 };
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(0, 2, 3);
  const controller = createCameraController(camera, bounds);
  for (const mode of ['firstPerson', 'overhead', 'landscape']) {
    controller.setMode(mode);
    for (let i = 0; i < 120; i++) controller.drag(0.1, 0.02).update(1 / 60);
    controller.setZoom(10).update(1 / 60);
    assert.equal(controller.zoom, 2);
    controller.setZoom(0.01).update(1 / 60);
    assert.equal(controller.zoom, 0.5);
    assert.ok(Math.abs(camera.position.x) <= 5.55 && Math.abs(camera.position.z) <= 6.55);
    assert.ok(camera.position.y >= 1.1 && camera.position.y <= 8.55);
    assert.ok(Number.isFinite(camera.fov));
  }
  assert.throws(() => controller.setMode('unknown'), RangeError);
  const position = new THREE.Vector3(50, -2, -50);
  constrainCamera(position, bounds);
  assert.deepEqual(position.toArray(), [5.55, 1.1, -6.55]);
  const a = new THREE.Vector3(0, 2, 0), b = a.clone(), target = new THREE.Vector3(4, 3, 4);
  dampCamera(a, target, 1, bounds);
  for (let i = 0; i < 60; i++) dampCamera(b, target, 1 / 60, bounds);
  assert.ok(a.distanceTo(b) < 1e-10);
  assert.ok(fieldOfView(60, 1.5) > fieldOfView(60, 1));
  console.log('CAMERA CONTROLLER PASS / modes / drag / zoom / bounds / damping / FOV');
})().catch(error => { console.error(error); process.exitCode = 1; });
