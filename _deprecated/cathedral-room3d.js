import { createTracery } from './window-tracery.js';
import { buildSideWindows } from './chapel-side-windows.js';
import { applyDraftSurface } from './chapel-draft-materials.js';
import { makeMoonShaft,makeNightGround,makeStoneReveal,makeFlagstoneMap } from './chapel-night-study.js';
// Intimate chapel. Metres, y up; north is -Z (window), south is +Z.
// Architecture, candle fixtures and the moon shaft stay in room space.
import * as THREE from './vendor/three.module.js';

export function buildCathedralRoom(){
 const root=new THREE.Group();root.name='cathedral-room';
 const materials=[],lights=[];
 const bounds={halfWidth:6.65,halfDepth:6.85,floor:0,ceiling:11.5};
 const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.92,...extra});materials.push(m);return m;};
 let seed=719;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 function stoneMap(){
  const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');
  x.fillStyle='#343a40';x.fillRect(0,0,1024,512);
  for(let row=0;row<8;row++)for(let col=-1;col<9;col++){
   const px=col*128+(row%2)*64,py=row*64,v=105+random()*26;
   x.fillStyle=`rgb(${v},${v+2},${v+4})`;x.fillRect(px+2,py+2,124,60);
   x.strokeStyle='rgba(226,221,201,.16)';x.strokeRect(px+4,py+4,120,56);
   for(let i=0;i<85;i++){const b=random()>.5?220:30;x.fillStyle=`rgba(${b},${b},${b},.07)`;x.fillRect(px+random()*124,py+random()*60,random()*8+1,1+random()*2);}
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2.2,1.7);t.colorSpace=THREE.SRGBColorSpace;return t;
 }
 const texture=stoneMap(),stone=mat(0x85888a,{map:texture,bumpMap:texture,bumpScale:.045});
  stone.color.setHex(0x7a818b);stone.emissive.setHex(0x718197);stone.emissiveMap=texture;stone.emissiveIntensity=.075;

 const trim=mat(0x757c83),dark=mat(0x242b34),iron=mat(0x252b31,{metalness:.65,roughness:.6});
 trim.emissive.setHex(0x52657d);trim.emissiveIntensity=.035;
 stone.onBeforeCompile=shader=>{const fields='varying vec3 vStoneWorld;\nvarying vec3 vStoneAxis;\n';shader.vertexShader=fields+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvStoneWorld=(modelMatrix*vec4(transformed,1.0)).xyz; vStoneAxis=abs(normalize(mat3(modelMatrix)*normal));');shader.fragmentShader=fields+shader.fragmentShader;const uv='vec2 wallUV=vStoneAxis.y>.66?vStoneWorld.xz:(vStoneAxis.x>.66?vStoneWorld.zy:vStoneWorld.xy);\n';shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#ifdef USE_MAP\n'+uv+'diffuseColor*=texture2D(map,wallUV*vec2(.18,.22));\n#endif');};
 const floorMat=mat(0x4c535a,{roughness:.78});
 function mesh(name,geo,m,p){const o=new THREE.Mesh(geo,m);o.name=name;o.position.set(...p);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
 const box=(name,w,h,d,m,x,y,z)=>mesh(name,new THREE.BoxGeometry(w,h,d),m,[x,y,z]);
 const rod=(name,a,b,r,m)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const o=mesh(name,new THREE.CylinderGeometry(r,r,d.length(),10),m,av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
 function tube(name,points,r,m){return mesh(name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),48,r,8,false),m,[0,0,0]);}
 box('floor',13.5,.16,13.9,floorMat,0,-.08,0);
 for(let i=-6;i<=6;i++){box('stone-floor-joint',.014,.002,13.6,dark,i,.002,0);box('stone-floor-joint',13.3,.002,.014,dark,0,.002,i);}
 box('wall-left',.3,11.5,13.9,stone,-6.8,5.75,0);
 box('wall-right',.3,11.5,13.9,stone,6.8,5.75,0);
 box('wall-front',13.9,11.5,.3,stone,0,5.75,7);
 box('ceiling',13.9,.25,13.9,dark,0,11.6,0);
 // One actual opening, fully contained in the wall shape. No solid wall behind it.
 const wy=8.325,wz=-6.9,wr=1.02;
 const wall=new THREE.Shape();wall.moveTo(-6.95,0);wall.lineTo(6.95,0);wall.lineTo(6.95,11.5);wall.lineTo(-6.95,11.5);wall.closePath();
 const hole=new THREE.Path();hole.absarc(0,wy,wr,0,Math.PI*2,true);wall.holes.push(hole);
 mesh('back-wall-with-hole',new THREE.ExtrudeGeometry(wall,{depth:.28,bevelEnabled:false,curveSegments:64}),stone,[0,0,wz-.12]);
 for(const x of [-6.58,6.58])for(const z of [-5.7,-1.6,2.6,6.3]){
  box('pier-base',.65,.28,.72,trim,x,.14,z);box('clustered-stone-pier',.34,7.7,.44,trim,x,4.05,z);
  for(const dx of [-.2,.2])rod('pier-shaft',[x+dx,.3,z],[x+dx,7.95,z],.07,trim);
  box('pier-capital',.62,.18,.7,trim,x,7.88,z);
 }
 // Repeated pointed arches create a small enclosing nave instead of a spherical dome.
 for(const z of [-5.7,-1.6,2.6,6.3]){
  tube('pointed-vault-rib',[[-6.58,7.95,z],[-5.2,8.85,z],[-2.8,10.25,z],[0,11.28,z]],.105,trim);
  tube('pointed-vault-rib',[[6.58,7.95,z],[5.2,8.85,z],[2.8,10.25,z],[0,11.28,z]],.105,trim);
 }
 tube('vault-ridge',[[0,11.28,-6.8],[0,11.28,0],[0,11.28,6.9]],.08,trim);
 for(const x of [-6.61,6.61]){box('wall-dado',.13,.18,13.6,trim,x,1.12,0);box('wall-plinth',.15,.28,13.6,dark,x,.15,0);}
 // Recessed rose window, stone archivolts and thin iron tracery.
 for(const [r,t] of [[wr+.13,.12],[wr+.32,.055],[wr-.045,.035]]){
  const ring=mesh('rose-window-stone-ring',new THREE.TorusGeometry(r,t,10,96),trim,[0,wy,wz+.23]);ring.castShadow=false;
 }
 const glass=mat(0x8daac9,{emissive:0x9fc7f3,emissiveIntensity:1.3,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
 mesh('circular-window',new THREE.CircleGeometry(wr,96),glass,[0,wy,wz+.02]).castShadow=false;
 const sky=new THREE.MeshBasicMaterial({color:0x0b1427,fog:false});
 mesh('night-sky',new THREE.PlaneGeometry(18,18),sky,[0,wy,-9.3]).castShadow=false;
 const moonMat=new THREE.MeshBasicMaterial({color:0xe5f1ff,fog:false,toneMapped:false});
  const moonHaloMat=new THREE.MeshBasicMaterial({color:0xb9d7ff,transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending});
 const moon=mesh('moon-outside-window',new THREE.CircleGeometry(.29,64),moonMat,[.27,wy+1.45,-8.9]);moon.castShadow=false;
 mesh('moon-shadow',new THREE.CircleGeometry(.265,64),sky,[.39,wy+1.55,-8.87]).castShadow=false;
  for(const [radius,opacity] of [[.47,.035],[.39,.06],[.32,.09]]){const halo=mesh('moon-window-halo',new THREE.CircleGeometry(radius,64),moonHaloMat.clone(),[.27,wy+1.45,-8.82]);halo.material.opacity=opacity;halo.castShadow=false;}
 // Sparse fixed stars live outside the real opening and never illuminate the room.
 const starPositions=[];
 for(let i=0;i<42;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*2.25,x=Math.cos(a)*r,y=wy+Math.sin(a)*r;if(Math.hypot(x-.38,y-(wy+.2))<.58)continue;starPositions.push(x,y,-9.05);}
 const starsGeometry=new THREE.BufferGeometry();starsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
 const stars=new THREE.Points(starsGeometry,new THREE.PointsMaterial({color:0xc9def5,size:.026,sizeAttenuation:true,transparent:true,opacity:.8,depthWrite:false}));stars.name='stars-outside-window';root.add(stars);
 // Eight petal loops only: no radial spokes and no cross bars.
 for(let i=0;i<8;i++){const a=i*Math.PI/4,pts=[];for(let j=0;j<=40;j++){const t=j/40*Math.PI*2;pts.push([Math.cos(a)*wr*.54+Math.cos(t)*wr*.29,wy+Math.sin(a)*wr*.54+Math.sin(t)*wr*.29,wz+.18]);}tube('rose-petal-tracery',pts,.016,iron);}
 
 // Directional shaft from the opening down to the floor beside the table.
 // Radial and longitudinal shader falloff avoids an opaque cone silhouette.
 // Expand the shell and its spacing without enlarging the aperture or the light footprint.
 const shellScale=1.5;
 const windowParts=new Set(['rose-window-stone-ring','circular-window','rose-petal-tracery','moon-outside-window','moon-shadow','moon-window-halo']);
 for(const o of root.children){o.position.multiplyScalar(shellScale);if(o.name==='stars-outside-window'){const attr=o.geometry.getAttribute('position');for(let i=0;i<attr.count;i++){attr.setXYZ(i,attr.getX(i)*shellScale,attr.getY(i)*shellScale,attr.getZ(i)*shellScale);}attr.needsUpdate=true;}else if(!windowParts.has(o.name)){o.scale.multiplyScalar(shellScale);}}
 for(const petal of root.children.filter(o=>o.name==='rose-petal-tracery'))petal.position.add(new THREE.Vector3(0,wy*(shellScale-1),(wz+.18)*(shellScale-1)));
 // Place the moon just outside the opening. A remote disc suffers severe downward parallax from seated eyes.
 const windowWorldY=wy*shellScale,windowWorldZ=(wz+.02)*shellScale;
 moon.position.set(.28,windowWorldY+1.46,windowWorldZ-.38);
 root.getObjectByName('moon-shadow').position.copy(moon.position).add(new THREE.Vector3(.10,.07,.02));
 for(const halo of root.children.filter(o=>o.name==='moon-window-halo'))halo.position.copy(moon.position).add(new THREE.Vector3(0,0,.04));
 glass.emissiveIntensity=2.1;glass.opacity=.20;
 bounds.halfWidth*=shellScale;bounds.halfDepth*=shellScale;bounds.ceiling*=shellScale;
 const source=new THREE.Vector3(0,wy*shellScale,(wz+.02)*shellScale+.02),end=new THREE.Vector3(0,1.48,2.40),delta=end.clone().sub(source);
 // One shared aperture mask for the real light and the visible shafts.
 const aperture=document.createElement('canvas');aperture.width=aperture.height=512;const ac=aperture.getContext('2d');
 ac.fillStyle='#000';ac.fillRect(0,0,512,512);const apertureFade=ac.createRadialGradient(256,256,0,256,256,246);apertureFade.addColorStop(0,'#fff');apertureFade.addColorStop(.55,'#fff');apertureFade.addColorStop(.78,'#b0b0b0');apertureFade.addColorStop(.93,'#303030');apertureFade.addColorStop(1,'#000');ac.fillStyle=apertureFade;ac.beginPath();ac.arc(256,256,246,0,Math.PI*2);ac.fill();
 ac.strokeStyle='#e0e0e0';ac.lineWidth=5;ac.filter='blur(2.5px)';
 for(let i=0;i<8;i++){const a=i*Math.PI/4;ac.beginPath();ac.arc(256+Math.cos(a)*133,256+Math.sin(a)*133,71,0,Math.PI*2);ac.stroke();}
 const apertureTexture=new THREE.CanvasTexture(aperture);apertureTexture.wrapS=apertureTexture.wrapT=THREE.ClampToEdgeWrapping;
 const beamMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  uniforms:{strength:{value:.004},aperture:{value:apertureTexture}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying vec2 vUv; uniform float strength; uniform sampler2D aperture; void main(){float mask=texture2D(aperture,vUv).r;float edge=1.0-smoothstep(.28,.5,length(vUv-.5));gl_FragColor=vec4(.48,.65,1.0,strength*mask*edge);}' });
 // Oblique slices retain the circular aperture in the actual vertical window plane.
 const beam=new THREE.Group();beam.name='volumetric-moonlight';root.add(beam);
 // Oblique truncated cone: its first ring matches the vertical circular window exactly.
 const conePositions=[],coneUvs=[],coneIndices=[];
 for(let ring=0;ring<=24;ring++){const t=ring/24,c=source.clone().addScaledVector(delta,t),r=wr*(1+.60*t);for(let j=0;j<=96;j++){const a=j/96*Math.PI*2;conePositions.push(c.x+Math.cos(a)*r,c.y+Math.sin(a)*r,c.z);coneUvs.push(j/96,t);}}
 for(let ring=0;ring<24;ring++)for(let j=0;j<96;j++){const a=ring*97+j,b=a+97;coneIndices.push(a,b,a+1,b,b+1,a+1);}
 const coneGeometry=new THREE.BufferGeometry();coneGeometry.setAttribute('position',new THREE.Float32BufferAttribute(conePositions,3));coneGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(coneUvs,2));coneGeometry.setIndex(coneIndices);
 const coneMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',uniforms:{aperture:{value:apertureTexture}},fragmentShader:'varying vec2 vUv;uniform sampler2D aperture;void main(){float fade=smoothstep(0.0,.08,vUv.y)*(1.0-smoothstep(.65,1.0,vUv.y));float edge=1.0-smoothstep(.42,.5,abs(vUv.x-.5)*2.0);float petal=texture2D(aperture,vec2(vUv.x,0.5)).r;gl_FragColor=vec4(.46,.63,1.0,.0014*fade*edge*(.45+.55*petal));}'});
 const cone=new THREE.Mesh(coneGeometry,coneMaterial);cone.name='expanding-window-moonlight';cone.renderOrder=3;beam.add(cone);
 beam.castShadow=false;beam.renderOrder=3;
 // Distant virtual moon emitter: rays are nearly parallel, gently expanding after the window.
 const emitterDistance=delta.length()/.60;
 const emitter=source.clone().addScaledVector(delta.clone().normalize(),-emitterDistance);
 const moonLight=new THREE.SpotLight(0xadcfff,350,90,Math.atan(wr/emitterDistance),.52,1);moonLight.name='moonlight-source';moonLight.position.copy(emitter);moonLight.map=apertureTexture;moonLight.shadow.camera.near=Math.max(.1,emitterDistance-1);moonLight.shadow.camera.far=emitterDistance+delta.length()+5;const target=new THREE.Object3D();target.position.copy(end);root.add(target);moonLight.target=target;moonLight.castShadow=true;moonLight.shadow.mapSize.set(1024,1024);moonLight.shadow.normalBias=.025;moonLight.shadow.intensity=.28;moonLight.shadow.radius=4;root.add(moonLight);lights.push(moonLight);
 const fill=new THREE.HemisphereLight(0x8eaed1,0x55504a,.22);fill.name='chapel-soft-fill';root.add(fill);
 // Broad low-contrast bounce makes adjacent faces and cloth readable without a second spotlight.
 const scatter=new THREE.SpotLight(0xaac9f3,8.0,10,.78,.95,1.2);scatter.name='moonlight-scatter-bounce';scatter.position.set(0,3.6,-3.0);scatter.target=target;root.add(scatter);
 const windowBounce=new THREE.SpotLight(0x819fc7,3.2,9,.95,.9,1.2);windowBounce.name='window-soft-scatter';windowBounce.position.set(0,4.2,-4.5);windowBounce.target=target;root.add(windowBounce);
 // Sparse transparent motes, clipped to the widening fixed moonlight volume.
 const dustPositions=[];for(let i=0;i<110;i++){const t=.12+random()*.84,r=Math.sqrt(random())*wr*(1+.60*t)*.82,a=random()*Math.PI*2,c=source.clone().addScaledVector(delta,t);dustPositions.push(c.x+Math.cos(a)*r,c.y+Math.sin(a)*r,c.z);}
 const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));
 const dustCanvas=document.createElement('canvas');dustCanvas.width=dustCanvas.height=32;const dc=dustCanvas.getContext('2d'),dg=dc.createRadialGradient(16,16,0,16,16,16);dg.addColorStop(0,'rgba(218,232,255,.7)');dg.addColorStop(.25,'rgba(218,232,255,.25)');dg.addColorStop(1,'rgba(218,232,255,0)');dc.fillStyle=dg;dc.fillRect(0,0,32,32);
 const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({map:new THREE.CanvasTexture(dustCanvas),color:0xc7daf4,size:.035,transparent:true,opacity:.25,depthWrite:false,blending:THREE.AdditiveBlending}));dust.name='moonlight-dust';root.add(dust);
 // A soft visible aperture anchors the shaft to the actual window, behind the tracery.
 const apertureGlow=new THREE.Mesh(new THREE.CircleGeometry(wr*.98,64),new THREE.MeshBasicMaterial({color:0xadcfff,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide}));apertureGlow.name='window-moonlit-aperture';apertureGlow.position.set(0,wy*shellScale,(wz+.02)*shellScale+.008);root.add(apertureGlow);
 const windowWash=new THREE.PointLight(0xb8d6fa,5.5,5,1.5);windowWash.name='window-stone-reveal-bounce';windowWash.position.copy(source).add(new THREE.Vector3(0,0,.25));root.add(windowWash);
 // The clear leaded panes come from the selected tracery; no duplicate glass or glow.
 root.getObjectByName('circular-window').visible=false;apertureGlow.visible=false;
 const wallFill=new THREE.AmbientLight(0x9aaabd,.055);wallFill.name='stone-indirect-fill';root.add(wallFill);
 const glow=mat(0xf3c789,{emissive:0xffb858,emissiveIntensity:1.5});
 // Freestanding paired church candelabra and a low table group; all fixed in room space.
 const wax=mat(0xf5f3ed,{roughness:.8}),brass=mat(0x756346,{metalness:.72,roughness:.45}),wick=mat(0x25211c);
 function cylinder(name,rTop,rBottom,height,m,x,y,z){return mesh(name,new THREE.CylinderGeometry(rTop,rBottom,height,20),m,[x,y,z]);}
 function whiteCandle(x,bottom,z,height,radius=.042){
  cylinder('white-wax-candle',radius,radius,height,wax,x,bottom+height/2,z);
  cylinder('candle-drip-cup',radius*1.85,radius*1.65,.025,brass,x,bottom-.015,z);
  rod('candle-wick',[x,bottom+height,z],[x,bottom+height+.026,z],.006,wick);
  const flame=mesh('candle-flame',new THREE.SphereGeometry(.022,10,8),glow,[x,bottom+height+.05,z]);flame.scale.set(.7,2,.7);
 }
 // Only three small groups: north, east and west, three white candles each.
 const candleLights=[];
 for(const [label,x,z,side] of [['north',0,-9.8,0],['east',9.55,-2,1],['west',-9.55,-2,-1]]){
  box('candle-console-'+label,side?.7:1.0,.12,side?1.0:.7,trim,x,1.38,z);
  for(let i=-1;i<=1;i++){const dx=side?0:i*.23,dz=side?i*.23:0;whiteCandle(x+dx,1.45,z+dz,.30+(i===0?.07:0),.05);}
  const l=new THREE.PointLight(0xffc58c,3.5,4.8,1.8);l.name='candle-local-'+label;l.position.set(x-side*.2,1.95,z+(side?0:.2));l.castShadow=false;root.add(l);candleLights.push(l);
 }
 // Cardinal architectural composition, entirely in fixed room coordinates.
 const doorWood=mat(0x292322,{roughness:.88}),doorIron=mat(0x373a3c,{metalness:.6,roughness:.72});
 function lancetShape(width,spring,tip){const sh=new THREE.Shape();sh.moveTo(-width/2,0);sh.lineTo(width/2,0);sh.lineTo(width/2,spring);sh.quadraticCurveTo(width*.42,tip*.84,0,tip);sh.quadraticCurveTo(-width*.42,tip*.84,-width/2,spring);sh.closePath();return sh;}
 function lancet(name,width,spring,tip,m,pos,rotation=0){const o=mesh(name,new THREE.ShapeGeometry(lancetShape(width,spring,tip),32),m,pos);o.material=m.clone();o.material.side=THREE.DoubleSide;materials.push(o.material);o.rotation.y=rotation;return o;}
 const southZ=10.31;
 lancet('south-portal-stone',3.8,3.5,5.3,trim,[0,.05,southZ]);
 lancet('south-double-door',3.32,3.35,4.94,doorWood,[0,.06,southZ-.045],Math.PI);
 // Both sides of the door use visible wooden planks, with restrained iron hardware.
 for(let i=-5;i<=5;i++)box('south-door-plank-seam',.014,3.3,.018,doorIron,i*.29,1.72,southZ-.075);
 for(const x of [-.83,.83]){for(const y of [.8,2.6])box('south-door-iron-strap',1.35,.08,.035,doorIron,x,y,southZ-.10);const handle=mesh('south-door-ring-handle',new THREE.TorusGeometry(.09,.015,8,24),brass,[Math.sign(x)*.18,1.62,southZ-.14]);handle.rotation.y=Math.PI;}
 const southGlass=mat(0x273b50,{emissive:0x263d57,emissiveIntensity:.22,side:THREE.DoubleSide,roughness:.8});
 lancet('south-upper-window-frame',1.75,1.6,2.8,trim,[0,7.05,southZ-.03],Math.PI);
 lancet('south-upper-window-dark-glass',1.46,1.48,2.45,southGlass,[0,7.15,southZ-.065],Math.PI);
 rod('south-window-mullion',[0,7.15,southZ-.1],[0,9.5,southZ-.1],.025,doorIron);
 // Dark altar below the north rose; only the existing three north candles remain.
 box('north-altar-base',2.7,.18,1.0,trim,0,.09,-9.72);
 box('north-altar-body',2.35,.92,.75,stone,0,.64,-9.72);
 box('north-altar-slab',2.9,.16,1.05,trim,0,1.18,-9.72);
 // Repeating blind pointed arcades on east and west unify the side elevations.
 for(const side of [-1,1])for(const z of [-6.3,-.5,5.3]){
  const x=side*9.88,rot=side===1?-Math.PI/2:Math.PI/2;
  lancet('side-blind-arch-frame',2.5,4.0,6.1,trim,[x,.3,z],rot);
  lancet('side-recessed-stone-panel',2.18,3.86,5.7,stone,[x-side*.04,.42,z],rot);
  for(const dz of [-1.28,1.28]){cylinder('side-arcade-column',.075,.10,4.3,trim,x-side*.11,2.45,z+dz);cylinder('side-arcade-capital',.16,.11,.17,trim,x-side*.11,4.65,z+dz);}
 }
 // Corner torch ranges stop well before the central cast; no additional shadow maps.
 const torches=[];
 for(const x of [-9.05,9.05])for(const z of [-9.15,9.15]){
  box('torch-wall-bracket',.14,.42,.22,iron,x,2.45,z);
  rod('torch-wood-handle',[x,2.15,z],[x,2.9,z],.055,doorWood);
  cylinder('torch-iron-basket',.12,.075,.22,iron,x,2.94,z);
  const flame=mesh('corner-torch-flame',new THREE.SphereGeometry(.10,10,8),glow,[x,3.17,z]);flame.scale.set(.75,2.5,.75);
  const l=new THREE.PointLight(0xffbd78,18,4.8,1.6);l.name='corner-torch-local';l.position.set(x,3.18,z);l.castShadow=false;root.add(l);torches.push(l);
 }
 // North sanctuary: rectangular lower elevation capped with a genuine semicircle.
 const sanctuaryRadius=5.6,springY=10.5,sanctuaryZ=-10.32;
 function sanctuaryShape(windowRadius){const sh=new THREE.Shape();sh.moveTo(-sanctuaryRadius,0);sh.lineTo(sanctuaryRadius,0);sh.lineTo(sanctuaryRadius,springY);sh.absarc(0,springY,sanctuaryRadius,0,Math.PI,false);sh.lineTo(-sanctuaryRadius,0);sh.closePath();const h=new THREE.Path();h.absarc(0,wy*shellScale,windowRadius,0,Math.PI*2,true);sh.holes.push(h);return sh;}
 const sanctuary=mesh('north-round-arch-sanctuary',new THREE.ExtrudeGeometry(sanctuaryShape(wr*1.5),{depth:.18,bevelEnabled:false,curveSegments:64}),stone,[0,0,sanctuaryZ]);
 for(const offset of [0,.22]){const points=[];for(let j=0;j<=80;j++){const a=j/80*Math.PI;points.push([Math.cos(a)*(sanctuaryRadius-offset),springY+Math.sin(a)*(sanctuaryRadius-offset),sanctuaryZ+.25]);}tube('north-semicircular-arch-moulding',points,.09,trim);}
 for(const x of [-sanctuaryRadius,sanctuaryRadius]){cylinder('north-sanctuary-column',.16,.22,springY,trim,x,springY/2,sanctuaryZ+.26);box('north-sanctuary-capital',.65,.22,.48,trim,x,springY,sanctuaryZ+.26);}
 for(const [width,depth,y] of [[7.4,2.8,.10],[6.8,2.3,.28],[6.2,1.8,.46]])box('north-altar-processional-step',width,.18,depth,stone,0,y,-8.82);
 // Lift existing altar onto the raised sanctuary, broaden the solid frontal and top.
 for(const name of ['north-altar-base','north-altar-body','north-altar-slab']){const o=root.getObjectByName(name);o.position.y+=.50;o.position.z=-9.42;o.scale.x=1.4;}
 // Recessed panels on the altar front; restrained, no text or invented symbols.
 for(const x of [-1.02,0,1.02]){box('altar-frontal-recess',.72,.52,.025,dark,x,1.12,-8.99);const points=[[x-.30,.88,-8.96],[x-.30,1.35,-8.96],[x,1.55,-8.96],[x+.30,1.35,-8.96],[x+.30,.88,-8.96]];tube('altar-frontal-stone-carving',points,.025,trim);}
 // Existing north candles rest on the altar slab; retain only three candle lights overall.
 for(const o of root.children){if(['white-wax-candle','candle-drip-cup','candle-wick','candle-flame','candle-console-north'].includes(o.name)&&Math.abs(o.position.x)<1&&o.position.z< -9.4)o.position.y+=.50;}const northCandleLight=root.children.find(o=>o.name==='candle-local-north');if(northCandleLight)northCandleLight.position.y+=.50;
