// Original high-ceiling paper-factory meeting room. Decorative architecture, not story evidence.
import * as THREE from './vendor/three.module.js';
export function buildFactoryRoom(){
 const root=new THREE.Group();root.name='factory-meeting-room';const materials=[];
 const bounds={halfWidth:6.6,halfDepth:6.6,floor:0,ceiling:8.5};
 function mat(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:.96,...extra});materials.push(m);return m;}
 function grain(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#b6baba';x.fillRect(0,0,128,128);for(let i=0;i<1600;i++){const v=150+(i*43%65);x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(i*37%128,i*61%128,1,1);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(5,3);return t;}
 const plaster=grain(),wall=mat(0x796b5a,{map:plaster}),upper=mat(0xc1b399,{map:plaster}),oak=mat(0x5a3329),iron=mat(0x755c38),paper=mat(0xd6c7a2),glass=mat(0x718b9c,{emissive:0x2a4659,emissiveIntensity:.45}),floorMat=mat(0x807769,{map:plaster}),ceilingMat=mat(0x887b68);
 function box(name,w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.name=name;o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;root.add(o);return o;}
 // Closed, opaque shell. Neither wall culling nor cutaway planes are used.
 box('room-floor',13.4,.10,13.4,floorMat,0,-.08,0);
 box('sealed-ceiling',13.4,.16,13.4,ceilingMat,0,8.58,0);
 for(let i=-10;i<=10;i++)box('concrete-floor-joint',.009,.002,13.2,oak,i*.62,-.028,0);
 for(const axis of ['x','z'])for(const side of [-1,1]){
  const x=axis==='x'?side*6.68:0,z=axis==='z'?side*6.68:0,w=axis==='x'?.16:13.52,d=axis==='z'?.16:13.52;
  box('solid-green-wall',w,2.2,d,wall,x,1.1,z);if(axis==='z'&&side===-1){const shape=new THREE.Shape();shape.moveTo(-6.76,2.2);shape.lineTo(6.76,2.2);shape.lineTo(6.76,8.5);shape.lineTo(-6.76,8.5);shape.closePath();const hole=new THREE.Path();hole.absarc(-1.2,5.05,2.35,0,Math.PI*2,true);shape.holes.push(hole);const facade=new THREE.Mesh(new THREE.ShapeGeometry(shape,64),upper);facade.name='window-wall-with-opening';facade.position.z=-6.68;root.add(facade);}else box('solid-upper-wall',w,6.3,d,upper,x,5.35,z);
  box('wall-dado-rail',axis==='x'?.21:13.2,.08,axis==='z'?.21:13.2,oak,x,2.18,z);
  box('wall-skirting',axis==='x'?.21:13.2,.16,axis==='z'?.21:13.2,oak,x,.06,z);
 }
 for(const x of [-6.49,6.49])for(const z of [-6.49,6.49])box('structural-corner-column',.22,8.5,.22,iron,x,4.25,z);
 for(const z of [-4.3,0,4.3])box('roof-crossbeam',13.15,.25,.19,iron,0,8.15,z);
 // Windows, closed door and storage sit against the far interior wall, on the same floor.
 // A luminous rose window, with a crescent visible against a deep-blue night sky.
  const sky=mat(0x20334d,{emissive:0x223c5d,emissiveIntensity:.7}),gold=mat(0xc6a66b,{metalness:.5,roughness:.5}),moon=mat(0xffe9b3,{emissive:0xffd58d,emissiveIntensity:1.5});
  function disc(name,r,m,x,y,z){const o=new THREE.Mesh(new THREE.CircleGeometry(r,64),m);o.name=name;o.position.set(x,y,z);root.add(o);return o;}
  box('night-sky-outside',45,30,.1,sky,0,8,-20);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.35,.11,12,80),gold);ring.name='rose-window-frame';ring.position.set(-1.2,5.05,-6.36);root.add(ring);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,petal=disc('stained-glass-petal',.43,mat([0x357b8e,0xa7524d,0x997546,0x536e87][i%4],{emissive:0x324354,emissiveIntensity:.4}),-1.2+1.66*Math.cos(a),5.05+1.66*Math.sin(a),-6.39);}
  disc('crescent-moon',.9,moon,1.0,7.0,-19.7);disc('crescent-shadow',.82,sky,1.42,7.24,-19.6);
  const windowLight=new THREE.PointLight(0xc2d9ff,12,15,2);windowLight.name='moonlight-through-rose-window';windowLight.position.set(-1.2,5,-5.8);root.add(windowLight);
  const moonWash=new THREE.AmbientLight(0xa5b7d3,.12);moonWash.name='moonlit-room-fill';root.add(moonWash);
 box('closed-room-door',1.12,2.35,.10,oak,3.35,1.175,-6.52);box('door-inset',.87,1.70,.03,mat(0x485759),3.35,1.27,-6.45);box('door-handle',.15,.035,.06,paper,3.69,1.08,-6.41);
 // Stone piers and pointed arch ribs frame the rose window.
  const stone=mat(0xaea18a),rib=mat(0xd4c2a2);
  for(const x of [-5.9,5.9])box('stone-pier',.40,7.4,.40,stone,x,3.7,-6.3);
  function beamBetween(name,a,b,width,material){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p),o=new THREE.Mesh(new THREE.BoxGeometry(width,d.length(),width),material);o.name=name;o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());root.add(o);return o;}
  beamBetween('pointed-arch-left',[-5.9,5.3,-6.27],[0,8.2,-6.27],.18,rib);beamBetween('pointed-arch-right',[5.9,5.3,-6.27],[0,8.2,-6.27],.18,rib);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(5.0,48,24,0,Math.PI*2,0,Math.PI/2),mat(0x8b8c9d,{side:THREE.BackSide,emissive:0x34354d,emissiveIntensity:.22}));dome.name='painted-vault';dome.position.set(0,6.0,0);dome.scale.y=.49;root.add(dome);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;beamBetween('vault-rib',[4.7*Math.cos(a),6.05,4.7*Math.sin(a)],[0,8.40,0],.12,rib);}
  const stainedColors=[0x5b86bf,0xbd5f6c,0xd8aa64,0x72ad98];for(let i=0;i<4;i++){const pool=new THREE.Mesh(new THREE.CircleGeometry(.8,32),new THREE.MeshBasicMaterial({color:stainedColors[i],transparent:true,opacity:.13,depthWrite:false}));pool.name='stained-light-on-floor';pool.rotation.x=-Math.PI/2;pool.position.set(-3+i*.85,-.015,-4+i*.5);root.add(pool);const light=new THREE.PointLight(stainedColors[i],4,5,2);light.position.set(-2.5+i*.8,2.3,-5);root.add(light);}
  box('archive-cabinet',1.02,1.88,.56,iron,-4.60,.94,-5.66);
 for(let i=0;i<4;i++){box('cabinet-drawer',.92,.40,.035,mat(0x49595c),-4.60,.27+i*.44,-5.35);box('cabinet-pull',.16,.026,.045,paper,-4.60,.33+i*.44,-5.31);}
 box('side-storage-bench',1.65,.09,.62,oak,4.55,.73,-3.60);for(const x of [3.86,5.24])box('bench-leg',.09,.69,.47,oak,x,.345,-3.60);
 for(let i=0;i<3;i++){const roll=new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.72,20),paper);roll.name='blank-paper-roll';roll.position.set(4.08+i*.47,1.14,-3.60);root.add(roll);}
 box('blank-notice-board',1.52,1.06,.06,oak,.7,2.8,-6.52);for(let i=0;i<3;i++)box('unreadable-decor-paper',.29,.43,.02,paper,.25+i*.42,2.8,-6.47);
 const pipe=mat(0x5e7279);for(const x of [-5.85,5.85])box('exposed-conduit',.06,7.8,.06,pipe,x,3.9,-6.46);
 // Suspended old-white fluorescent fixture: stable light, no horror flashes/jump scares.
 box('lamp-cable',.018,4.4,.018,iron,0,6.25,-3.2);box('fluorescent-housing',1.5,.12,.35,iron,0,4.01,-3.2);
 const glow=mat(0xc8dbe1,{emissive:0xb7d2df,emissiveIntensity:1.1});box('fluorescent-diffuser',1.37,.035,.27,glow,0,3.935,-3.2);
 let level=1;
 return {root,materials,bounds,setVisibility(value){level=THREE.MathUtils.clamp(value,0,1);root.visible=true;for(const m of materials){m.transparent=false;m.opacity=1;m.depthWrite=true;if(!m.userData.originalColor)m.userData.originalColor=m.color.clone();m.color.copy(m.userData.originalColor).multiplyScalar(.25+.75*level);}},snapshot(){return {name:root.name,visibility:level,decorations:root.children.length,enclosedWalls:4,roof:'solid high ceiling',bounds:{...bounds},palette:'cold-grey-green / old-white light',cutaway:false};}};
}
