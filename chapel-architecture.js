import * as THREE from './vendor/three.module.js';

// World-space architecture; the north wall is at negative Z.
export function createChapelArchitecture() {
  const root = new THREE.Group();
  root.name = 'chapel-world';
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureCanvas.height = 256;
  const textureContext = textureCanvas.getContext('2d');
  textureContext.fillStyle = '#858585';
  textureContext.fillRect(0, 0, 256, 256);
  // Deterministic variation avoids material changes between reloads.
  let seed = 719;
  for (let i = 0; i < 7000; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const x = seed % 256;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const y = seed % 256;
    textureContext.fillStyle = i % 2 ? 'rgba(30,30,30,.10)' : 'rgba(230,230,230,.10)';
    textureContext.fillRect(x, y, 2, 1);
  }
  const stoneTexture = new THREE.CanvasTexture(textureCanvas);
  stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.repeat.set(2, 2);
  const stone = new THREE.MeshStandardMaterial({ color: 0x555b62, roughness: 0.88, roughnessMap: stoneTexture, bumpMap: stoneTexture, bumpScale: 0.035 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x363d43, roughness: 0.86 });
  const bounds = { halfWidth: 6.65, halfDepth: 6.85, floor: 0, ceiling: 11.5 };
  const wallMeshes = new Map();
  const createWallGeometry = shape => new THREE.ExtrudeGeometry(shape, { depth: 0.65, bevelEnabled: false, curveSegments: 24 });
  const wall = (name, shape, x, z, angle) => {
    const geometry = createWallGeometry(shape);
    const mesh = new THREE.Mesh(geometry, stone);
    mesh.name = name;
    mesh.position.set(x, 0, z);
    mesh.rotation.y = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    wallMeshes.set(name, mesh);
    root.add(mesh);
  };
  const rectangle = (width, height) => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0); shape.lineTo(width / 2, 0);
    shape.lineTo(width / 2, height); shape.lineTo(-width / 2, height); shape.closePath();
    return shape;
  };
  // The round window radius follows the control desk's 70%–265% slider, 234% being the baseline.
  const readOption = key => (typeof window === 'undefined' ? undefined : window[key]);
  const windowRadius = () => 1.65 * THREE.MathUtils.clamp(Number(readOption('__chapelWindowScale')) || 2.34, 0.70, 2.65) / 2.34;
  const northShape = radius => {
    const shape = rectangle(13.3, 10.5);
    const hole = new THREE.Path(); hole.absarc(0, 7.8, radius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
  };
  const SIDE_HOLE = { lancet: 'lancet', round: 'round', flamboyant: 'flamboyant' };
  const sideShape = style => {
    const shape = rectangle(13.7, 10.5);
    for (const x of [-3.8, 0, 3.8]) {
      const hole = new THREE.Path();
      hole.moveTo(x - 0.75, 3);
      if (style === 'round') {
        // Romanesque round arch: straight jambs into a half-round head.
        hole.lineTo(x - 0.75, 6.25);
        hole.quadraticCurveTo(x - 0.75, 7.05, x, 7.05);
        hole.quadraticCurveTo(x + 0.75, 7.05, x + 0.75, 6.25);
      } else if (style === 'flamboyant') {
        // Flamboyant ogee: the head swells then flicks into a taller apex.
        hole.lineTo(x - 0.75, 5.95);
        hole.bezierCurveTo(x - 0.64, 6.75, x - 0.22, 7.35, x, 8.45);
        hole.bezierCurveTo(x + 0.22, 7.35, x + 0.64, 6.75, x + 0.75, 5.95);
      } else {
        // Gothic lancet: two springing curves meeting at a real apex.
        hole.lineTo(x - 0.75, 6.25);
        hole.quadraticCurveTo(x - 0.72, 7.35, x, 8.15);
        hole.quadraticCurveTo(x + 0.72, 7.35, x + 0.75, 6.25);
      }
      hole.lineTo(x + 0.75, 3); hole.closePath();
      shape.holes.push(hole);
    }
    return shape;
  };
  const replaceWall = (name, shape) => {
    const mesh = wallMeshes.get(name);
    if (!mesh) return;
    mesh.geometry.dispose();
    mesh.geometry = createWallGeometry(shape);
  };
  wall('north-wall', northShape(windowRadius()), 0, -6.85, 0);
  wall('south-wall', rectangle(13.3, 10.5), 0, 6.2, 0);
  for (const side of [-1, 1]) {
    // Extrusion runs along positive X after rotation, so the west wall starts outside.
    wall(side < 0 ? 'west-wall' : 'east-wall', sideShape('lancet'), side < 0 ? -7.3 : 6.65, 0, Math.PI / 2);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(13.3, 13.7), floorMaterial);
  floor.name = 'floor'; floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);
  const seams = [];
  for (let x = -6; x <= 6; x += 0.8) seams.push(x, 0.008, -6.5, x, 0.008, 6.5);
  for (let z = -6; z <= 6; z += 0.8) seams.push(-6.4, 0.008, z, 6.4, 0.008, z);
  const seamsGeometry = new THREE.BufferGeometry();
  seamsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(seams, 3));
  const tileSeams = new THREE.LineSegments(seamsGeometry, new THREE.LineBasicMaterial({ color: 0x22292c }));
  tileSeams.name = 'stone-floor-seams'; root.add(tileSeams);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64), new THREE.MeshPhysicalMaterial({ color: 0xe0edff, transmission: 0.96, roughness: 0.06, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
  glass.name = 'north-glass'; glass.position.set(0, 7.8, -6.78); root.add(glass);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.12, 12, 64), stone);
  ring.name = 'circular-window';
  ring.position.set(0, 7.8, -6.7); root.add(ring);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 24), new THREE.MeshBasicMaterial({ color: 0xe5ebfa }));
  moon.name = 'moon-outside-window'; moon.position.set(0.6, 19, -20); root.add(moon);
  // Two curves meet at an apex, preserving the pointed profile of the vault.
  const ribMaterial = new THREE.MeshStandardMaterial({ color: 0x74797b, roughness: 0.86 });
  const arch = new THREE.CurvePath();
  arch.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-6.15, 8.5, 0), new THREE.Vector3(-5.4, 10.6, 0), new THREE.Vector3(0, 11.5, 0)));
  arch.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 11.5, 0), new THREE.Vector3(5.4, 10.6, 0), new THREE.Vector3(6.15, 8.5, 0)));
  const profile = arch.getPoints(48);
  const vaultPositions = [];
  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i], b = profile[i + 1];
    vaultPositions.push(a.x, a.y, -6.85, b.x, b.y, -6.85, a.x, a.y, 6.85,
      b.x, b.y, -6.85, b.x, b.y, 6.85, a.x, a.y, 6.85);
  }
  const vaultGeometry = new THREE.BufferGeometry();
  vaultGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vaultPositions, 3));
  vaultGeometry.computeVertexNormals();
  const vault = new THREE.Mesh(vaultGeometry, new THREE.MeshStandardMaterial({ color: 0x454b50, roughness: 0.9, side: THREE.DoubleSide }));
  vault.name = 'vault'; root.add(vault);
  for (const z of [-5.2, -2.6, 0, 2.6, 5.2]) {
    const rib = new THREE.Mesh(new THREE.TubeGeometry(arch, 48, 0.16, 8, false), ribMaterial);
    rib.position.z = z;
    rib.name = 'vault-rib'; root.add(rib);
    for (const side of [-1, 1]) {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 8.5, 12), ribMaterial);
      column.position.set(side * 6.15, 4.25, z); column.name = 'stone-column'; root.add(column);
    }
  }
  const bars = new THREE.Group(); bars.name = 'rose-tracery'; bars.position.set(0, 7.8, -6.65);
  // Five programmable tracery schemes share one group so the control desk really swaps geometry.
  const buildTracery = (style, radius) => {
    for (const child of [...bars.children]) { child.geometry.dispose(); bars.remove(child); }
    const ratio = radius / 1.65;
    const spoke = (count, length, width) => {
      for (let i = 0; i < count; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(width, length, 0.12), ribMaterial);
        bar.rotation.z = i * Math.PI * 2 / count;
        bars.add(bar);
      }
    };
    const ringMesh = (r, tube) => {
      bars.add(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 48), ribMaterial));
    };
    if (style === 'quatrefoil') {
      for (let i = 0; i < 4; i++) {
        const lobe = new THREE.Mesh(new THREE.TorusGeometry(0.62 * ratio, 0.075, 8, 40), ribMaterial);
        lobe.position.set(Math.cos(i * Math.PI / 2) * 0.78 * ratio, Math.sin(i * Math.PI / 2) * 0.78 * ratio, 0);
        bars.add(lobe);
      }
      ringMesh(1.52 * ratio, 0.06);
    } else if (style === 'radial') {
      spoke(12, 3.0 * ratio, 0.055);
      ringMesh(1.05 * ratio, 0.05);
    } else if (style === 'royal') {
      spoke(8, 3.1 * ratio, 0.06);
      for (const side of [-1, 1]) {
        const petal = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.72 * ratio, 0.1), ribMaterial);
        petal.position.set(side * 0.20 * ratio, 1.15 * ratio, 0);
        petal.rotation.z = side * 0.55;
        bars.add(petal);
      }
      ringMesh(0.42 * ratio, 0.05);
    } else if (style === 'story') {
      // Three tall narrative lights with two transoms.
      for (const x of [-0.62, 0, 0.62]) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.85 * ratio, 0.1), ribMaterial);
        panel.position.x = x * ratio;
        bars.add(panel);
      }
      for (const y of [-0.55, 0.45]) {
        const transom = new THREE.Mesh(new THREE.BoxGeometry(1.86 * ratio, 0.055, 0.1), ribMaterial);
        transom.position.y = y * ratio;
        bars.add(transom);
      }
      ringMesh(1.45 * ratio, 0.055);
    } else {
      spoke(8, 3.1 * ratio, 0.065);
      for (let i = 0; i < 8; i++) {
        const petal = new THREE.Mesh(new THREE.TorusGeometry(0.30 * ratio, 0.045, 6, 24), ribMaterial);
        petal.position.set(Math.cos(i * Math.PI / 4) * 0.82 * ratio, Math.sin(i * Math.PI / 4) * 0.82 * ratio, 0);
        bars.add(petal);
      }
    }
  };
  buildTracery('petals', windowRadius());
  root.add(bars);
  // Four wall torches: switchable from the control desk, no shadow maps to keep phones cheap.
  const torchGroup = new THREE.Group(); torchGroup.name = 'wall-torches';
  const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xffb457 });
  for (const [x, z] of [[-5.4, -5.2], [5.4, -5.2], [-5.4, 5.2], [5.4, 5.2]]) {
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.5, 8), ribMaterial);
    holder.position.set(x, 2.9, z); torchGroup.add(holder);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), flameMaterial);
    flame.scale.y = 1.7; flame.position.set(x, 3.28, z); torchGroup.add(flame);
    const light = new THREE.PointLight(0xff9a4a, 1.2, 4.2, 2);
    light.position.set(x, 3.3, z); torchGroup.add(light);
  }
  torchGroup.visible = readOption('__chapelTorches') !== false;
  root.add(torchGroup);
  const night = new THREE.Group(); night.name = 'night-exterior';
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(36, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0x0b172b, side: THREE.BackSide, fog: false })
  );
  sky.name = 'night-sky';
  night.add(sky);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x202822, roughness: 1 });
  const groundGeometry = new THREE.PlaneGeometry(33.35, 80);
  for (const side of [-1, 1]) {
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.name = side < 0 ? 'west-outside-ground' : 'east-outside-ground';
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(side * (6.65 + 33.35 / 2), -0.08, 0);
    ground.receiveShadow = true;
    night.add(ground);
  }
  const bark = new THREE.MeshStandardMaterial({ color: 0x1a211f, roughness: 1 });
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
    const tree = new THREE.Group(); tree.name = 'bare-tree'; tree.position.set(side * (9 + i % 3), 0, -10 + i * 2.5);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 5, 7), bark); trunk.position.y = 2.5; tree.add(trunk);
    for (const direction of [-1, 1]) { const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 2.2, 6), bark); branch.position.set(direction * 0.7, 4.3, 0); branch.rotation.z = direction * -0.8; tree.add(branch); }
    night.add(tree);
  }
  const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x555442, roughness: 1, side: THREE.DoubleSide });
  const grassGeometry = new THREE.PlaneGeometry(0.15, 0.6);
  const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, 160);
  grass.name = 'outside-grass';
  const transform = new THREE.Object3D();
  for (let i = 0; i < 160; i++) {
    const side = i % 2 ? 1 : -1;
    transform.position.set(side * (7.5 + (i % 11) * 0.3), 0.3, -10 + (i % 40) * 0.5);
    transform.rotation.y = i * 2.4;
    transform.updateMatrix(); grass.setMatrixAt(i, transform.matrix);
  }
  night.add(grass);
  const starPositions = [];
  for (let i = 0; i < 160; i++) {
    const angle = i * 2.39996, height = 8 + (i % 17) * 0.8;
    starPositions.push(Math.cos(angle) * 25, height, Math.sin(angle) * 25);
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xc7d7f0, size: 0.09 }));
  stars.name = 'night-stars'; night.add(stars);
  for (const side of [-1, 1]) {
    const crow = new THREE.Group(); crow.name = 'perched-crow';
    crow.position.set(side * 11, 5.1, -5);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bark);
    body.scale.set(1, 0.8, 1.5); crow.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), bark);
    head.position.set(0, 0.1, 0.2); crow.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 6), bark);
    beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.1, 0.33); crow.add(beak);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), bark);
    tail.rotation.x = -Math.PI / 2; tail.position.z = -0.29; crow.add(tail);
    night.add(crow);
  }
  root.add(night);
  // Glass scheme panes sit inside the three side openings; hidden in the stone schemes.
  const sideGlass = [];
  for (const side of [-1, 1]) for (const z of [-3.8, 0, 3.8]) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 5.1), new THREE.MeshPhysicalMaterial({
      color: 0xcfe3ff, transmission: 0.92, roughness: 0.12, transparent: true, opacity: 0.16, side: THREE.DoubleSide
    }));
    pane.name = 'side-glass';
    pane.rotation.y = Math.PI / 2;
    pane.position.set(side * 6.98, 5.6, z);
    pane.visible = false;
    root.add(pane);
    sideGlass.push(pane);
  }
  // Control-desk options are polled once per frame; each path only rebuilds on change.
  const applied = {
    radius: windowRadius(),
    tracery: 'petals',
    side: 'lancet',
    scheme: 'rose',
    torches: torchGroup.visible
  };
  function applyOptions() {
    const radius = windowRadius();
    const tracery = ['petals', 'quatrefoil', 'radial', 'royal', 'story'].includes(readOption('__chapelTracery')) ? readOption('__chapelTracery') : 'petals';
    const side = ['lancet', 'round', 'flamboyant'].includes(readOption('__chapelSideShape')) ? readOption('__chapelSideShape') : 'lancet';
    const scheme = ['rose', 'glass', 'forest'].includes(readOption('__chapelWindowScheme')) ? readOption('__chapelWindowScheme') : 'rose';
    const lit = readOption('__chapelTorches') !== false;
    let resized = false;
    if (Math.abs(radius - applied.radius) > 1e-4) {
      applied.radius = radius;
      replaceWall('north-wall', northShape(radius));
      glass.scale.setScalar(radius / 1.6);
      ring.scale.setScalar(radius / 1.65);
      resized = true;
    }
    if (resized || tracery !== applied.tracery) {
      applied.tracery = tracery;
      buildTracery(tracery, radius);
    }
    if (side !== applied.side) {
      applied.side = side;
      replaceWall('east-wall', sideShape(side));
      replaceWall('west-wall', sideShape(side));
    }
    if (scheme !== applied.scheme) {
      applied.scheme = scheme;
      const outdoor = scheme !== 'glass';
      for (const obj of night.children) {
        if (obj.name === 'bare-tree' || obj.name === 'outside-grass' || obj.name === 'perched-crow') obj.visible = outdoor;
      }
      for (const pane of sideGlass) pane.visible = !outdoor;
      sky.material.color.setHex(scheme === 'forest' ? 0x06101f : 0x0b172b);
      stars.material.size = scheme === 'forest' ? 0.14 : 0.09;
    }
    if (lit !== applied.torches) {
      applied.torches = lit;
      torchGroup.visible = lit;
    }
  }
  const originalStone = { map: stone.map, normalMap: stone.normalMap, roughnessMap: stone.roughnessMap, bumpMap: stone.bumpMap };
  const originalFloor = { map: floorMaterial.map, normalMap: floorMaterial.normalMap, roughnessMap: floorMaterial.roughnessMap };
  let activeDraft = null;
  let active4k = null;
  let visibility = 1;
  function setStone4k(textures) {
    active4k = textures;
    stone.map = textures?.stoneDiffuse || activeDraft?.stone || originalStone.map;
    stone.normalMap = textures?.stoneNormal || originalStone.normalMap;
    stone.roughnessMap = textures?.stoneRough || originalStone.roughnessMap;
    stone.bumpMap = textures?.stoneNormal ? null : (activeDraft?.stone || originalStone.bumpMap);
    floorMaterial.map = textures?.floorDiffuse || originalFloor.map;
    floorMaterial.normalMap = textures?.floorNormal || originalFloor.normalMap;
    floorMaterial.roughnessMap = textures?.floorRough || originalFloor.roughnessMap;
    stone.needsUpdate = true;
    floorMaterial.needsUpdate = true;
  }
  return {
    root,
    bounds,
    setStone4k,
    applyOptions,
    auditOpenings() {
      root.updateMatrixWorld(true);
      const ray = new THREE.Raycaster();
      const northWall = root.getObjectByName('north-wall');
      const eastWall = root.getObjectByName('east-wall');
      const westWall = root.getObjectByName('west-wall');
      const clear = (wallMesh, origin, direction) => {
        ray.set(origin, direction);
        ray.near = 0;
        ray.far = 3;
        return ray.intersectObject(wallMesh, false).length === 0;
      };
      return {
        north: clear(northWall, new THREE.Vector3(0, 7.8, -5.5), new THREE.Vector3(0, 0, -1)),
        east: [-3.8, 0, 3.8].map(z => clear(eastWall, new THREE.Vector3(5.5, 4.5, z), new THREE.Vector3(1, 0, 0))),
        west: [-3.8, 0, 3.8].map(z => clear(westWall, new THREE.Vector3(-5.5, 4.5, z), new THREE.Vector3(-1, 0, 0)))
      };
    },
    setDraftMaterials(draft) {
      activeDraft = draft;
      setStone4k(active4k);
    },
    setVisibility(value) {
      const level = Number(value);
      if (!Number.isFinite(level)) throw new TypeError('Invalid visibility');
      visibility = THREE.MathUtils.clamp(level, 0, 1);
      root.visible = visibility > 0;
    },
    snapshot() {
      return {
        name: root.name,
        bounds: { ...bounds },
        visibility,
        style: 'intimate-gothic-chapel',
        options: { ...applied },
        traceryParts: bars.children.length,
        sideGlassVisible: sideGlass.some(pane => pane.visible)
      };
    }
  };
}