let traceryStyle='',tracerySize=0,tracery=null;
 function updateTracery(){const style=['petals','quatrefoil','radial','royal','story'].includes(window.__chapelTracery)?window.__chapelTracery:'petals';const size=THREE.MathUtils.clamp(Number(window.__chapelWindowScale)||2.34,.70,2.65);if(style===traceryStyle&&size===tracerySize)return;traceryStyle=style;tracerySize=size;
  if(tracery){architecture.remove(tracery.group);tracery.dispose();}
  for(const old of architecture.children.filter(o=>o.name==='rose-petal-tracery'))old.visible=false;
  tracery=createTracery(style,wr*size,new THREE.Vector3(0,wy*shellScale,(wz+.18)*shellScale+.04),iron,studyEnabled);architecture.add(tracery.group);moonLight.map=tracery.texture;coneMaterial.uniforms.aperture.value=tracery.texture;beamMaterial.uniforms.aperture.value=tracery.texture;
 }
 let windowScale=-1;
 const windowCenter=new THREE.Vector3(0,wy*shellScale,wz*shellScale);
 const adjustableWindow=root.children.filter(o=>['rose-window-stone-ring','circular-window','rose-petal-tracery','window-moonlit-aperture'].includes(o.name));
 const windowBase=new Map(adjustableWindow.map(o=>[o,{position:o.position.clone(),scale:o.scale.clone()}]));
 const backWall=root.getObjectByName('back-wall-with-hole');const originalWallGeometry=backWall.geometry;
 function resizeWindow(factor){factor=THREE.MathUtils.clamp(factor,.7,2.65);if(Math.abs(factor-windowScale)<.0001)return;windowScale=factor;
  for(const o of adjustableWindow){const b=windowBase.get(o);if(o.name==='rose-petal-tracery'){o.scale.set(b.scale.x*factor,b.scale.y*factor,b.scale.z);o.position.set(b.position.x,windowCenter.y-wy*factor,(wz+.18)*shellScale-(wz+.18));}else{o.scale.set(b.scale.x*factor,b.scale.y*factor,b.scale.z);}}
  const sh=new THREE.Shape();sh.moveTo(-6.95,0);sh.lineTo(6.95,0);sh.lineTo(6.95,11.5);sh.lineTo(-6.95,11.5);sh.closePath();const opening=new THREE.Path();opening.absarc(0,wy,wr*factor/shellScale,0,Math.PI*2,true);sh.holes.push(opening);
  const oldSanctuary=sanctuary.geometry;sanctuary.geometry=new THREE.ExtrudeGeometry(sanctuaryShape(wr*factor),{depth:.18,bevelEnabled:false,curveSegments:64});oldSanctuary.dispose();
   const previous=backWall.geometry;backWall.geometry=new THREE.ExtrudeGeometry(sh,{depth:.28,bevelEnabled:false,curveSegments:64});if(previous!==originalWallGeometry)previous.dispose();
 }
 // Three architectural studies: rose-and-stone, glass nave, forest chapel.
 const schemeGlass=new THREE.Group();schemeGlass.name='scheme-high-windows';root.add(schemeGlass);
 const forest=new THREE.Group();forest.name='outside-bare-forest';root.add(forest);
 const sideWallOriginal=new Map(['wall-left','wall-right'].map(name=>[name,root.getObjectByName(name).geometry]));
  let sideWindows,appliedSideShape='',appliedScheme='';
  // Stars are authored close to the north opening, avoiding severe seated-eye parallax and fog extinction.
 const starCanvas=document.createElement('canvas');starCanvas.width=starCanvas.height=64;const starCtx=starCanvas.getContext('2d'),starGradient=starCtx.createRadialGradient(32,32,0,32,32,32);starGradient.addColorStop(0,'#fff');starGradient.addColorStop(.2,'#c8e0ff');starGradient.addColorStop(1,'rgba(150,190,255,0)');starCtx.fillStyle=starGradient;starCtx.fillRect(0,0,64,64);
 stars.material.map=new THREE.CanvasTexture(starCanvas);stars.material.fog=false;stars.material.opacity=.95;stars.material.size=.07;stars.material.needsUpdate=true;const starArray=[];
 for(let i=0;i<90;i++){const x=(random()-.5)*6,y=windowCenter.y+(random()-.5)*6;starArray.push(x,y,windowCenter.z-.38);}stars.geometry.dispose();stars.geometry=new THREE.BufferGeometry();stars.geometry.setAttribute('position',new THREE.Float32BufferAttribute(starArray,3));stars.scale.set(1,1,1);stars.position.set(0,0,0);
 const branchMat=new THREE.MeshBasicMaterial({color:0x09101a,fog:false}),birdMat=new THREE.MeshBasicMaterial({color:0x030508,fog:false});
  for(const side of [-1,1]){const sky=mesh('forest-night-sky',new THREE.PlaneGeometry(45,27),new THREE.MeshBasicMaterial({color:0x28364d,side:THREE.DoubleSide,fog:false}),[side*19,8,0]);sky.rotation.y=Math.PI/2;sky.castShadow=false;forest.attach(sky);}
  function crowAt(x,y,z,side){const bird=new THREE.Group();bird.name='perched-crow';bird.position.set(x,y,z);bird.rotation.y=side*.66;forest.add(bird);const part=(g,pos,scale,rot=0)=>{const p=new THREE.Mesh(g,birdMat);p.position.set(...pos);p.scale.set(...scale);p.rotation.x=rot;bird.add(p);};part(new THREE.SphereGeometry(1,10,7),[0,0,0],[.13,.14,.23],-.2);part(new THREE.SphereGeometry(1,9,7),[0,.145,.14],[.08,.082,.087]);part(new THREE.ConeGeometry(.042,.14,5),[0,.13,.259],[1,.8,1],Math.PI/2);part(new THREE.ConeGeometry(.084,.26,4),[0,-.096,-.234],[1,1,.6],-1.96);}
 for(const side of [-1,1])for(let i=0;i<12;i++){const x=side*(12.5+random()*3),z=-9+i*1.65,y=5+random()*4;const trunk=rod('bare-tree-trunk',[x,0,z],[x,y,z],.12,branchMat);forest.attach(trunk);for(const sign of [-1,1]){const b=rod('bare-tree-branch',[x,y*.55,z],[x+side*(.5+random()),y*.9,z+sign*(.8+random())],.055,branchMat);forest.attach(b);}if(i%4===0){crowAt(x+side*.6,y*.88+.15,z+.88,side);for(const d of [-1,1]){const twig=rod('bare-tree-twig',[x+side*.60,y*.80,z+d*.68],[x+side*.44,y*1.02,z+d*1.42],.027,branchMat);twig.castShadow=false;forest.attach(twig);}}}
 function applyScheme(){const scheme=['rose','glass','forest'].includes(window.__chapelWindowScheme)?window.__chapelWindowScheme:'rose';const shape=['lancet','round','flamboyant'].includes(window.__chapelSideShape)?window.__chapelSideShape:'lancet';if(scheme===appliedScheme&&shape===appliedSideShape)return;appliedScheme=scheme;appliedSideShape=shape;schemeGlass.visible=scheme!=='rose';forest.visible=scheme==='forest';
   if(scheme!=='rose'){if(sideWindows?.shape!==shape){sideWindows?.dispose();sideWindows={...buildSideWindows(shape,{mesh,rod,tube,trim,iron,group:schemeGlass}),shape};}sideWindows.material.opacity=scheme==='forest'?(studyEnabled?.30:.57):.91;}
   for(const name of ['wall-left','wall-right']){const w=root.getObjectByName(name);if(scheme==='rose'){w.geometry=sideWallOriginal.get(name);w.scale.set(1.5,1.5,1.5);w.position.set(name==='wall-left'?-10.2:10.2,8.625,0);w.rotation.y=0;}else{w.geometry=sideWindows.geometry;w.scale.set(1,1,1);w.position.set(name==='wall-left'?-9.975:10.425,0,0);w.rotation.y=0;}}
  for(const o of architecture.children)if(o.name==='side-blind-arch-frame'||o.name==='side-recessed-stone-panel')o.visible=scheme==='rose';
 }
 // Perimeter seating and a clear central aisle.
  for(const side of [-1,1])for(const z of [-3.7,1.6,6.8]){const x=side*7.55;box('oak-pew-seat',.58,.11,2.25,doorWood,x,.48,z);box('oak-pew-back',.11,.53,2.25,doorWood,x+side*.25,.83,z);for(const dz of [-.94,.94])box('oak-pew-end',.62,.72,.12,doorWood,x,.37,z+dz);}
  for(const x of [-1.6,1.6]){box('prayer-kneeler-pad',.81,.10,.39,dark,x,.21,-6.75);for(const dx of [-.34,.34])box('prayer-kneeler-post',.09,.72,.09,doorWood,x+dx,.38,-7.02);box('prayer-kneeler-rest',.86,.095,.19,doorWood,x,.79,-7.02);}
  box('altar-linen',1.52,.018,.60,mat(0xb7b1a0),0,1.77,-9.42);
  box('closed-liturgical-book',.29,.055,.21,doorWood,.46,1.81,-9.35);
  cylinder('altar-chalice-foot',.074,.084,.028,brass,-.39,1.79,-9.37);cylinder('altar-chalice-stem',.019,.022,.13,brass,-.39,1.86,-9.37);cylinder('altar-chalice-bowl',.077,.026,.096,brass,-.39,1.96,-9.37);
  const torchObjects=root.children.filter(o=>o.name.startsWith('torch-')||o.name.startsWith('corner-torch-'));
  const studyEnabled=new URLSearchParams(location.search).get('preview')==='chapel-study';
  const shaft=studyEnabled?makeMoonShaft():null;
  const studyFloor=studyEnabled?makeFlagstoneMap():null;
  const revealMaterials=studyEnabled?[0x80878e,0x747c84,0x8c9096,0x69737d].map(c=>mat(c,{roughness:.88,map:texture,bumpMap:texture,bumpScale:.024})):[];
  const oldRings=root.children.filter(o=>o.name==='rose-window-stone-ring');let reveal=null,revealScale=0;
  const sideFill=[];
  const seatKey=studyEnabled?new THREE.SpotLight(0xd5e3fa,72,13,.37,.90,1.55):null;
  if(seatKey){seatKey.name='moon-window-seat-bounce';seatKey.position.set(0,3.15,-1.25);seatKey.target=target;seatKey.visible=false;root.add(seatKey);}
  if(studyEnabled){root.add(shaft.mesh);forest.add(makeNightGround(texture));for(const s of [-1,1]){const l=new THREE.PointLight(0xc6d4ee,22,11,1.62);l.name='night-side-window-diffuse';l.position.set(s*6.6,3.3,1.1);l.visible=false;root.add(l);sideFill.push(l);}}
  const architecture=studyEnabled?new THREE.Group():root;
  const scaledSource=source.clone();let compact=false;
  if(studyEnabled){for(const o of [...root.children])if(o.isMesh||o===stars||o===forest||o===schemeGlass)architecture.add(o);root.add(architecture);}
  const vault=new THREE.Group();vault.visible=false;
  const oldRibs=architecture.children.filter(o=>['ceiling','pointed-vault-rib','vault-ridge'].includes(o.name));
  if(studyEnabled){
   architecture.add(vault);
   const height=x=>17.25-5.06*Math.pow(Math.abs(x)/10.05,.82);
   const vaultMat=mat(0x687480,{map:texture,bumpMap:texture,bumpScale:.055,side:THREE.DoubleSide});
   const positions=[],uv=[],indices=[];
   for(let i=0;i<=48;i++){const x=(i/24-1)*10.05;positions.push(x,height(x),-10.48,x,height(x),10.30);uv.push(i/12,0,i/12,4);if(i){const a=i*2-2;indices.push(a,a+1,a+2,a+2,a+1,a+3);}}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
   const shell=new THREE.Mesh(g,vaultMat);shell.receiveShadow=true;vault.add(shell);
   for(const z of [-8.55,-2.4,3.9,9.45]){
    for(const s of [-1,1]){const points=Array.from({length:19},(_,i)=>{const x=s*10.05*i/18;return [x,height(x)-.12,z];});vault.add(tube('compact-vault-rib',points,.145,trim));}
    vault.add(mesh('compact-vault-boss',new THREE.SphereGeometry(.28,12,8),trim,[0,17.05,z]));
   }
  }
  const marks=new Map([scatter,windowBounce,windowWash,...candleLights,...torches].map(o=>[o,o.position.clone()]));
  function applyStudy(){const next=studyEnabled&&window.__chapelStudy==='compact';if(next===compact)return;compact=next;
   architecture.scale.set(...(compact?[.77,.69,.74]:[1,1,1]));vault.visible=compact;oldRibs.forEach(o=>o.visible=!compact);
   for(const [o,base] of marks)o.position.copy(base).multiply(architecture.scale);
   scaledSource.copy(source).multiply(architecture.scale);const direction=end.clone().sub(scaledSource),length=direction.length(),distance=length/.60;
   moonLight.position.copy(scaledSource).addScaledVector(direction.normalize(),-distance);
   moonLight.angle=Math.atan(wr/(compact?emitterDistance:distance));moonLight.shadow.camera.near=Math.max(.1,distance-1);moonLight.shadow.camera.far=distance+length+5;
   moonLight.intensity=compact?435:350;fill.intensity=compact?.36:.22;wallFill.intensity=compact?.095:.055;scatter.intensity=compact?12.0:8;windowBounce.intensity=compact?4.8:3.2;
   windowWash.intensity=compact?14:5.5;beam.visible=dust.visible=!compact;
    moonLight.intensity=compact?670:350;
    fill.intensity=compact?.58:.22;
    sideFill.forEach(l=>l.visible=compact);
     if(seatKey)seatKey.visible=compact;
     floorMat.map=compact?studyFloor:null;floorMat.bumpMap=compact?studyFloor:null;floorMat.bumpScale=.035;floorMat.needsUpdate=true;
    if(studyEnabled)window.__chapelWindowScheme=compact?'forest':'rose';
  }
  function updateNorthStudy(){
   if(!studyEnabled)return;
   oldRings.forEach(o=>o.visible=!compact);
   shaft.mesh.visible=compact;
   if(!compact){if(reveal)reveal.visible=false;return;}
   if(revealScale!==windowScale){
    if(reveal){architecture.remove(reveal);reveal.traverse(o=>o.geometry?.dispose());}
    revealScale=windowScale;
    reveal=makeStoneReveal(wr*windowScale,windowCenter.clone().add(new THREE.Vector3(0,0,.28)),revealMaterials);
    architecture.add(reveal);
   }
   reveal.visible=true;
   shaft.configure(scaledSource,end,tracery.texture);
  }
  function setStone4k(tex){
   if(!tex)return;
   if(tex.stoneDiffuse){stone.map=tex.stoneDiffuse;stone.map.repeat.set(3,2);}
   if(tex.stoneNormal){stone.normalMap=tex.stoneNormal;stone.normalMap.repeat.set(3,2);stone.normalScale=new THREE.Vector2(.9,.9);}
   if(tex.stoneRough){stone.roughnessMap=tex.stoneRough;stone.roughnessMap.repeat.set(3,2);stone.roughness=1;}
   stone.needsUpdate=true;
   if(tex.floorDiffuse){floorMat.map=tex.floorDiffuse;floorMat.map.repeat.set(4,4);}
   if(tex.floorNormal){floorMat.normalMap=tex.floorNormal;floorMat.normalMap.repeat.set(4,4);floorMat.normalScale=new THREE.Vector2(.8,.8);}
   if(tex.floorRough){floorMat.roughnessMap=tex.floorRough;floorMat.roughnessMap.repeat.set(4,4);floorMat.roughness=1;}
   floorMat.needsUpdate=true;
 }
 function setDraftMaterials(draft){
   if(!studyEnabled)return;
   applyDraftSurface(stone,draft?.stone,.94,.037);
   for(const o of vault.children)if(o.material?.side===THREE.DoubleSide)applyDraftSurface(o.material,draft?.stone,.94,.032);
   applyDraftSurface(doorWood,draft?.oak,.71,.016);
   applyDraftSurface(brass,draft?.brass,.47,.009);
  }
  let level=1;
 return {root,materials,bounds,setDraftMaterials,setStone4k,setVisibility(value){for(const o of torchObjects)o.visible=window.__chapelTorches!==false;updateTracery();applyStudy();applyScheme();resizeWindow(Number(window.__chapelWindowScale)||2.34);updateNorthStudy();level=THREE.MathUtils.clamp(value,0,1);for(const m of materials){if(!m.userData.originalColor)m.userData.originalColor=m.color.clone();m.color.copy(m.userData.originalColor).multiplyScalar(.48+.52*level);}beamMaterial.uniforms.strength.value=.004*(.6+.4*level);},
 auditOpenings(){root.updateMatrixWorld(true);const ray=(origin,facing,names)=>{const r=new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...facing));const walls=names.map(n=>root.getObjectByName(n)),sides=walls.map(w=>w.material.side);try{walls.forEach(w=>w.material.side=THREE.DoubleSide);return r.intersectObjects(walls,false).length===0;}finally{walls.forEach((w,i)=>w.material.side=sides[i]);}};return {north:ray([0,windowCenter.y,0],[0,0,-1],['back-wall-with-hole','north-round-arch-sanctuary']),east:[-6.3,-.5,5.3].map(z=>ray([0,4,z],[1,0,0],['wall-right'])),west:[-6.3,-.5,5.3].map(z=>ray([0,4,z],[-1,0,0],['wall-left']))};},
 snapshot(){return {name:root.name,style:'intimate-gothic-chapel',visibility:level,decorations:root.children.length,enclosedWalls:4,roof:'pointed-rib-vault',layout:{north:'semicircular arch over rectangular raised sanctuary with inset rose window and altar',south:'oak double portal and dim lancet window',sides:'six blind pointed arcades',addedLights:0},bounds:{...bounds,halfWidth:bounds.halfWidth*architecture.scale.x,halfDepth:bounds.halfDepth*architecture.scale.z,ceiling:bounds.ceiling*architecture.scale.y},study:compact?'compact':'baseline',candles:{wax:'white',arrangement:'north east west, three candles each',count:9,localLights:3,fixedInRoom:true},palette:'cool limestone / blue moonlight / candle amber',cutaway:false,torches:{count:4,range:4.8,affectsCentralCast:false},window:{tracery:traceryStyle,projectionStyle:traceryStyle,scheme:appliedScheme,sideShape:appliedSideShape,starCount:90,petalCount:8,petalBounds:root.children.filter(o=>o.name==='rose-petal-tracery').map(o=>{const b=new THREE.Box3().setFromObject(o);return {min:b.min.toArray(),max:b.max.toArray()};}),radius:wr*windowScale,scale:windowScale,centre:windowCenter.clone().multiply(architecture.scale).toArray(),realOpening:true,glassOpacity:tracery?.glass.material.opacity,glassTransparent:tracery?.glass.material.transparent,glassStyle:'clear',emissiveIntensity:0,moonPosition:moon.position.clone().multiply(architecture.scale).toArray()},moonlight:{source:scaledSource.toArray(),target:end.toArray(),fixedInRoom:true,apertureDiameter:wr*2,exitDiameter:wr*2*1.60,pattern:traceryStyle,projectionMap:!!moonLight.map,scatterFill:fill.intensity,shadowStrength:moonLight.shadow.intensity,traceryContrast:.12}};}};
}
