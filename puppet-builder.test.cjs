'use strict';
const assert = require('node:assert/strict');

(async () => {
  const { buildPuppet } = await import('./puppet-builder.js');
  const garments = ['apron', 'work-apron', 'shawl', 'long-coat', 'shoulder-cape', 'vest'];
  const colors = new Set();
  for (let seat = 0; seat < 6; seat++) {
    const puppet = buildPuppet(seat);
    assert.ok(puppet.getObjectByName(garments[seat]));
    colors.add(puppet.getObjectByName('torso').material.color.getHex());
    for (const name of ['expressive-head', 'gesture-left', 'gesture-right', 'shoulder-left', 'shoulder-right', 'elbow-joint-left', 'elbow-joint-right', 'hip-left', 'hip-right', 'knee-left', 'knee-right']) {
      assert.ok(puppet.getObjectByName(name), `seat ${seat}: ${name}`);
    }
    const head = puppet.getObjectByName('expressive-head');
    const arm = puppet.getObjectByName('gesture-right');
    const elbow = puppet.getObjectByName('elbow-right');
    const rest = [head.rotation.toArray(), arm.rotation.toArray(), elbow.rotation.toArray()];
    for (const kind of ['nod', 'shake', 'wave', 'chuckle']) {
      const duration = kind === 'chuckle' ? 1.9 : 1.5;
      assert.equal(puppet.userData.playGesture(kind, 10), true);
      assert.equal(puppet.userData.gestureActive(), true);
      puppet.userData.tickRefined(10 + duration * 0.125);
      assert.equal(puppet.userData.inspectRefined().activeGesture, kind);
      assert.notDeepEqual([head.rotation.toArray(), arm.rotation.toArray(), elbow.rotation.toArray()], rest);
      puppet.userData.tickRefined(10 + duration);
      assert.equal(puppet.userData.gestureActive(), false);
      assert.deepEqual([head.rotation.toArray(), arm.rotation.toArray(), elbow.rotation.toArray()], rest);
      assert.equal(puppet.userData.inspectRefined().activeGesture, null);
    }
    assert.equal(puppet.userData.playGesture('wave', 20), true);
    assert.equal(puppet.userData.playGesture('invalid', 20), false);
    assert.equal(puppet.userData.inspectRefined().activeGesture, 'wave');
    assert.equal(puppet.userData.playGesture('nod', 20), true);
    assert.equal(puppet.userData.inspectRefined().activeGesture, 'nod');
    puppet.userData.tickRefined(22);
    assert.deepEqual([head.rotation.toArray(), arm.rotation.toArray(), elbow.rotation.toArray()], rest);
    const inspection = puppet.userData.inspectRefined();
    assert.equal(inspection.design, 'parameterized-puppet');
    assert.ok(inspection.meshes > 0 && inspection.triangles > 0 && inspection.localHeight > 0);
  }
  assert.equal(colors.size, 6);
  console.log('PUPPET PASS / six garments and colors / articulated joints / four gesture lifecycles / replacement and invalid action');
})().catch(error => { console.error(error); process.exitCode = 1; });
