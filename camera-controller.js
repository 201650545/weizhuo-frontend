import * as THREE from './vendor/three.module.js';

export function constrainCamera(position, bounds, margin = 0.45) {
  position.x = THREE.MathUtils.clamp(position.x, -bounds.halfWidth + margin, bounds.halfWidth - margin);
  position.z = THREE.MathUtils.clamp(position.z, -bounds.halfDepth + margin, bounds.halfDepth - margin);
  position.y = THREE.MathUtils.clamp(position.y, 1.1, bounds.ceiling - margin);
  return position;
}

export function dampCamera(position, target, elapsedSeconds, bounds) {
  const blend = 1 - Math.exp(-Math.max(0, elapsedSeconds) * 8);
  position.lerp(target, blend);
  return constrainCamera(position, bounds);
}

export function fieldOfView(baseDegrees, scale) {
  const factor = THREE.MathUtils.clamp(scale, 1, 1.5);
  return THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(baseDegrees) / 2) * factor));
}

// Drag deltas are in radians; zoom is a multiplier where larger values move closer.
export function createCameraController(camera, bounds, options = {}) {
  const presets = {
    firstPerson: { position: [0, 1.65, 4], target: [0, 1.35, 0], fov: 60 },
    overhead: { position: [0, 7, 0.01], target: [0, 0.8, 0], fov: 70 },
    landscape: { position: [0, 3.5, 6], target: [0, 1, 0], fov: 65 },
    ...options.presets
  };
  let mode = 'firstPerson';
  let yaw = 0;
  let pitch = 0;
  let zoom = 1;
  let lookTarget = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const desiredLook = new THREE.Vector3();

  function setMode(nextMode) {
    if (!presets[nextMode]) throw new RangeError(`Unknown camera mode: ${nextMode}`);
    mode = nextMode;
    yaw = 0;
    pitch = 0;
    zoom = 1;
    return controller;
  }

  function drag(deltaYaw, deltaPitch) {
    yaw += deltaYaw;
    pitch = THREE.MathUtils.clamp(pitch + deltaPitch, -1.2, 1.2);
    return controller;
  }

  function setZoom(value) {
    zoom = THREE.MathUtils.clamp(value, 0.5, 2);
    return controller;
  }

  function update(elapsedSeconds) {
    const preset = presets[mode];
    desiredLook.fromArray(preset.target);
    const offset = new THREE.Vector3().fromArray(preset.position).sub(desiredLook);
    if (mode === 'firstPerson') {
      desiredPosition.fromArray(preset.position);
      const direction = offset.negate().normalize();
      const orientation = new THREE.Spherical().setFromVector3(direction);
      orientation.theta += yaw;
      orientation.phi = THREE.MathUtils.clamp(orientation.phi - pitch, 0.05, Math.PI - 0.05);
      desiredLook.copy(desiredPosition).add(direction.setFromSpherical(orientation));
    } else {
      const orbit = new THREE.Spherical().setFromVector3(offset);
      orbit.theta += yaw;
      orbit.phi = THREE.MathUtils.clamp(orbit.phi - pitch, 0.05, Math.PI - 0.05);
      orbit.radius /= zoom;
      desiredPosition.copy(desiredLook).add(offset.setFromSpherical(orbit));
    }
    constrainCamera(desiredPosition, bounds);
    dampCamera(camera.position, desiredPosition, elapsedSeconds, bounds);
    const blend = 1 - Math.exp(-Math.max(0, elapsedSeconds) * 8);
    lookTarget.lerp(desiredLook, blend);
    camera.lookAt(lookTarget);
    const baseFov = mode === 'firstPerson'
      ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(preset.fov) / 2) / zoom))
      : preset.fov;
    camera.fov = fieldOfView(baseFov, options.fovScale ?? 1);
    camera.updateProjectionMatrix();
    return controller;
  }

  const controller = { setMode, drag, setZoom, update, get mode() { return mode; }, get zoom() { return zoom; } };
  lookTarget.fromArray(presets[mode].target);
  return controller;
}
