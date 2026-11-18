// Original sewn-cloth characters, cut for a cold gothic stage. No third-party character meshes or textures.
import * as THREE from './vendor/three.module.js';
export const puppetDesigns=[
 {name:'沈知夏',coat:'#39463f',patch:'#4b2b2e',hair:'#38322b',style:'bob',detail:'短发 · 灰绿高领 · 旧布围裙',accent:'#74776b'},
 {name:'周启明',coat:'#333d4a',patch:'#5c5646',hair:'#2f2c26',style:'cap',detail:'软帽 · 炭蓝工装 · 卷袖',accent:'#6e685c'},
 {name:'林素琴',coat:'#4d3033',patch:'#2e3938',hair:'#3a3128',style:'bun',detail:'盘发 · 酒红立领 · 拼布披肩',accent:'#6f6552'},
 {name:'许承安',coat:'#40423a',patch:'#28313f',hair:'#312b26',style:'part',detail:'偏分 · 墨绿立领 · 长襟外套',accent:'#5c574c'},
 {name:'何映秋',coat:'#443e49',patch:'#5d5445',hair:'#3d322a',style:'wave',detail:'卷发 · 灰紫披肩 · 相机背带',accent:'#635c54'},
 {name:'陈默',coat:'#2c3e3e',patch:'#4e4136',hair:'#2f322c',style:'crop',detail:'短发 · 墨绿领巾 · 接线背心',accent:'#5d584e'}
];
export const poseDesigns=[
 {name:'护住记录本，摊掌说明',left:[[-.23,1.12,-.12],[-.14,1.18,-.26]],right:[[.29,1.16,-.12],[.36,1.39,-.31]]},
 {name:'举扳手，另一手撑膝',left:[[-.28,1.05,-.16],[-.23,1.08,-.35]],right:[[.30,1.34,-.05],[.33,1.52,-.22]]},
 {name:'双手拢账簿，低头核对',left:[[-.24,1.08,-.10],[-.07,1.18,-.28]],right:[[.23,1.07,-.12],[.08,1.17,-.30]]},
 {name:'抱臂思索，单手作解释',left:[[-.22,1.12,-.12],[.12,1.31,-.27]],right:[[.29,1.20,-.13],[.30,1.45,-.25]]},
 {name:'托相机，扶镜头示意',left:[[-.24,1.08,-.10],[-.14,1.20,-.32]],right:[[.25,1.09,-.10],[.13,1.23,-.36]]},
 {name:'侧耳接听，另一手打节拍',left:[[-.29,1.29,-.02],[-.23,1.60,-.05]],right:[[.28,1.10,-.14],[.30,1.30,-.32]]}
];
const cache=new Map();
function clothTexture(base,patch=null,face=false,index=0){
 const key=[base,patch,face,index].join();if(cache.has(key))return cache.get(key);
 const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512);
 // Deterministic woven warp and weft, not random dirt on a human face.
 for(let i=0;i<512;i+=4){x.strokeStyle=i%8?'#ffffff09':'#00000012';x.lineWidth=1;x.beginPath();x.moveTo(i,0);x.lineTo(i,512);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(512,i);x.stroke();}
 function dashed(points,color='#6e6a5d',w=2){x.strokeStyle=color;x.lineWidth=w;x.setLineDash([4,5]);x.beginPath();points.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.stroke();x.setLineDash([]);}
 if(face){
  // Worn grey-white linen. The features are sewn on: button eyes, a stitched mouth, never a smile.
  for(let i=0;i<22;i++){const px=(i*97)%512,py=(i*61)%512;x.fillStyle='rgba(74,72,64,.06)';x.fillRect(px,py,30+(i%4)*9,16+(i%3)*7);}
  // The seam of the two head panels runs down the middle of the face.
  dashed([[256,110],[256,398]],'#6f6b60',1.4);
  const spread=[29,34,24,32,35,26][index],eyeY=[252,258,247,250,255,249][index],droop=[3,-4,2,-3,4,1][index];
  for(const s of [-1,1]){
   const cx=256+s*spread,cy=eyeY+(s<0?droop:-droop);
   x.fillStyle='rgba(74,70,60,.26)';x.beginPath();x.ellipse(cx,cy+1,17,13,0,0,Math.PI*2);x.fill();
   x.fillStyle='#7c7a72';x.beginPath();x.arc(cx,cy,13,0,Math.PI*2);x.fill();
   x.fillStyle='#232120';x.beginPath();x.arc(cx,cy,10,0,Math.PI*2);x.fill();
   x.strokeStyle='#5b564a';x.lineWidth=2.4;x.beginPath();x.moveTo(cx-6,cy-4.5);x.lineTo(cx+6,cy+4.5);x.moveTo(cx+6,cy-4.5);x.lineTo(cx-6,cy+4.5);x.stroke();
  }
  // A stitched mouth: a dashed seam with a soft shadow under it, cut slightly off centre.
  const my=[326,330,322,328,334,324][index],mt=[-3,2,-2,3,-2,1][index];
  x.strokeStyle='rgba(58,55,47,.30)';x.lineWidth=7;x.beginPath();x.moveTo(212,my+4);x.quadraticCurveTo(256,my+7+mt,300,my+4+mt);x.stroke();
  dashed([[214,my+1],[256,my+3+mt*.5],[298,my+1+mt]],'#3f3b33',2.4);
  // A worn crease where the linen folded around the nose.
  x.strokeStyle='rgba(64,62,54,.22)';x.lineWidth=3;x.beginPath();x.moveTo(250,288);x.quadraticCurveTo(256,294,262,289);x.stroke();
 }else{
  if(patch){x.fillStyle=patch;x.fillRect(285,285,91,101);dashed([[289,289],[372,289],[372,382],[289,382],[289,289]],'#4a463d',2);}
  dashed([[252,0],[250,512]],'#c3c0b0aa',1.5);
 }
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;cache.set(key,map);return map;
}
function mat(color,patch=null){return new THREE.MeshStandardMaterial({color:0xffffff,map:clothTexture(color,patch),roughness:.98,metalness:0});}
// Horn, bone and pewter: hard surfaces next to the cloth, so the dolls read by material as well as by colour.
function hardMat(color,roughness=.45,metalness=.05){return new THREE.MeshStandardMaterial({color:new THREE.Color(color),roughness,metalness});}
function form(rings,segments=36,deform=null){
 const pos=[],uv=[],idx=[];
 rings.forEach(([y,rx,rz,zc=0],j)=>{for(let i=0;i<=segments;i++){const t=i/segments*Math.PI*2;let px=Math.sin(t)*rx,py=y,pz=Math.cos(t)*rz+zc;
  if(deform){const d=deform(t,py,j);px+=d[0];py+=d[1];pz+=d[2];}
  pos.push(px,py,pz);uv.push(i/segments,1-j/(rings.length-1));}});
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function add(g,name,geo,m,p=[0,0,0]){const o=new THREE.Mesh(geo,m);o.name=name;o.position.set(...p);o.castShadow=true;o.receiveShadow=false;g.add(o);return o;}
function soft(g,name,scale,m,p){const o=add(g,name,new THREE.SphereGeometry(1,18,12),m,p);o.scale.set(...scale);return o;}
function tube(g,name,a,b,r,m){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const o=add(g,name,new THREE.CylinderGeometry(r*.9,r,d.length(),12),m,av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
function stitchLine(g,points,m,r=.0035){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const len=curve.getLength(),n=Math.max(3,Math.floor(len/.028));for(let i=0;i<n;i++){const a=curve.getPoint(i/n),b=curve.getPoint(Math.min(1,(i+.48)/n));tube(g,'hand-stitch',a.toArray(),b.toArray(),r,m);}}
function ringStitch(g,y,rx,rz,m,r=.0024,n=18){const pts=[];for(let i=0;i<=n;i++){const t=i/n*Math.PI*2;pts.push([Math.sin(t)*rx,y,Math.cos(t)*rz]);}stitchLine(g,pts,m,r);}
function patch(g,x,y,z,w,h,color,thread,tilt=0){const m=mat(color),side=Math.sign(z)||1;
 const rim=add(g,'patch-bound-edge',new THREE.BoxGeometry(w+.012,h+.012,.008),mat('#3a3a33'),[x,y,z]);rim.rotation.z=tilt;
 const o=add(g,'cloth-patch',new THREE.BoxGeometry(w,h,.009),m,[x,y,z+side*.006]);o.rotation.z=tilt;
 // Large stitches remain legible at the actual round-table camera distance.
 for(let i=0;i<5;i++){const xx=x-w*.38+i*w*.19;tube(g,'patch-stitch',[xx,y-h*.46,z+side*.014],[xx+.007,y-h*.34,z+side*.016],.0025,thread);tube(g,'patch-stitch',[xx,y+h*.34,z+side*.016],[xx+.007,y+h*.46,z+side*.014],.0025,thread);}
}
function headProfile(index){
 // Slender and uneven: every head was cut by hand, so no two silhouettes match.
 const width=[.97,1.05,.87,.93,1.03,.89][index],jaw=[.86,1.05,.78,.92,1.0,.76][index];
 return [[1.895,.005,.005],[1.88,.105,.10],[1.83,.185,.175],[1.74,.224,.205],[1.63,.222,.204],[1.53,.19,.174],[1.445,.13,.137],[1.405,.06,.065],[1.402,.005,.005]].map(([y,x,z])=>[y,x*width*(y<1.54?jaw:1),z*[1,1.07,.95,1.02,1.05,.96][index]]);
}
// The jaw is pushed to one side and one cheek is fuller: an uneven, hand-cut face.
function headDeform(index){
 const shift=[.014,-.018,.010,.020,-.012,.008][index],bulge=[.016,-.020,.012,.018,-.010,.015][index];
 return (t,y)=>{const low=THREE.MathUtils.clamp((1.66-y)/.24,0,1);return [shift*low+bulge*low*Math.sin(t),0,0];};
}
function hairCap(g,d,index,m){
 // Continuous sculpted cap with a scalloped asymmetrical fringe; not a stack of balls.
 const pos=[],uv=[],ids=[],N=64,M=22,cy=1.63;
  // Follow the stuffed head's actual cross sections with a constant cloth allowance.
  // An ellipsoid cap intersected the cheek rings, producing a false jagged hairline.
  const profile=headProfile(index).reverse();
  function capPoint(t,phi){const y=cy+.275*Math.cos(phi);let rx=.005,rz=.005;
   for(let k=1;k<profile.length;k++){if(y<=profile[k][0]){const a=profile[k-1],b=profile[k],u=THREE.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);rx=THREE.MathUtils.lerp(a[1],b[1],u);rz=THREE.MathUtils.lerp(a[2],b[2],u);break;}}
   return [Math.sin(t)*(rx+.014),y,Math.cos(t)*(rz+.014)];}
 for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){
  const t=i/N*Math.PI*2,front=Math.max(0,-Math.cos(t));let edge=1.60;
  // Raised smooth hairline leaves a linen forehead rather than a dark eye band.
  if(d.style==='bob')edge=1.92-front*.96;
  if(d.style==='wave')edge=1.94-front*.94+Math.sin(t*5)*.018*(1-front);
  if(d.style==='part')edge=1.60-front*.67+.075*Math.sin(t+1)*(1-front);
  if(d.style==='bun')edge=1.64-front*.68;
  if(d.style==='crop'||d.style==='cap')edge=1.54-front*.58;
  const phi=.018+(edge-.018)*j/M;
  pos.push(...capPoint(t,phi));uv.push(i/N,j/M);
 }
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;ids.push(a,b,a+1,a+1,b,b+1);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();const mesh=add(g,'sculpted-cloth-hair',geo,m);mesh.material.side=THREE.DoubleSide;
 const hairThread=mat('#9a927f');
  const hem=[];for(let i=0;i<=N;i++){const k=(M*(N+1)+i)*3;hem.push([pos[k]*1.012,pos[k+1]-.002,pos[k+2]*1.012]);}stitchLine(g,hem,hairThread,.0026);
  for(const t of (index===1?[-.9,0,.9]:index===4?[-1.4,-.7,0,.7,1.4]:index===3?[-1.05,.25,1.1]:[-1.0,0,1.0])){const seam=[];for(let k=0;k<=12;k++){const p=capPoint(t,.22+k*.105);seam.push([p[0]*1.012,p[1]+.002,p[2]*1.012]);}stitchLine(g,seam,hairThread,.0028);}
  if(d.style==='bun'){soft(g,'fabric-hair-bun',[.092,.092,.078],m,[.035,1.77,.196]);}
  if(d.style==='cap'){
  const cap=mat('#4b514e','#8d8a72');add(g,'work-cap',form([[1.83,.005,.005],[1.82,.17,.15],[1.75,.257,.23],[1.71,.25,.224]]),cap);
  const brim=add(g,'cap-visor',new THREE.BoxGeometry(.36,.025,.15),cap,[0,1.723,-.209]);brim.rotation.x=.07;
 }
 if(d.style==='part'){stitchLine(g,[[.02,1.884,-.04],[.035,1.866,-.11],[.04,1.80,-.193]],mat('#8d8069'),.004);}
  if(d.style==='bob'){const pin=add(g,'cloth-hair-ribbon',new THREE.BoxGeometry(.095,.045,.022),mat(d.accent),[-.207,1.745,-.115]);pin.rotation.z=.3;}
  if(d.style==='wave'){for(const s of [-1,1]){for(let j=0;j<3;j++){const curl=add(g,'sewn-curl',new THREE.TorusGeometry(.047,.014,6,12,Math.PI*1.6),m,[s*(.219-j*.012),1.64-j*.065,.065]);curl.rotation.y=s*.7;}}}
  if(d.style==='crop'){add(g,'cloth-hair-crown',form([[1.90,.005,.005],[1.875,.115,.09],[1.83,.18,.14]]),m);}
}
function batchEmbroidery(g){
 // One draw call per thread material instead of hundreds of separate tiny cylinders.
 const groups=new Map();for(const o of [...g.children]){if(!['hand-stitch','patch-stitch','shoe-lace'].includes(o.name))continue;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,parts:[]});o.updateMatrix();const geo=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix);groups.get(key).parts.push(geo);g.remove(o);o.geometry.dispose();}
 for(const {material,parts} of groups.values()){
  const geo=new THREE.BufferGeometry();for(const key of ['position','normal','uv']){const size=parts[0].getAttribute(key).itemSize,arrays=parts.map(p=>p.getAttribute(key).array),out=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){out.set(a,offset);offset+=a.length;}geo.setAttribute(key,new THREE.BufferAttribute(out,size));}add(g,'batched-embroidery',geo,material);for(const p of parts)p.dispose();
 }
}
export function buildPuppet(index){
 const d=puppetDesigns[index],g=new THREE.Group(),pose=poseDesigns[index],arms=[];g.name='person';g.userData.design=d;g.userData.poseName=pose.name;
 const coat=mat(d.coat),thread=mat('#a9a596'),pants=mat('#3f443c'),boots=mat('#39352e'),fabric=mat('#'+new THREE.Color(d.coat).multiplyScalar(.70).getHexString()),hair=mat(d.hair);
 soft(g,'hips',[.185,.105,.16],pants,[0,.77,-.015]);
 for(const s of [-1,1]){const x=s*.115;
  tube(g,'thigh',[x,.77,-.03],[x,.70,-.40],.074,pants);tube(g,'shin',[x,.68,-.40],[x,.18,-.45],.056,pants);
  soft(g,'shoe',[.083,.067,.145],boots,[x,.105,-.50]);
  for(let j=0;j<3;j++)tube(g,'shoe-lace',[x-.035,.159,-.55+j*.025],[x+.035,.159,-.55+j*.025],.003,thread);
 }
 add(g,'torso',form([[1.325,.07,.08],[1.28,.185,.125],[1.18,.211,.143],[1.04,.177,.143],[.88,.18,.151],[.80,.14,.12],[.79,.005,.005]]),coat);
 // A standing collar of old cloth: high, stiff and slightly uneven at the throat.
 add(g,'neck',new THREE.CylinderGeometry(.072,.086,.13,20),mat(d.coat),[0,1.35,-.005]);
 const collar=add(g,'high-collar',form([[1.436,.050,.046],[1.402,.070,.064],[1.336,.086,.080],[1.288,.097,.090]]),mat(d.coat));
 void collar;
 ringStitch(g,1.408,.062,.057,thread,.0022);
 // Slightly oversized stuffed head, tapered jaw and cheek volume. The face is painted onto woven linen.
 const headStart=g.children.length;
  const headMat=new THREE.MeshStandardMaterial({map:clothTexture(['#aba9a2','#a09e98','#b3b1aa','#a3a19b','#aeaba4','#9e9c96'][index],null,true,index),roughness:1,metalness:0});
  const faceWidth=[1,.96,.91,.94,1.02,.96][index];
  add(g,'head',form(headProfile(index),36,headDeform(index)),headMat);
 hairCap(g,d,index,hair);
 // The depth of the face differs per doll, so the features have to follow it.
 const faceZ=[.204,.218,.194,.208,.214,.196][index],eyeX=[.080,.092,.066,.087,.095,.071][index],eyeDrop=[[.006,.002],[-.008,.004],[.005,-.002],[-.006,.005],[.008,-.003],[.003,-.001]][index];
 const browMat=hardMat('#3d3a33',.82,0),mouthMat=hardMat('#332f29',.86,0);
 const browShapes=[[-.012,.008],[.017,-.017],[-.018,-.008],[.023,.012],[.012,.025],[-.006,-.015]];
 for(const side of [-1,1]){const x=side*eyeX,y=1.672+[.005,-.006,.011,.015,0,.008][index];
  const brow=add(g,'expressive-brow',new THREE.BoxGeometry([.047,.057,.039,.052,.051,.043][index],.011,.009),browMat,[x,y,-(faceZ+.003)]);brow.rotation.z=side*(browShapes[index][side<0?0:1]*12)-side*.10;}
 // Button eyes pressed into the linen, so the face still reads from the far seat.
 const buttonMat=hardMat('#1c1b19',.86,0),rimMat=hardMat('#6e6a61',.82,0);
 for(const side of [-1,1]){
  const x=side*eyeX,y=1.628+eyeDrop[side<0?0:1],z=-(faceZ+.0025);
  const rim=add(g,'button-eye-rim',new THREE.CylinderGeometry(.023,.023,.005,16),rimMat,[x,y,z]);rim.rotation.x=Math.PI/2;
  const b=add(g,'button-eye',new THREE.CylinderGeometry(.017,.018,.008,16),buttonMat,[x,y,z-.0035]);b.rotation.x=Math.PI/2;
  tube(g,'button-thread',[x-.006,y-.006,z-.009],[x+.006,y+.006,z-.009],.0022,hardMat('#5f5a4e',.85,0));
 }
 // Six stitched mouths: a seam with small uneven tucks. No smile, no curve.
 const mouths=[[-.030,1.536,-.171, .002,1.531,-.176, .030,1.540,-.170],[-.026,1.532,-.172, .004,1.536,-.176, .028,1.530,-.171],[-.022,1.537,-.170, .000,1.531,-.176, .020,1.538,-.171],[-.032,1.529,-.170, .000,1.536,-.176, .026,1.531,-.170],[-.028,1.540,-.170, .002,1.528,-.177, .030,1.538,-.170],[-.024,1.534,-.171, .000,1.537,-.176, .026,1.533,-.170]][index];
 const mc=new THREE.CatmullRomCurve3([new THREE.Vector3(...mouths.slice(0,3)),new THREE.Vector3(...mouths.slice(3,6)),new THREE.Vector3(...mouths.slice(6,9))]);add(g,'stitched-mouth',new THREE.TubeGeometry(mc,10,.0032,5,false),mouthMat);
 for(let i=0;i<3;i++){const t=-.016+i*.016;const p=mc.getPoint(.5+t*.06);tube(g,'hand-stitch',[p.x-.008,p.y-.006,p.z-.002],[p.x+.008,p.y+.006,p.z-.002],.0021,thread);}
 if(index===1){for(const side of [-1,1])tube(g,'stitched-moustache',[side*.008,1.556,-.185],[side*.050,1.550,-.174],.006,browMat);}
 if(index===5){const wire=hardMat('#8f9187',.35,.5);for(const side of [-1,1]){const rim=add(g,'wire-spectacle',new THREE.TorusGeometry(.047,.003,5,24),wire,[side*.071,1.652,-(faceZ+.006)]);}tube(g,'spectacle-bridge',[-.024,1.652,-(faceZ+.008)],[.024,1.652,-(faceZ+.008)],.003,wire);}

 const headRig=new THREE.Group();headRig.name='expressive-head';headRig.position.y=1.42;
 for(const child of g.children.slice(headStart)){g.remove(child);child.position.y-=1.42;headRig.add(child);}g.add(headRig);batchEmbroidery(headRig);
 headRig.rotation.z=[-.07,.035,-.09,.10,-.045,.12][index];
 // Articulated, deliberately different silhouettes; no generic symmetric raised arms.
 for(const side of [-1,1]){
  const [elbow,tip]=side<0?pose.left:pose.right,shoulder=[side*.19,1.255,-.015],start=g.children.length;
  tube(g,'upper-arm',shoulder,elbow,.059,coat);tube(g,'forearm',elbow,tip,.050,coat);
  const wrist=new THREE.Vector3(...tip),direction=wrist.clone().sub(new THREE.Vector3(...elbow)).normalize();
  const cuffEnd=wrist.clone().addScaledVector(direction,-.035);tube(g,'cuff',cuffEnd.toArray(),wrist.toArray(),.052,mat(d.accent));
  const hand=new THREE.Group();hand.name='sewn-mitten';hand.position.copy(wrist).addScaledVector(direction,.035);g.add(hand);
  add(hand,'palm',form([[.024,.027,.026],[.014,.040,.031],[-.018,.040,.032],[-.028,.026,.025]],12),fabric);
  for(let finger=0;finger<4;finger++){const x=-.0315+finger*.021;soft(hand,'cloth-finger',[.008,.015,[.030,.037,.035,.027][finger]],fabric,[x,.003,-.038]);}
  soft(hand,'thumb',[.021,.019,.035],fabric,[-side*.044,-.002,.01]);
  const seam=mat('#575248');for(const dx of [-.019,0,.019])stitchLine(hand,[[dx,.032,-.018],[dx,.033,-.041]],seam,.0024);batchEmbroidery(hand);
  const arm=new THREE.Group();arm.name=side<0?'gesture-left':'gesture-right';arm.position.set(...shoulder);
  for(const child of g.children.slice(start)){g.remove(child);child.position.sub(arm.position);arm.add(child);}g.add(arm);arms.push(arm);
 }
 // Hand-sewn front, horn buttons and repair patches.
 for(let y=.91;y<1.18;y+=.082){const b=add(g,'coat-button',new THREE.CylinderGeometry(.014,.014,.009,12),hardMat('#2e2c28',.8,0),[.015,y,-.151]);b.rotation.x=Math.PI/2;}
 stitchLine(g,[[0,.84,-.151],[0,1.01,-.149],[0,1.19,-.138]],thread,.0028);
 stitchLine(g,[[-.13,.84,.091],[0,.823,.13],[.13,.84,.091]],thread,.0025);
 patch(g,-.095,1.04,-.157,.122,.145,d.patch,thread,-.12);
 patch(g,.045,1.09,.150,.168,.165,d.patch,thread,.08);
 // Six working silhouettes: a nurse's apron, a mechanic's apron and strap, a shawl, a long coat, a camera band, a vest.
 if(index===0){
  const apron=add(g,'nurse-apron',form([[1.24,.088,.086],[1.10,.145,.128],[.94,.152,.132],[.80,.140,.118]]),mat('#75746a'));
  stitchLine(g,[[0,.83,-.135],[0,1.05,-.140],[0,1.22,-.130]],thread,.0024);
  const tie=add(g,'apron-tie',new THREE.BoxGeometry(.26,.022,.018),mat('#6f7166'),[0,1.02,-.142]);tie.rotation.z=.02;
 }else if(index===1){
  add(g,'work-apron',form([[1.20,.10,.148,-.01],[1.07,.185,.159,-.01],[.86,.183,.167,-.01],[.80,.17,.15,-.01]]),mat('#4a4a44'));
  patch(g,0,.99,-.185,.15,.11,d.patch,thread);
  const strap=add(g,'tool-strap',new THREE.BoxGeometry(.032,.30,.014),mat('#3a3a34'),[.06,1.12,-.152]);strap.rotation.z=-.34;
 }else if(index===2){
  add(g,'cashier-shawl',form([[1.35,.088,.098],[1.28,.215,.14],[1.16,.222,.148]]),mat(d.patch));
  const clasp=add(g,'collar-clasp',new THREE.CylinderGeometry(.016,.016,.010,12),hardMat('#3b3a34',.45,.1),[0,1.30,-.120]);clasp.rotation.x=Math.PI/2;
 }else if(index===3){
  const panel=add(g,'long-coat-panel',new THREE.BoxGeometry(.10,.30,.014),mat(d.coat),[.075,1.02,-.150]);panel.rotation.z=-.05;
  const tie=add(g,'cloth-tie',new THREE.BoxGeometry(.030,.17,.012),mat(d.patch),[0,1.205,-.156]);tie.rotation.z=.04;
 }else if(index===4){
  add(g,'patchwork-shawl',form([[1.345,.092,.10],[1.29,.245,.155],[1.18,.26,.166]]),mat(d.patch));
  const band=add(g,'camera-strap',new THREE.BoxGeometry(.028,.34,.014),mat('#33322d'),[-.05,1.10,-.150]);band.rotation.z=.28;
 }else{
  add(g,'knit-vest',form([[1.26,.086,.09],[1.12,.20,.14],[.94,.205,.146],[.84,.19,.13]]),mat(d.patch));
  const scarf=add(g,'hanging-scarf',new THREE.BoxGeometry(.072,.30,.016),mat(d.accent),[-.055,1.13,-.163]);scarf.rotation.z=-.08;
 }
 // A visible repair seam around the rear of the stuffed head (not a scar across a face).
 stitchLine(g,[[0,1.84,.128],[0,1.72,.211],[0,1.59,.208],[0,1.47,.158]],thread,.0024);
 // Distinct occupational silhouettes are interface art, not additional plot evidence.
 const prop=new THREE.Group();prop.name='signature-prop';g.add(prop);
 const ink=mat('#2c322f'),paper=mat('#9b937b'),metal=hardMat('#7d8178',.38,.4);
 if(index===0||index===2){const ledger=add(prop,index===0?'nursing-notebook':'account-ledger',new THREE.BoxGeometry(index===0?.19:.28,.23,.045),mat(index===0?'#3c4a42':'#4a3a3c'),[index===0?-.13:0,1.16,-.34]);ledger.rotation.x=-.15;for(let j=0;j<3;j++)add(prop,'book-binding',new THREE.BoxGeometry(.015,.014,.05),paper,[-.09,1.09+j*.055,-.341]);}
 if(index===1){tube(prop,'wrench-handle',[.33,1.49,-.25],[.36,1.75,-.25],.018,metal);const jaw=add(prop,'wrench-open-jaw',new THREE.TorusGeometry(.045,.015,6,14,Math.PI*1.4),metal,[.36,1.77,-.25]);jaw.rotation.z=-.65;}
 if(index===3){add(prop,'folded-letter',new THREE.BoxGeometry(.13,.10,.018),paper,[-.04,1.30,-.31]);}
 if(index===4){add(prop,'camera-body',new THREE.BoxGeometry(.24,.15,.11),ink,[0,1.16,-.40]);const lens=add(prop,'camera-lens',new THREE.CylinderGeometry(.064,.07,.075,18),metal,[0,1.16,-.49]);lens.rotation.x=Math.PI/2;const glass=add(prop,'camera-glass',new THREE.CylinderGeometry(.049,.049,.008,18),mat('#1d2422'),[0,1.16,-.533]);glass.rotation.x=Math.PI/2;add(prop,'camera-viewfinder',new THREE.BoxGeometry(.06,.04,.05),ink,[.065,1.25,-.4]);}
 if(index===5){const band=add(prop,'headset-band',new THREE.TorusGeometry(.255,.016,6,32,Math.PI),ink,[0,1.62,0]);band.rotation.z=0;for(const side of [-1,1])soft(prop,'headset-earpiece',[.038,.073,.055],ink,[side*.244,1.61,0]);tube(prop,'headset-boom',[-.24,1.58,-.02],[-.12,1.48,-.21],.010,metal);}
 batchEmbroidery(g);
 const baseHead=headRig.rotation.clone(),baseArms=arms.map(a=>a.rotation.clone());
 g.userData.animatePose=(time,speaking)=>{const wave=Math.sin(time*(2.3+index*.18)+index),gain=speaking?1:.15;
  headRig.rotation.set(baseHead.x+wave*.035*gain,baseHead.y+Math.sin(time*1.4+index)*.045*gain,baseHead.z+wave*.018*gain);
  arms.forEach((arm,j)=>{arm.rotation.x=baseArms[j].x+Math.sin(time*(2+index*.17)+j)*.035*gain;arm.rotation.z=baseArms[j].z+wave*[.045,.065,.025,.07,.025,.04][index]*gain*(j?1:-.3);});
  prop.rotation.z=wave*.012*gain;
 };
 return g;
}
