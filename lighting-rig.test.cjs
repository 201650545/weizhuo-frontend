'use strict';
const assert = require('node:assert/strict');

(async () => {
  const [{ createLightingRig }, THREE] = await Promise.all([
    import('./lighting-rig.js'),
    import('./vendor/three.module.js')
  ]);
  const world = new THREE.Group();
  const table = new THREE.Group();
  world.add(table);
  const { moon, candle } = createLightingRig(world, table);
  world.updateMatrixWorld(true);
  const initialMoon = moon.getWorldPosition(new THREE.Vector3()).clone();
  const initialTarget = moon.target.getWorldPosition(new THREE.Vector3()).clone();
  candle.position.set(1, 1.65, 0);
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 2]) {
    table.rotation.y = angle;
    world.updateMatrixWorld(true);
    assert.ok(moon.getWorldPosition(new THREE.Vector3()).distanceTo(initialMoon) < 1e-9);
    assert.ok(moon.target.getWorldPosition(new THREE.Vector3()).distanceTo(initialTarget) < 1e-9);
    const candleWorld = candle.getWorldPosition(new THREE.Vector3());
    const expected = table.localToWorld(candle.position.clone());
    assert.ok(candleWorld.distanceTo(expected) < 1e-9);
    assert.ok(Math.abs(candleWorld.x - Math.cos(angle)) < 1e-9);
    assert.ok(Math.abs(candleWorld.z + Math.sin(angle)) < 1e-9);
  }
  assert.equal(candle.parent, table);
  assert.equal(candle.decay, 2);
  assert.ok(candle.distance > 0 && candle.distance <= 4);
  assert.equal(moon.castShadow, true);
  console.log('LIGHTING RIG PASS / fixed world moon and target / table candle');
})().catch(error => { console.error(error); process.exitCode = 1; });
