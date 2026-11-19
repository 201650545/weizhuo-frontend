'use strict';
const assert = require('node:assert/strict');

global.document = {
  createElement() {
    return { getContext() { return { fillRect() {}, set fillStyle(value) {} }; } };
  }
};

(async () => {
  const [{ createChapelArchitecture }, THREE] = await Promise.all([
    import('./chapel-architecture.js'), import('./vendor/three.module.js')
  ]);
  const chapel = createChapelArchitecture();
  assert.deepEqual(chapel.auditOpenings(), {
    north: true, east: [true, true, true], west: [true, true, true]
  });
  chapel.root.updateMatrixWorld(true);
  const solidSamples = [
    ['north-wall', [3, 4, -5.5], [0, 0, -1]],
    ['east-wall', [5.5, 4, 2], [1, 0, 0]],
    ['west-wall', [-5.5, 4, 2], [-1, 0, 0]]
  ];
  for (const [name, origin, direction] of solidSamples) {
    const wall = chapel.root.getObjectByName(name);
    assert.ok(wall, `${name} exists`);
    const ray = new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction), 0, 3);
    assert.ok(ray.intersectObject(wall, false).length, `${name} solid sample`);
  }
  for (const name of ['north-wall', 'south-wall', 'west-wall', 'east-wall']) {
    const wall = chapel.root.getObjectByName(name);
    wall.geometry.computeBoundingBox();
    assert.ok(wall.geometry.boundingBox.max.z - wall.geometry.boundingBox.min.z >= 0.6, `${name} thickness`);
  }
  const west = new THREE.Box3().setFromObject(chapel.root.getObjectByName('west-wall'));
  assert.ok(west.max.x <= -6.64 && west.min.x < -7.29, 'west wall extrudes outward');
  const glass = chapel.root.getObjectByName('north-glass');
  assert.ok(glass.material.transparent && glass.material.transmission > 0, 'transparent north glass');
  const tracery = chapel.root.getObjectByName('rose-tracery');
  assert.ok(tracery.children.filter(child => child.geometry?.type === 'BoxGeometry').length >= 8, 'eight radial spokes');
  assert.ok(chapel.root.getObjectByName('wall-torches'), 'wall torches group');
  assert.ok(chapel.root.getObjectByName('vault'));
  const ribs = [], trees = [], crows = [];
  chapel.root.traverse(object => {
    if (object.name === 'vault-rib') ribs.push(object);
    if (object.name === 'bare-tree') trees.push(object);
    if (object.name === 'perched-crow') crows.push(object);
  });
  assert.equal(ribs.length, 5);
  const ribPath = ribs[0].geometry.parameters.path;
  assert.equal(ribPath.curves.length, 2);
  assert.equal(ribPath.curves[0].v2.y, 11.5);
  assert.equal(trees.length, 18);
  assert.equal(crows.length, 2);
  assert.ok(crows.every(crow => crow.children.length >= 4));
  for (const name of ['moon-outside-window', 'night-stars', 'west-outside-ground', 'east-outside-ground', 'outside-grass']) {
    assert.ok(chapel.root.getObjectByName(name), `${name} exists`);
  }
  const stone = chapel.root.getObjectByName('north-wall').material;
  const originalBump = stone.bumpMap;
  const draft = new THREE.Texture();
  const highResolution = new THREE.Texture();
  chapel.setDraftMaterials({ stone: draft });
  assert.equal(stone.map, draft);
  assert.equal(stone.bumpMap, draft);
  chapel.setStone4k({ stoneDiffuse: highResolution });
  assert.equal(stone.map, highResolution);
  chapel.setStone4k(null);
  assert.equal(stone.map, draft);
  assert.equal(stone.bumpMap, draft);
  chapel.setDraftMaterials(null);
  assert.equal(stone.bumpMap, originalBump);
  console.log('CHAPEL GEOMETRY PASS / seven openings / three solid wall samples / material restore');
})().catch(error => { console.error(error); process.exitCode = 1; });
