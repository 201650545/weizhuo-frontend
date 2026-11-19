import * as THREE from './vendor/three.module.js';

// Lights remain owned by the coordinate space in which they are mounted.
export function createLightingRig(world, tableGroup) {
  const moon = new THREE.DirectionalLight(0xb9cfe9, 2.1);
  moon.name = 'north-moonlight';
  moon.position.set(0, 9, -6);
  moon.target.position.set(0, 1, 3);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -7;
  moon.shadow.camera.right = 7;
  moon.shadow.camera.top = 7;
  moon.shadow.camera.bottom = -7;
  moon.shadow.bias = -0.0001;
  moon.shadow.normalBias = 0.02;
  moon.shadow.radius = 3;
  world.add(moon, moon.target);
  world.add(new THREE.HemisphereLight(0x8195ad, 0x17120d, 0.38));
  const candle = new THREE.PointLight(0xffc27e, 5, 3.2, 2);
  candle.name = 'table-candle-light';
  candle.position.set(0, 1.65, 0);
  tableGroup.add(candle);
  return { moon, candle };
}
