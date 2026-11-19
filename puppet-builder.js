import * as THREE from './vendor/three.module.js';

const designs = [
  { color: 0x48514e, accent: 0x81786a, garment: 'apron', width: 1.00 },
  { color: 0x4d4b56, accent: 0x756e60, garment: 'work-apron', width: 1.08 },
  { color: 0x5a4b44, accent: 0x71685b, garment: 'shawl', width: 0.94 },
  { color: 0x454e59, accent: 0x655e54, garment: 'long-coat', width: 1.02 },
  { color: 0x5a5146, accent: 0x80746b, garment: 'shoulder-cape', width: 1.06 },
  { color: 0x435149, accent: 0x716856, garment: 'vest', width: 0.96 }
];

export function buildPuppet(index) {
  const seat = ((index % designs.length) + designs.length) % designs.length;
  const design = designs[seat];
  const root = new THREE.Group();
  root.name = `puppet-${index}`;
  root.userData.design = 'parameterized-puppet';
  const cloth = new THREE.MeshStandardMaterial({ color: design.color, roughness: 0.86 });
  const wood = new THREE.MeshStandardMaterial({ color: 0xa18d77, roughness: 0.8 });
  const detail = new THREE.MeshStandardMaterial({ color: design.accent, roughness: 0.82 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x373832, roughness: 0.9 });

  const robe = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.3, 0), new THREE.Vector2(0.28, 0.3),
    new THREE.Vector2(0.23, 0.7), new THREE.Vector2(0.12, 0.85)
  ], 28), cloth);
  robe.name = 'torso';
  robe.scale.x = design.width;
  robe.position.y = 0.62;
  root.add(robe);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), wood);
  head.name = 'expressive-head';
  head.position.y = 1.6;
  root.add(head);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 24), detail);
  collar.name = 'collar';
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.46;
  root.add(collar);

  for (const side of [-1, 1]) {
    const label = side < 0 ? 'left' : 'right';
    const arm = new THREE.Group();
    arm.name = `gesture-${label}`;
    arm.position.set(side * 0.22, 1.3, 0);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), wood);
    shoulder.name = `shoulder-${label}`;
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.22, 6, 12), cloth);
    sleeve.position.set(side * 0.04, -0.14, 0);
    sleeve.rotation.z = side * 0.22;
    const elbow = new THREE.Group();
    elbow.name = `elbow-${label}`;
    elbow.position.set(side * 0.08, -0.29, 0);
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), wood);
    joint.name = `elbow-joint-${label}`;
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.16, 6, 12), cloth);
    forearm.position.y = -0.13;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), wood);
    hand.name = `hand-${label}`;
    hand.position.y = -0.26;
    elbow.add(joint, forearm, hand);
    arm.add(shoulder, sleeve, elbow);
    root.add(arm);

    const leg = new THREE.Group();
    leg.name = `leg-${label}`;
    leg.position.set(side * 0.14, 0.67, 0);
    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), wood);
    hip.name = `hip-${label}`;
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.2, 6, 12), dark);
    thigh.position.set(0, -0.04, -0.17);
    thigh.rotation.x = -Math.PI / 2.5;
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), wood);
    knee.name = `knee-${label}`;
    knee.position.set(0, -0.09, -0.32);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.27, 6, 12), dark);
    shin.position.set(0, -0.29, -0.32);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), dark);
    shoe.name = `shoe-${label}`;
    shoe.scale.set(0.075, 0.055, 0.13);
    shoe.position.set(0, -0.49, -0.37);
    leg.add(hip, thigh, knee, shin, shoe);
    root.add(leg);
  }

  let garment;
  if (seat === 2 || seat === 4) {
    garment = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), detail);
    garment.scale.set(seat === 2 ? 0.29 : 0.33, 0.1, 0.21);
    garment.position.y = 1.37;
  } else {
    const widths = [0.25, 0.27, 0, 0.11, 0, 0.24];
    garment = new THREE.Mesh(new THREE.BoxGeometry(widths[seat], 0.42, 0.025), detail);
    garment.position.set(seat === 3 ? 0.07 : 0, 1.05, -0.235);
  }
  garment.name = design.garment;
  root.add(garment);
  if (seat === 1) {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.16, 24), cloth);
    hat.name = 'work-cap';
    hat.position.y = 1.82;
    root.add(hat);
  }

  let gesture = null;
  const leftArm = root.getObjectByName('gesture-left');
  const rightArm = root.getObjectByName('gesture-right');
  const rightElbow = root.getObjectByName('elbow-right');
  const headRest = head.rotation.clone();
  const leftRest = leftArm.rotation.clone();
  const rightRest = rightArm.rotation.clone();
  const elbowRest = rightElbow.rotation.clone();
  const reset = () => {
    head.rotation.copy(headRest);
    leftArm.rotation.copy(leftRest);
    rightArm.rotation.copy(rightRest);
    rightElbow.rotation.copy(elbowRest);
  };
  root.userData.playGesture = (kind, at = performance.now() / 1000) => {
    if (!['nod', 'shake', 'chuckle', 'wave'].includes(kind)) return false;
    gesture = { kind, start: at, duration: kind === 'chuckle' ? 1.9 : 1.5 };
    return true;
  };
  root.userData.gestureActive = () => !!gesture;
  root.userData.tickRefined = (now = performance.now() / 1000) => {
    reset();
    if (!gesture) return;
    const t = THREE.MathUtils.clamp((now - gesture.start) / gesture.duration, 0, 1);
    if (t >= 1) {
      gesture = null;
      return;
    }
    const envelope = Math.sin(Math.PI * t);
    const wave = Math.sin(4 * Math.PI * t) * envelope;
    if (gesture.kind === 'nod') head.rotation.x += 0.13 * wave;
    if (gesture.kind === 'shake') head.rotation.y += 0.18 * wave;
    if (gesture.kind === 'chuckle') {
      head.rotation.z += 0.08 * envelope;
      rightElbow.rotation.x -= 0.3 * envelope;
    }
    if (gesture.kind === 'wave') {
      rightArm.rotation.z -= 0.35 * envelope;
      rightElbow.rotation.x -= 0.45 * envelope;
    }
  };
  root.userData.animatePose = root.userData.tickRefined;
  root.userData.inspectRefined = () => {
    let meshes = 0;
    let triangles = 0;
    const materials = new Set();
    const textures = new Set();
    root.traverse(object => {
      if (!object.isMesh) return;
      meshes++;
      triangles += (object.geometry.index ? object.geometry.index.count : object.geometry.attributes.position.count) / 3;
      for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
        materials.add(material.uuid);
        for (const key of ['map', 'bumpMap']) if (material[key]) textures.add(material[key].uuid);
      }
    });
    return {
      refined: false, design: root.userData.design, meshes, triangles,
      materials: materials.size, textures: textures.size, activeGesture: gesture?.kind || null,
      head: head.rotation.toArray().slice(0, 3), rightElbow: rightElbow.rotation.toArray().slice(0, 3),
      localHeight: new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y
    };
  };
  root.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  return root;
}