export const buildChapelArchitecture = createChapelArchitecture;

export function buildFloorOrnaments(baseMaterial){
 const group=new THREE.Group();group.name='floor-design-options';
 const keys=['pentacle','rose','celtic','parquet'];
 for(const key of keys){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1536;const c=canvas.getContext('2d');c.translate(768,768);c.scale(710,710);
  c.fillStyle='#252a2f';c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();c.strokeStyle='#b8b9b2';c.lineWidth=.004;c.lineJoin='round';c.lineCap='round';
  const path=(pts,fill=false)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill)c.fill();c.stroke();};
  const polar=(r,a)=>[r*Math.cos(a),r*Math.sin(a)];
  const ring=r=>{c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();};
  const repeat=(n,fn)=>{for(let i=0;i<n;i++){c.save();c.rotate(i*Math.PI*2/n);fn(i);c.restore();}};
  const petal=(r0,r1,w)=>{c.beginPath();c.moveTo(r0,0);c.bezierCurveTo(r0+w,w,r1-w,w,r1,0);c.bezierCurveTo(r1-w,-w,r0+w,-w,r0,0);c.closePath();c.fill();c.stroke();};
  for(const r of [.96,.985])ring(r);
  repeat(48,i=>{c.fillStyle=i%2?'#4c5155':'#828784';path([polar(.89,-.022),polar(.95,-.022),polar(.95,.022),polar(.89,.022)],true);});
  if(key==='pentacle'){
   // An intentionally joined five-point figure, with secondary motifs restricted to separate fields.
   c.fillStyle='#454e54';path(Array.from({length:10},(_,i)=>polar(i%2?.33:.80,-Math.PI/2+i*Math.PI/5)),true);
   c.lineWidth=.009;path(Array.from({length:5},(_,i)=>polar(.80,-Math.PI/2+i*4*Math.PI/5)));c.lineWidth=.003;
   repeat(5,()=>{c.rotate(-Math.PI/2);c.fillStyle='#6f7879';petal(.82,.88,.018);for(const off of [-.14,.14]){c.save();c.rotate(off);petal(.52,.68,.025);c.restore();}});
   c.fillStyle='#92968b';path(Array.from({length:5},(_,i)=>polar(.19,-Math.PI/2+i*Math.PI*2/5)),true);ring(.105);
  }else if(key==='rose'){
   c.fillStyle='#737d80';repeat(12,()=>petal(.22,.84,.11));c.fillStyle='#404b52';repeat(12,()=>petal(.28,.74,.052));
   ring(.19);c.fillStyle='#929b96';repeat(8,()=>petal(0,.17,.032));repeat(24,()=>{c.rotate(Math.PI/24);path([[.77,0],[.83,.035],[.88,0],[.83,-.035]]);});
  }else if(key==='celtic'){
   // Separate fourfold knot panels; underpasses are cut into the drawing, avoiding stacked glowing strokes.
   repeat(8,()=>{c.translate(.55,0);c.fillStyle='#56666a';path([[0,-.22],[.22,0],[0,.22],[-.22,0]],true);c.lineWidth=.012;for(const k of [-1,1]){c.beginPath();c.ellipse(0,0,.17,.07,k*Math.PI/4,0,Math.PI*2);c.stroke();}c.strokeStyle='#303a40';c.lineWidth=.018;c.beginPath();c.moveTo(-.022,0);c.lineTo(.022,0);c.stroke();c.strokeStyle='#c0c6bd';c.lineWidth=.007;c.beginPath();c.moveTo(-.02,-.02);c.lineTo(.02,.02);c.stroke();c.lineWidth=.004;});
   c.fillStyle='#85918a';repeat(4,()=>petal(0,.23,.045));ring(.255);
  }else{
   // Radial marquetry: contiguous filled tiles from centre to rim, no empty middle.
   for(let band=0;band<4;band++){const r0=band*.21,r1=(band+1)*.21;repeat(16,i=>{const half=Math.PI/16;const pts=[polar(r0,-half),polar((r0+r1)/2,-half*.86),polar(r1,0),polar((r0+r1)/2,half*.86),polar(r0,half)];c.fillStyle=['#485459','#78837e','#39464d','#a0a48e'][(i+band)%4];path(pts,true);});}
   c.fillStyle='#b5b7a0';path(Array.from({length:16},(_,i)=>polar(i%2?.08:.18,i*Math.PI/8)),true);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const material=baseMaterial.clone();material.map=texture;material.emissiveMap=texture;
  const plane=new THREE.Mesh(new THREE.CircleGeometry(3.43,128),material);plane.name=key;plane.rotation.x=-Math.PI/2;plane.position.y=.012;plane.receiveShadow=true;group.add(plane);
 }
 return group;
}
