// First original handmade puppet. Procedural volumes/textures, no downloaded model or image mapping.
import * as THREE from './vendor/three.module.js';
const textureCache=new Map();
function surface(color,kind='cloth'){
 const key=color+kind;if(textureCache.has(key))return textureCache.get(key);
 const size=256,c=document.createElement('canvas'),b=document.createElement('canvas');c.width=c.height=b.width=b.height=size;const x=c.getContext('2d'),y=b.getContext('2d');x.fillStyle=color;x.fillRect(0,0,size,size);y.fillStyle='#808080';y.fillRect(0,0,size,size);
 // Broad linen weave + deterministic fiber interruptions, not photographic skin pores.
 for(let i=0;i<size;i+=4){x.strokeStyle=i%8?'#f5edda15':'#0000001c';x.lineWidth=1;x.beginPath();x.moveTo(i,0);x.lineTo(i,size);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(size,i);x.stroke();y.strokeStyle=i%8?'#9b9b9b':'#626262';y.beginPath();y.moveTo(i,0);y.lineTo(i,size);y.stroke();y.beginPath();y.moveTo(0,i);y.lineTo(size,i);y.stroke();}
 for(let i=0;i<360;i++){const a=(i*73)%size,z=(i*109)%size;x.fillStyle=i%3?'#efe3c01b':'#17150f15';x.fillRect(a,z,kind==='hair'?2:1,1+i%3);}
 if(kind==='face'){for(let i=0;i<15;i++){x.fillStyle='#4b453510';x.beginPath();x.ellipse(i*61%size,i*79%size,6+i%6,3+i%4,.3,0,Math.PI*2);x.fill();}}
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=2;const bump=new THREE.CanvasTexture(b);bump.anisotropy=2;const result={map,bump};textureCache.set(key,result);return result;
}
function cloth(color,kind='cloth'){const t=surface(color,kind);return new THREE.MeshStandardMaterial({color:0xffffff,map:t.map,bumpMap:t.bump,bumpScale:kind==='face'?.0025:.0035,roughness:kind==='hair'?.88:.98,metalness:0});}
function solid(color,roughness=.65,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function shape(rings,n=32,deform=null){const pos=[],uv=[],idx=[];rings.forEach(([y,rx,rz,zc=0],j)=>{for(let i=0;i<=n;i++){const t=i/n*Math.PI*2,a=[Math.sin(t)*rx,y,Math.cos(t)*rz+zc];if(deform){const q=deform(t,y);a[0]+=q[0];a[2]+=q[1];}pos.push(...a);uv.push(i/n,j/(rings.length-1));}});for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;idx.push(a,a+1,b,a+1,b+1,b);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function mesh(g,name,geo,mat,p=[0,0,0]){const o=new THREE.Mesh(geo,mat);o.name=name;o.position.set(...p);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function box(g,name,w,h,d,m,p){return mesh(g,name,new THREE.BoxGeometry(w,h,d),m,p);}
function ball(g,name,scale,m,p,n=16){const o=mesh(g,name,new THREE.SphereGeometry(1,n,12),m,p);o.scale.set(...scale);return o;}
function rod(g,name,a,b,r,m,n=10){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const o=mesh(g,name,new THREE.CylinderGeometry(r*.92,r,d.length(),n),m,av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
function line(g,name,pts,m,r=.0028){return mesh(g,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.max(6,pts.length*3),r,5,false),m);}
function stitches(g,pts,m,r=.0023){const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),n=Math.max(4,Math.floor(c.getLength()/.035));for(let i=0;i<n;i++)rod(g,'fine-embroidery',c.getPoint(i/n).toArray(),c.getPoint(Math.min(1,(i+.45)/n)).toArray(),r,m,5);}
function batch(g){const buckets=new Map();g.traverse(o=>{if(!o.isMesh||o.name!=='fine-embroidery')return;const k=o.parent.uuid+':'+o.material.uuid;if(!buckets.has(k))buckets.set(k,{parent:o.parent,mat:o.material,objects:[]});buckets.get(k).objects.push(o);});for(const {parent,mat,objects}of buckets.values()){const parts=[];for(const o of objects){o.updateMatrix();parts.push((o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix));parent.remove(o);o.geometry.dispose();}const joined=new THREE.BufferGeometry();for(const a of ['position','normal','uv']){const attrs=parts.map(p=>p.getAttribute(a));const data=new Float32Array(attrs.reduce((n,x)=>n+x.array.length,0));let at=0;for(const q of attrs){data.set(q.array,at);at+=q.array.length;}joined.setAttribute(a,new THREE.BufferAttribute(data,attrs[0].itemSize));}mesh(parent,'batched-embroidery',joined,mat);for(const p of parts)p.dispose();}}
function pocket(g,m,thread){const o=box(g,'apron-pocket',.17,.155,.018,m,[-.015,1.013,-.184]);o.rotation.z=-.035;line(g,'pocket-bound-edge',[[-.099,1.075,-.195],[-.10,.95,-.196],[.068,.95,-.196],[.068,1.075,-.195]],m,.006);stitches(g,[[-.092,1.07,-.199],[-.091,.957,-.199],[.061,.957,-.199],[.061,1.07,-.199]],thread);}
export function buildRefinedPuppet(){
 const root=new THREE.Group();root.name='person';root.userData.design={name:'原创木偶01',detail:'不对称短发 · 梨形布脸 · 灰绿高领 · 旧围裙 · 记录本'};root.userData.poseName='合膝静坐，护住记录本';root.userData.refined=true;
 const coat=cloth('#4a5646'),apron=cloth('#928d78'),face=cloth('#b4a58b','face'),hair=cloth('#302c27','hair'),pants=cloth('#41453c'),shoe=solid('#2e2923',.82),sole=solid('#1a1916',.96),thread=solid('#a69a7e',.98),darkThread=solid('#403b30',.95),patch=cloth('#5b3437'),button=solid('#2a221a',.34,.03),rim=solid('#756047',.52,.05);
 // Stable legs and boots remain under the seat, compatible with existing table clearance.
 ball(root,'hips',[.15,.095,.14],pants,[0,.77,.015]);
 for(const sign of [-1,1]){const x=sign*.095;rod(root,'thigh',[x,.77,-.03],[x,.69,-.37],.062,pants,12);rod(root,'shin',[x,.66,-.37],[x,.16,-.43],.049,pants,12);ball(root,'shoe',[.073,.062,.145],shoe,[x,.10,-.48]);const base=box(root,'shoe-sole',.15,.025,.27,sole,[x,.05,-.48]);base.rotation.x=.025;line(root,'boot-toe-seam',[[x-.055,.13,-.54],[x,.15,-.59],[x+.055,.13,-.54]],thread,.0028);for(let j=0;j<3;j++)rod(root,'fine-embroidery',[x-.027,.155,-.50+j*.025],[x+.027,.155,-.49+j*.025],.0028,darkThread,6);}
 const torsoPivot=new THREE.Group();torsoPivot.name='refined-torso-pivot';torsoPivot.position.set(0,.79,0);root.add(torsoPivot);
 // Model body in local upper-body frame, then move to pivot space as one coherent group.
 const upper=new THREE.Group();upper.position.y=-.79;torsoPivot.add(upper);
 mesh(upper,'torso',shape([[.79,.08,.10],[.83,.13,.13],[1.0,.14,.135],[1.18,.175,.125],[1.27,.17,.115],[1.31,.065,.075]],32),coat);
 const collar=mesh(upper,'high-collar',shape([[1.27,.076,.073],[1.34,.063,.061],[1.41,.050,.047]],28),coat);
 stitches(upper,[[0,1.30,-.080],[0,1.18,-.13],[0,.89,-.139]],thread,.0025);
 for(let j=0;j<3;j++){const y=1.19-j*.095,o=mesh(upper,'horn-shirt-button',new THREE.CylinderGeometry(.010,.010,.008,12),button,[.018,y,-.139]);o.rotation.x=Math.PI/2;}
 const apronMesh=mesh(upper,'oatmeal-apron',shape([[.81,.125,.122,-.021],[.86,.141,.137,-.020],[1.06,.145,.146,-.018],[1.20,.094,.114,-.025],[1.27,.069,.077,-.025]],28,(t,y)=>[Math.sin(t*3)*.0025,Math.max(0,-Math.cos(t))*Math.sin(y*35)*.003]),apron);
 for(const sign of [-1,1]){const strap=box(upper,'apron-shoulder-strap',.025,.20,.015,apron,[sign*.09,1.26,-.102]);strap.rotation.z=sign*-.12;}
 line(upper,'apron-hem',[[-.12,.825,-.13],[0,.817,-.161],[.12,.825,-.13]],thread,.0032);pocket(upper,apron,thread);
 const repair=box(upper,'burgundy-repair-patch',.067,.079,.01,patch,[.085,.892,-.17]);repair.rotation.z=.16;for(let j=0;j<3;j++){rod(upper,'fine-embroidery',[.055+j*.026,.927,-.178],[.053+j*.026,.916,-.179],.002,thread,5);rod(upper,'fine-embroidery',[.054+j*.026,.867,-.178],[.052+j*.026,.856,-.179],.002,thread,5);}
 // Long neck and pear-shaped asymmetrical head, not a sphere with a painted face.
 mesh(upper,'neck',shape([[1.36,.049,.045],[1.44,.044,.044],[1.49,.047,.043]],24),face);
 const head=new THREE.Group();head.name='expressive-head';head.position.set(0,1.46,0);head.rotation.z=-.065;upper.add(head);
 const headRings=[[-.025,.037,.043],[-.005,.075,.074],[.035,.13,.117],[.095,.176,.146],[.17,.191,.158],[.25,.174,.151],[.325,.137,.13],[.37,.065,.072],[.383,.008,.009]];
 mesh(head,'head',shape(headRings,40,(t,y)=>[.009*Math.sin(t+.2)*Math.max(0,1-y/.4),.004*Math.sin(t*2)]),face);
 // Sculpted nose follows front-facing -Z direction. Tiny fabric ears separate from hair.
 const nose=mesh(head,'stuffed-triangle-nose',new THREE.ConeGeometry(.027,.074,3),face,[.008,.163,-.171]);nose.rotation.x=-Math.PI/2;nose.rotation.z=.1;
 for(const sign of [-1,1])ball(head,'fabric-ear',[.027,.043,.023],face,[sign*.177,.16,.012]);
 // Real 3D convex horn buttons with four recessed holes and X thread.
 for(const sign of [-1,1]){const x=sign*.076,y=.221+(sign<0?.006:-.008),rad=sign<0?.041:.037;const eye=new THREE.Group();eye.name=sign<0?'left-button-eye':'right-button-eye';eye.position.set(x,y,-.145);head.add(eye);const border=mesh(eye,'button-eye-rim',new THREE.CylinderGeometry(rad+.004,rad+.005,.009,24),rim);border.rotation.x=Math.PI/2;const disk=mesh(eye,'button-eye',new THREE.CylinderGeometry(rad,rad,.013,24),button,[0,0,-.005]);disk.rotation.x=Math.PI/2;for(const a of [-1,1])for(const b of [-1,1]){const hole=mesh(eye,'four-hole-recess',new THREE.CylinderGeometry(.0043,.0043,.002,8),sole,[a*.011,b*.011,-.013]);hole.rotation.x=Math.PI/2;}rod(eye,'button-thread',[-.011,-.011,-.015],[.011,.011,-.015],.0025,thread,6);rod(eye,'button-thread',[-.011,.011,-.015],[.011,-.011,-.015],.0025,thread,6);}
 const browL=line(head,'left-embroidered-brow',[[-.108,.287,-.126],[-.077,.297,-.139],[-.047,.283,-.143]],darkThread,.0045);const browR=line(head,'right-embroidered-brow',[[.042,.279,-.144],[.071,.285,-.142],[.104,.277,-.128]],darkThread,.004);
 line(head,'stitched-mouth',[[-.039,.091,-.147],[.002,.082,-.158],[.037,.092,-.146]],darkThread,.0035);for(let j=0;j<4;j++){const x=-.028+j*.018;rod(head,'mouth-cross-stitch',[x-.003,.079,-.160],[x+.004,.096,-.159],.0019,thread,5);}
 stitches(head,[[.005,.371,.073],[.008,.30,.146],[.003,.18,.165],[-.008,.05,.123]],darkThread,.0028);
 // Continuous bob shell, four broad sculpted locks. No hair strands or physics.
 const hp=[],hu=[],hi=[],N=40,M=12;for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){const t=i/N*Math.PI*2,front=Math.max(0,-Math.cos(t)),edge=1.99-front*.85+.07*Math.sin(t+.3),phi=.035+(edge-.035)*j/M;const y=.211+Math.cos(phi)*.205;hp.push(Math.sin(t)*Math.sin(phi)*.201+(j/M)*.003,y,Math.cos(t)*Math.sin(phi)*.175+.01);hu.push(i/N,j/M);}for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;hi.push(a,b,a+1,a+1,b,b+1);}const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));hg.setAttribute('uv',new THREE.Float32BufferAttribute(hu,2));hg.setIndex(hi);hg.computeVertexNormals();const hm=mesh(head,'sculpted-fabric-bob',hg,hair);hm.material.side=THREE.DoubleSide;
 const lock1=mesh(head,'asymmetric-left-lock',shape([[.05,.022,.022],[.10,.042,.035],[.21,.047,.040],[.32,.03,.024],[.37,.005,.005]],16),hair,[-.166,0,-.016]);lock1.rotation.z=-.12;
 const lock2=mesh(head,'short-right-lock',shape([[.083,.020,.021],[.14,.039,.031],[.24,.038,.033],[.33,.022,.022],[.37,.004,.004]],16),hair,[.164,0,-.014]);lock2.rotation.z=.11;
 line(head,'bob-seam-left',[[-.095,.377,.052],[-.17,.30,.08],[-.197,.16,.042],[-.19,.05,.006]],darkThread,.0028);
 const clip=box(head,'fabric-hair-clip',.063,.025,.014,patch,[-.174,.285,-.074]);clip.rotation.z=.32;rod(head,'fine-embroidery',[-.194,.279,-.084],[-.155,.29,-.084],.0018,thread,5);
 // Real shoulder -> elbow -> wrist pivots. Notebook is carried by left wrist, not floating at root.
 const arms=[];
 function arm(sign){const shoulder=new THREE.Group();shoulder.name=sign<0?'gesture-left':'gesture-right';shoulder.position.set(sign*.16,1.255,0);upper.add(shoulder);const elbow=new THREE.Group();elbow.name=sign<0?'elbow-left':'elbow-right';const elbowP=[sign*.045,-.18,-.08];elbow.position.set(...elbowP);shoulder.add(elbow);rod(shoulder,'upper-arm',[0,0,0],elbowP,.047,coat,12);ball(shoulder,'cloth-shoulder',[.055,.062,.052],coat,[0,-.035,-.008]);const tip=[-sign*.038,-.038,-.18];rod(elbow,'forearm',[0,0,0],tip,.042,coat,12);const wrist=new THREE.Group();wrist.name=sign<0?'wrist-left':'wrist-right';wrist.position.set(...tip);elbow.add(wrist);const cuff=mesh(wrist,'cuff',new THREE.CylinderGeometry(.045,.044,.038,12),apron);cuff.rotation.x=Math.PI/2;const palm=ball(wrist,'palm',[.038,.023,.052],face,[0,-.005,-.035]);ball(wrist,'thumb',[.017,.019,.029],face,[-sign*.034,-.003,-.032]);line(wrist,'mitten-seam',[[-.027,.011,-.04],[0,.018,-.078],[.026,.011,-.04]],darkThread,.002);arms.push({shoulder,elbow,wrist});return wrist;}
 const leftWrist=arm(-1),rightWrist=arm(1);
 const book=new THREE.Group();book.name='signature-prop';book.position.set(.085,-.045,-.018);book.rotation.set(-.35,-.12,.10);leftWrist.add(book);box(book,'notebook-pages',.16,.018,.19,cloth('#a8a087'),[0,0,0]);for(const y of [-.014,.014])box(book,'dark-green-notebook-cover',.175,.008,.205,cloth('#35433b'),[0,y,0]);box(book,'notebook-spine',.014,.04,.205,coat,[-.083,0,0]);for(let i=0;i<3;i++)rod(book,'binding-thread',[-.093,-.015,-.06+i*.06],[-.093,.015,-.06+i*.06],.0023,thread,6);
 batch(root);
 const baseHead=head.rotation.clone(),baseBrowL=browL.position.clone(),baseBrowR=browR.position.clone();let active=null;
 const rigs=arms.map(a=>({...a,shoulderBase:a.shoulder.rotation.clone(),elbowBase:a.elbow.rotation.clone(),wristBase:a.wrist.rotation.clone()}));
 function reset(){head.rotation.copy(baseHead);torsoPivot.rotation.set(0,0,0);torsoPivot.position.y=.79;browL.position.copy(baseBrowL);browR.position.copy(baseBrowR);for(const a of rigs){a.shoulder.rotation.copy(a.shoulderBase);a.elbow.rotation.copy(a.elbowBase);a.wrist.rotation.copy(a.wristBase);}}
 function animate(time,speaking=false){reset();const idle=Math.sin(time*1.18),gain=speaking?1:.25;head.rotation.y+=Math.sin(time*.65)*.018;head.rotation.x+=idle*.012*gain;torsoPivot.scale.y=1+Math.sin(time*1.1)*.003;
  if(!active)return;const t=Math.min(1,Math.max(0,(time-active.start)/active.duration)),env=Math.sin(Math.PI*t),wave=Math.sin(t*Math.PI*4),r=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(r){head.rotation.z+=.025*env;}
  else if(active.kind==='nod')head.rotation.x+=.11*wave*env;
  else if(active.kind==='shake')head.rotation.y+=.16*wave*env;
  else if(active.kind==='wave'){rigs[1].shoulder.rotation.z-=.20*env;rigs[1].elbow.rotation.x-=.52*env;rigs[1].wrist.rotation.y+=.13*wave*env;}
  else if(active.kind==='chuckle'){head.rotation.z-=.065*env;head.rotation.x+=.07*env;torsoPivot.rotation.x+=.03*env;torsoPivot.position.y+=Math.sin(t*Math.PI*7)*.007*env;rigs[1].shoulder.rotation.x-=.12*env;rigs[1].elbow.rotation.x-=.70*env;rigs[1].wrist.rotation.z-=.08*env;browL.position.y+=.005*env;browR.position.y+=.003*env;}
  if(t>=1){active=null;reset();}
 }
 root.userData.playGesture=(kind,at=performance.now()/1000)=>{if(!['nod','shake','wave','chuckle'].includes(kind))return false;active={kind,start:at,duration:kind==='chuckle'?1.9:1.5};return true;};
 root.userData.gestureActive=()=>!!active;
 root.userData.animatePose=animate;
 root.userData.tickRefined=animate;
 root.userData.inspectRefined=()=>{let meshes=0,triangles=0;const mats=new Set(),textures=new Set();root.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;for(const m of(Array.isArray(o.material)?o.material:[o.material])){mats.add(m.uuid);for(const key of ['map','bumpMap'])if(m[key])textures.add(m[key].uuid);}});return {refined:true,design:root.userData.design,meshes,triangles,materials:mats.size,textures:textures.size,activeGesture:active?.kind||null,head:head.rotation.toArray().slice(0,3),rightElbow:rigs[1].elbow.rotation.toArray().slice(0,3),notebookParent:book.parent.name,localHeight:new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y};};
 return root;
}
