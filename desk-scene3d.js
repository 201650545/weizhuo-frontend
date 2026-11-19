let inspectionHidden=[],inspectionFill=null,inspectionFillTarget=null;
function restoreRefinedInspection(){for(const [obj,visible]of inspectionHidden)obj.visible=visible;inspectionHidden=[];if(inspectionFill)inspectionFill.visible=false;}
function refinedScreenBounds(){const b=new THREE.Box3().setFromObject(actors[0].body),r=viewport.getBoundingClientRect(),pts=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);pts.push({x:(p.x+1)*r.width/2,y:(1-p.y)*r.height/2});}return {left:Math.min(...pts.map(p=>p.x)),right:Math.max(...pts.map(p=>p.x)),top:Math.min(...pts.map(p=>p.y)),bottom:Math.max(...pts.map(p=>p.y))};}
function applyRefinedInspection(){
 const cfg=window.__puppetInspection;
 // Presentation mode is reversible; it uses the same scene and same mesh.
 if(!cfg?.enabled)return;
 const preserve=(obj,visible)=>{inspectionHidden.push([obj,obj.visible]);obj.visible=visible;};
 preserve(roomEnvironment.root,false);
 for(const a of actors)preserve(a.g,a.index===0);
 for(const child of turntable.children)if(child!==actors[0].g)preserve(child,false);
 const outside=scene.getObjectByName('outside-dark-floor');if(outside)preserve(outside,false);
 actors[0].g.visible=true;actors[0].g.updateMatrixWorld(true);
 const angle=Number(cfg.angle)||0,close=cfg.close===true;
 const focusPoint=actors[0].g.localToWorld(new THREE.Vector3(0,close?1.65:.80,0));
 const camLocal=new THREE.Vector3(Math.sin(angle)*(close?.85:3.8),close?1.67:1.42,-Math.cos(angle)*(close?.85:3.8));
 if(!inspectionFill){inspectionFillTarget=new THREE.Object3D();scene.add(inspectionFillTarget);inspectionFill=new THREE.SpotLight(0xffdfb2,8,4.5,.75,.9,2);inspectionFill.name='inspection-only-soft-fill';inspectionFill.target=inspectionFillTarget;scene.add(inspectionFill);}
 inspectionFill.visible=true;inspectionFill.position.copy(actors[0].g.localToWorld(camLocal.clone().add(new THREE.Vector3(-.35,.35,0))));inspectionFillTarget.position.copy(focusPoint);
 camera.position.copy(actors[0].g.localToWorld(camLocal));camera.lookAt(focusPoint);
 const b=viewport.getBoundingClientRect();camera.aspect=b.width/Math.max(1,b.height);camera.fov=close?37:52;camera.near=.035;camera.updateProjectionMatrix();camera.updateMatrixWorld();
}

// Sample-only rigid puppet gestures and seated-eye camera, no network/player identity changes.
let sampleEmote=null,sampleLastEmote=null;
const sampleRest=new Map();
function triggerSampleEmote(index,kind){
 if(!Number.isInteger(index)||index<0||index>=playerCount||!['nod','shake','chuckle','wave'].includes(kind))return false;
 if(actors[index].body.userData.playGesture){sampleLastEmote={index,kind};return actors[index].body.userData.playGesture(kind,performance.now()/1000);}
 if(sampleEmote)resetSamplePose(sampleEmote.index);
 sampleEmote={index,kind,start:performance.now(),duration:kind==='chuckle'?1800:1400};sampleLastEmote={index,kind};return true;
}
function sampleRig(index){
 if(sampleRest.has(index))return sampleRest.get(index);
 const body=actors[index].body,head=body.getObjectByName('expressive-head'),left=body.getObjectByName('gesture-left'),right=body.getObjectByName('gesture-right');
 const rig={body,head,left,right,bodyRotation:body.rotation.clone(),bodyY:body.position.y,headRotation:head.rotation.clone(),leftRotation:left.rotation.clone(),rightRotation:right.rotation.clone()};sampleRest.set(index,rig);return rig;
}
function resetSamplePose(index){const r=sampleRig(index);r.body.rotation.copy(r.bodyRotation);r.body.position.y=r.bodyY;r.head.rotation.copy(r.headRotation);r.left.rotation.copy(r.leftRotation);r.right.rotation.copy(r.rightRotation);}
function sampleSeatSnapshot(){const project=name=>{const o=scene?.getObjectByName(name);if(!o)return null;const p=o.getWorldPosition(new THREE.Vector3()).project(camera);return {x:p.x,y:p.y,z:p.z};};const seat=window.__seatImmersion?.seat??0;const actorProjection=actors.filter(a=>a.index<playerCount&&a.index!==seat).map(a=>{const p=a.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,1.45,0)).project(camera);return {index:a.index,x:p.x,y:p.y,z:p.z};});const floor=scene?.getObjectByName('floor-design-options');const selected=floor?.children.find(o=>o.visible);const probe=new THREE.Raycaster(new THREE.Vector3(3,4,0),new THREE.Vector3(0,-1,0));const floorHit=probe.intersectObjects([selected,scene?.getObjectByName('floor')].filter(Boolean),false)[0];return {floorVisibility:{selected:selected?.name,y:selected?.getWorldPosition(new THREE.Vector3()).y,firstSurface:floorHit?.object.name},castVisibility:actors.filter(a=>a.index<playerCount).map(a=>({index:a.index,seatVisible:a.g.visible,bodyVisible:a.body.visible})),verticalFov:camera?.fov,horizontalFov:THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*camera.aspect)),actorProjection,windowProjection:{centre:project('circular-window'),moon:project('moon-outside-window')},enabled:!!window.__seatImmersion?.enabled,seat:window.__seatImmersion?.seat??0,cameraPosition:camera?.position.toArray(),ownVisible:!!actors[window.__seatImmersion?.seat??0]?.g.visible,activeEmote:sampleEmote?{index:sampleEmote.index,kind:sampleEmote.kind,elapsed:performance.now()-sampleEmote.start}:null,emotePose:sampleLastEmote?{head:sampleRig(sampleLastEmote.index).head.rotation.toArray().slice(0,3),bodyY:sampleRig(sampleLastEmote.index).body.position.y,right:sampleRig(sampleLastEmote.index).right.rotation.toArray().slice(0,3)}:null,lastEmote:sampleLastEmote};}
let seatRig=null,seatRigOptions=null,seatRigKey='',seatRigYaw=0,seatRigPitch=0;
// The seat view is owned by the shared camera controller: one preset anchor per seat,
// incremental yaw/pitch, damped placement and the same room bounds as the director camera.
function seatCameraRig(cfg){
 const seat=Math.min(playerCount-1,Math.max(0,cfg.seat||0)),key=seat+'/'+playerCount;
 if(seatRigKey===key&&seatRig)return seatRig;
 const anchor=actors[seat].g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,1.63,0));
 seatRigOptions={presets:{firstPerson:{position:anchor.toArray(),target:[0,1.46,0],fov:78}},fovScale:1};
 seatRig=createCameraController(camera,roomEnvironment.snapshot().bounds,seatRigOptions);
 seatRig.setMode('firstPerson');seatRigKey=key;seatRigYaw=0;seatRigPitch=0;
 return seatRig;
}
function applySeatedSample(){
 const cfg=window.__seatImmersion;
  const shot=window.__chapelStudyCamera;
  if(shot){camera.position.set(...shot.eye);camera.lookAt(...shot.target);camera.fov=shot.fov;camera.near=.045;camera.updateProjectionMatrix();camera.updateMatrixWorld();}
 for(const a of actors)a.g.visible=a.index<playerCount&&(!window.__roomLobby?.active||a.index<window.__roomLobby.joined)&&!(cfg?.enabled&&a.index===cfg.seat);
 if(cfg?.enabled){
  const rig=seatCameraRig(cfg),yaw=Number(cfg.yaw)||0,pitch=Number(cfg.pitch)||0;
  rig.drag(yaw-seatRigYaw,pitch-seatRigPitch);seatRigYaw=yaw;seatRigPitch=pitch;
  seatRigOptions.fovScale=THREE.MathUtils.clamp(Number(window.__roomFieldScale)||1,.75,1.5);
  const bounds=viewport.getBoundingClientRect();camera.aspect=bounds.width/Math.max(1,bounds.height);camera.near=.045; /* Natural vertical perspective; landscape reveals neighboring seats. */
  rig.update(1);
  updateLampOcclusion();
 }
 if(sampleEmote){
  const e=sampleEmote,r=sampleRig(e.index),t=Math.min(1,Math.max(0,(performance.now()-e.start)/e.duration)),env=Math.sin(Math.PI*t),wave=Math.sin(t*Math.PI*4);
  resetSamplePose(e.index);
  // Reduced motion uses a single gentle inclination, no shoulder shake.
  if(reduced.matches){r.head.rotation.z+=.035*env;}
  else if(e.kind==='nod'){r.head.rotation.x+=.13*wave*env;}
  else if(e.kind==='shake'){r.head.rotation.y+=.18*wave*env;}
  else if(e.kind==='chuckle'){r.head.rotation.z+=.08*env;r.head.rotation.x+=.07*env;r.body.rotation.x+=.035*env;r.body.position.y+=.012*Math.sin(t*Math.PI*8)*env;r.left.rotation.z-=.10*env;r.right.rotation.z+=.10*env;}
  else if(e.kind==='wave'){r.right.rotation.z-=.35*env;r.right.rotation.x+=.10*wave*env;}
  if(t>=1){resetSamplePose(e.index);sampleEmote=null;}
 }
}

import { buildChapelArchitecture, buildFloorOrnaments } from './chapel-architecture.js';
import * as THREE from './vendor/three.module.js';
import { createLightingRig } from './lighting-rig.js';
import { constrainCamera, createCameraController } from './camera-controller.js';
import { buildPuppet } from './puppet-builder.js';
import { loadChapelDrafts, applyDraftSurface, loadChapel4kTextures } from './scene-materials.js';
import { createSpeakerMotion, speakerMotionAt } from './spin-motion.mjs';

// Metres, y-up. A single physical turntable owns the lit floor, table, chairs and cast.
const D = Object.freeze({ tableRadius:1.86, tableTop:1.24, tableBottom:1.12, seatRadius:2.18, seatHeight:.65, transitionMs:1100 });
const names=['沈知夏','周启明','林素琴','许承安','何映秋','陈默','演示席位7','演示席位8'];
let playerCount=6, seatedVisible=6, focusMode='light';
const seatAngle=i=>i*TAU/playerCount;
const coats=[0x718b7c,0x63798a,0x967968,0x9b835a,0x7b8868,0x637f7c];
const meshList=[], actors=[], targets=[], colliders=[];
let roomEnvironment,roomMix=1,activityMix=0;
const defaults=Object.freeze({roomHalf:6.0,activityHalf:3.5,speakerHalf:1.75,readElevation:.72,speakerElevation:.42,spinMs:2000,spinDecel:3,transitionMs:1100,roomBrightness:1,spotlight:24,gesture:1});
const settings={...defaults};
const limits={roomHalf:[4.5,7.5],activityHalf:[3.2,4.8],speakerHalf:[1.65,2.5],readElevation:[.45,1.05],speakerElevation:[.25,.65],spinMs:[1200,10000],spinDecel:[2,5],transitionMs:[250,2500],roomBrightness:[.5,1.5],spotlight:[0,30],gesture:[0,1]};
let floorGlow=0;let floorInlayMaterial;
let turntable, speakerLight, speakerRimLight, speakerLightTarget, speakingRole=0, spin=null, spinSerial=0;const spinTrace=[];
const TAU=Math.PI*2, STAGE_RADIUS=3.50;
// Free exploration: yaw / pitch / zoom offsets around a seat anchor. The seat is a camera anchor only and never changes the private role.
const EXPLORE_LIMITS={yaw:[-Math.PI,Math.PI],pitch:[-.30,.30],zoom:[.65,1.35]};
const exploreState={active:false,seat:null,yaw:0,pitch:0,zoom:1};
let lampOcclusionSuppressed=false,lampBlocksTable=false;let lampParts=[];
// Baseline framing of the previous 392x617 canvas. A taller viewport widens the vertical field so the horizontal table scale survives.
const BASE_ASPECT=392/617;
const LAMP_PARTS=['lamp-cable','fluorescent-housing','fluorescent-diffuser'];
// Discussion and accusation keep every player inside the frame; the accusation stays closer to the table.
const ACTIVITY_WIDEN=1.12;
// The frame is measured on the real full height canvas: no actor may be cut at the left or right edge.
const ACTIVITY_FIT=.94,ACCUSE_RATIO=.90,ACTIVITY_HALF_MAX=7.5;
const probeCamera=new THREE.PerspectiveCamera(40,1,.1,80);
// The name plates live in the band between the real poster UI boxes, measured from the DOM.
const PLATE_MARGIN=12;
const PLATE_TOP_BOXES=['.top','.camera-bar span','.explore-hint','.act-tag','.clock','.phone-shell>header','.status','.phase-control'];
const PLATE_BOTTOM_BOXES=['.object.envelope','.object.memo','.sealed','.task','.bottom-nav','.preview-caption'];
const PLATE_RESERVED_BOXES=[...PLATE_TOP_BOXES,...PLATE_BOTTOM_BOXES];
const PLATE_WIDTH=74,PLATE_HEIGHT=34;
// The discussion and accusation frames widen smoothly so nobody is cropped by the poster frame.
let activityWiden=1;
const framingInfo={w:0,h:0,band:{top:0,bottom:0,left:0,right:0},plates:[],actors:[]};
const wrap=a=>((a%TAU)+TAU)%TAU;const ease=t=>t*t*t*(t*(t*6-15)+10);
// Speaker motion has a timed two-turn phase and a separate slow alignment phase.
// Camera and return-to-room easing remain independent.
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.86,metalness:0,...extra});
floorInlayMaterial=material(0x6b716e,{metalness:.3,roughness:.62,emissive:0x6f8f99,emissiveIntensity:.025});
let fourK = null;
async function setChapel4kMaterials(enabled){
  if(!enabled){roomEnvironment.setStone4k(null);return false;}
  fourK ??= loadChapel4kTextures();
  const tex = await fourK;
  const ok = !!(tex && (tex.stoneDiffuse || tex.floorDiffuse));
  if(ok)roomEnvironment.setStone4k(tex);
  renderFrame();
  return ok;
}
async function setChapelDraftMaterials(enabled){
 const revision=++draftRevision;
 const draft=enabled?await (draftMaps??=loadChapelDrafts()):null;
 if(revision!==draftRevision)return false;
 roomEnvironment.setDraftMaterials(draft);
 for(const m of [wood,tableTopWood])applyDraftSurface(m,draft?.oak,.61,.016);
 applyDraftSurface(trim,draft?.brass,.50,.008);
 for(const a of actors)a.chair.traverse(o=>{if(!o.isMesh)return;if(['seat-cushion','chair-leg','back-post','high-back-panel','pointed-oak-chair-crest','chair-side-stretcher'].includes(o.name))applyDraftSurface(o.material,draft?.oak,.66,.016);else if(o.name==='chair-brass-stud')applyDraftSurface(o.material,draft?.brass,.5,.008);});
 renderFrame();return !!draft;
}
let draftMaps,draftRevision=0;
const wood=material(0x30231e),tableTopWood=material(0x67503a,{roughness:.52}),trim=material(0x67503a,{roughness:.52,metalness:.35}),felt=material(0x27332f),skin=material(0xc5b098),hair=material(0x383631),trousers=material(0x323b36),shoe=material(0x262c28),button=material(0x252c26),stitch=material(0xbaa987);
// Subtle deterministic woven felt, authored locally rather than an external asset.
{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#c3c3c3';x.fillRect(0,0,128,128);for(let i=0;i<128;i+=3){x.strokeStyle=i%2?'#b7b7b7':'#d0d0d0';x.beginPath();x.moveTo(i,0);x.lineTo(i,128);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(128,i);x.stroke();}const map=new THREE.CanvasTexture(c);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(8,8);felt.map=map;felt.roughness=.98;}
function mesh(g,m,geo,mat,name,pos=[0,0,0]){const o=new THREE.Mesh(geo,mat);o.name=name;o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;g.add(o);meshList.push(o);return o;}
function box(g,name,w,h,d,mat,x,y,z){return mesh(g,null,new THREE.BoxGeometry(w,h,d),mat,name,[x,y,z]);}
function ellipsoid(g,name,xr,yr,zr,mat,x,y,z){const o=mesh(g,null,new THREE.SphereGeometry(1,22,16),mat,name,[x,y,z]);o.scale.set(xr,yr,zr);return o;}
function cylinder(g,name,r1,r2,h,mat,x,y,z,n=32){return mesh(g,null,new THREE.CylinderGeometry(r1,r2,h,n),mat,name,[x,y,z]);}
function rod(g,name,a,b,r,mat){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const o=cylinder(g,name,r,r,delta.length(),mat,...av.clone().add(bv).multiplyScalar(.5).toArray(),12);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
function decorativeCurve(g,name,points,r,m){const o=mesh(g,null,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,r,6,false),m,name);return o;}
function modelActor(index){
 const g=new THREE.Group();g.name='seat-'+index;const theta=seatAngle(index);g.position.set(-Math.sin(theta)*D.seatRadius,0,Math.cos(theta)*D.seatRadius);g.rotation.y=-theta;
 const chair=new THREE.Group();chair.name='chair';g.add(chair);
 box(chair,'seat-cushion',.66,.10,.58,wood,0,.60,.05);
 box(chair,'seat-pad',.54,.045,.47,material(0x332a2c),0,.671,.04);
 for(const x of [-.28,.28])for(const z of [-.20,.30])box(chair,'chair-leg',.065,.56,.065,wood,x,.28,z);
 // A tall, wide chair back is behind the torso in world space, never a painted overlay.
 for(const x of [-.30,.30])box(chair,'back-post',.065,.68,.065,wood,x,.88,.34);
 box(chair,'high-back-panel',.56,.47,.065,wood,0,.955,.34);
 box(chair,'back-upholstery',.47,.36,.025,material(0x352b2d),0,.955,.297);
 // Broad shoulder-height back: the upper rail cannot project through a doll's face.
 box(chair,'back-top-rail',.66,.065,.105,trim,0,1.205,.34);
 for(const x of [-.19,0,.19])box(chair,'back-stitch',.012,.30,.004,stitch,x,.955,.282);
 // Gothic crest and carved lancets sit entirely behind the sitter.
 decorativeCurve(chair,'pointed-oak-chair-crest',[[-.3,1.18,.37],[-.23,1.39,.37],[0,1.57,.37],[.23,1.39,.37],[.3,1.18,.37]],.026,wood);
 for(const x of [-.15,.15])decorativeCurve(chair,'chair-lancet-carving',[[x-.095,.91,.39],[x-.08,1.18,.39],[x,1.3,.39],[x+.08,1.18,.39],[x+.095,.91,.39]],.009,stitch);
 for(const x of [-.28,.28]){rod(chair,'chair-side-stretcher',[x,.24,-.2],[x,.24,.3],.024,wood);ellipsoid(chair,'chair-brass-stud',.018,.018,.009,trim,x,1.18,.29);}
 const body=buildPuppet(index%6);g.add(body);
 const marker=new THREE.Mesh(new THREE.TorusGeometry(.39,.014,8,48),material(0xd6b875,{emissive:0x493619,emissiveIntensity:.3}));marker.rotation.x=-Math.PI/2;marker.position.y=.025;g.add(marker);
 // Actor-local materials let cropped foreground become deliberate dark silhouettes,
 // without tinting the table or another player's shared cloth/wood material.
 const localMaterials=new Map();g.traverse(o=>{if(!o.isMesh||o===marker)return;const clone=m=>{if(!localMaterials.has(m)){const c=m.clone();c.userData.focusBase=c.color.clone();localMaterials.set(m,c);}return localMaterials.get(m);};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);});
 const labelAnchor=new THREE.Vector3(0,.11,.43);actors.push({g,chair,body,marker,labelAnchor,index,localMaterials:[...localMaterials.values()]});
 return g;
}
function buildScene(){
 const s=new THREE.Scene();s.background=new THREE.Color(0x020304);s.fog=new THREE.Fog(0x020304,16,25);
  turntable=new THREE.Group();turntable.name='lit-turntable';s.add(turntable);roomEnvironment=buildChapelArchitecture();s.add(roomEnvironment.root);
  // Only the suspended fixture is eligible for occlusion suppression; walls and roof stay closed.
  lampParts=[];roomEnvironment.root.traverse(o=>{if(o.isMesh&&LAMP_PARTS.includes(o.name))lampParts.push(o);});
 createLightingRig(s,turntable);
   // Outside the circle is unlit black, not a second rotating landscape.
  const floor=box(s,'outside-dark-floor',30,.08,30,new THREE.MeshBasicMaterial({color:0x020304}),0,-.09,0);floor.castShadow=false;
  const disk=cylinder(turntable,'illuminated-floor',STAGE_RADIUS,STAGE_RADIUS,.05,material(0x414c50),0,-.04,0,128);disk.castShadow=false;
     const floorDesigns=buildFloorOrnaments(floorInlayMaterial);turntable.add(floorDesigns);
// A fixed room light, not an actor-tracking follow spot. The wide cone covers
   // the table and all six docking positions; people rotate through this light field.
   speakerLight=new THREE.SpotLight(0xd8e5ea,0,8,.34,.72,1.35);speakerLight.name='speaker-focus-light';speakerLight.position.set(0,4.8,0.25);speakerRimLight=new THREE.SpotLight(0x9bb8c4,0,8,.62,.9,1.1);speakerRimLight.name='speaker-rim-light';speakerRimLight.position.set(0,3.55,-2.8);speakerLightTarget=new THREE.Object3D();speakerLightTarget.name='speaker-focus-target';s.add(speakerLight);s.add(speakerRimLight);s.add(speakerLightTarget);speakerLight.target=speakerLightTarget;speakerRimLight.target=speakerLightTarget;
const table=new THREE.Group();table.name='round-table';turntable.add(table);
 cylinder(table,'table-solid',D.tableRadius,D.tableRadius,.12,wood,0,1.18,0,96);
 cylinder(table,'wood-top',D.tableRadius+.006,D.tableRadius+.006,.018,tableTopWood,0,1.246,0,96);
 cylinder(table,'felt-top',D.tableRadius-.075,D.tableRadius-.075,.012,felt,0,1.261,0,96);
 for(const r of [D.tableRadius-.12,D.tableRadius-.04]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.004,8,96),stitch);ring.rotation.x=-Math.PI/2;ring.position.y=1.270;table.add(ring);}
 cylinder(table,'pedestal',.22,.33,1.09,wood,0,.555,0);
 cylinder(table,'carved-table-apron',D.tableRadius-.04,D.tableRadius-.08,.20,wood,0,1.07,0,96);
 for(let i=0;i<24;i++){const a=i*Math.PI/12,r=D.tableRadius-.025;ellipsoid(table,'apron-brass-rosette',.026,.035,.018,trim,Math.sin(a)*r,1.075,Math.cos(a)*r);}
 for(const y of [.18,.38,.96])cylinder(table,'pedestal-moulding',.31,.31,.05,trim,0,y,0,48);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;rod(table,'table-foot',[0,.17,0],[Math.sin(a)*.72,.065,Math.cos(a)*.72],.055,wood);}
 // Real small file folder. Paper stack 30cm wide versus 47cm shoulder width.
 const folder=new THREE.Group();folder.name='public-folder';folder.position.set(-.10,1.277,-.05);folder.rotation.y=-.18;table.add(folder);
 box(folder,'folder-bottom',.30,.007,.23,material(0xb09b6e),0,0,0);
 for(let i=0;i<4;i++)box(folder,'paper',.265,.003,.197,material(0xe6d9b8),0,.007+i*.004,0);
 box(folder,'folder-cover',.30,.006,.23,material(0xd2ba87),0,.026,0);
 box(folder,'folder-tab',.095,.006,.035,material(0xc0a370),-.085,.026,-.122);
 for(let i=0;i<4;i++)box(folder,'printed-line',.14,.0008,.003,material(0x6b6653),.015,.030,(-.04+i*.022));
 targets.push({obj:folder,kind:'evidence'});
 const ballot=new THREE.Group();ballot.name='activity-ballot';ballot.position.set(0,1.283,.35);table.add(ballot);
 box(ballot,'blank-vote-paper',.46,.008,.32,material(0xe0d0a9),0,0,0);const pen=box(ballot,'vote-pencil',.018,.020,.32,material(0x9f6a38),.26,.012,0);pen.rotation.y=.3;ballot.visible=false;
 // No tabletop speaking device; moonlight identifies the speaker.
 
 
 for(let i=0;i<8;i++)turntable.add(modelActor(i));
  layoutPlayers();
 s.updateMatrixWorld(true);return s;
}
let renderer,scene,camera,role=0,view='first',stage='read',frame=0,anim=null,last=0,current={az:0,elev:.62},ready=false;
const viewport=document.getElementById('table-world');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let focus=0,focusLast=0;const cameraPath=[];
const cameraState=()=>({az:current.az,elev:current.elev,focus,half:camera?.userData.half,projection:'perspective',position:camera?.position.toArray(),insideRoom:!!camera&&Math.abs(camera.position.x)<9.9&&Math.abs(camera.position.z)<10.1&&camera.position.y>.08&&camera.position.y<17.1,ballotVisible:!!scene?.getObjectByName('activity-ballot')?.visible});
function desired(v,r){return {az:stage==='turn'&&roomEnvironment?.snapshot().style==='intimate-gothic-chapel'?Math.PI:v==='god'?0:seatAngle(r),elev:v==='god'?.80:(stage==='turn'?settings.speakerElevation:stage==='read'?settings.readElevation:stage==='accuse'?.32:.56)};}
function targetSpin(speaker,az){return seatAngle(speaker)+Math.PI-az;}
let furnitureSize=1;
function layoutPlayers(){const r=D.seatRadius+D.tableRadius*(furnitureSize-1);for(const a of actors){const t=seatAngle(a.index);a.g.visible=a.index<Math.min(playerCount,seatedVisible);a.g.position.set(-Math.sin(t)*r,0,Math.cos(t)*r);a.g.rotation.y=-t;}}
function furnitureState(){const table=scene.getObjectByName('round-table'),a=actors[0];return {tableRadius:D.tableRadius*table.scale.x,seatRadius:Math.hypot(a.g.position.x,a.g.position.z),chairScale:a.chair.scale.x,tableColor:wood.color.getHexString(),chairColor:a.chair.getObjectByName('seat-cushion').material.color.getHexString()};}
function setFurniture(f){const table=scene.getObjectByName('round-table');furnitureSize=THREE.MathUtils.clamp(f.tableSize,.85,1.15);table.scale.set(furnitureSize,1,furnitureSize);for(const name of ['public-folder','activity-ballot']){const o=table.getObjectByName(name);o.scale.set(1/furnitureSize,1,1/furnitureSize);}wood.color.set(f.tableColor);tableTopWood.color.copy(wood.color).lerp(new THREE.Color(0x8a6845),.4);const size=THREE.MathUtils.clamp(f.chairSize,.85,1.15);for(const a of actors){a.chair.scale.set(size,1,size);a.chair.traverse(o=>{if(!o.isMesh)return;if(['seat-cushion','chair-leg','back-post','high-back-panel','pointed-oak-chair-crest','chair-side-stretcher'].includes(o.name)){o.material.userData.focusBase.set(f.chairColor);o.material.color.copy(o.material.userData.focusBase);}});}layoutPlayers();renderFrame();}
function startSpeaker(index){
 if(!Number.isInteger(index)||index<0||index>=playerCount)return;
  speakingRole=index;const from=turntable.rotation.y;
  if(focusMode==='light'&&roomEnvironment?.snapshot().style!=='intimate-gothic-chapel'){spin=null;const az=shortest(seatAngle(index)+Math.PI-from,current.az);anim={from:{...current},to:{az,elev:settings.speakerElevation},start:performance.now(),duration:reduced.matches?0:settings.transitionMs};if(!anim.duration){current={...anim.to};anim=null;renderFrame();}return;}
  const target=targetSpin(index,desired(view,role).az);
   if(window.__tableSpinMode==='two-turns'){
    const motion=createSpeakerMotion(from,target,1800,4,650);
    spin={id:++spinSerial,from,to:motion.to,start:performance.now(),duration:reduced.matches?0:motion.duration,travel:motion.travel,speaker:index,motion};
    spinTrace.push({id:spin.id,t:spin.start,angle:from,travel:motion.travel,speaker:index,mode:'two-turns',done:false});
    if(!spin.duration){turntable.rotation.y=motion.to;spin=null;renderFrame();}return;
   }
   const to=shortest(target,from),travel=to-from;
  if(Math.abs(travel)<1e-8){spin=null;return;}
  spin={id:++spinSerial,from,to,start:performance.now(),duration:reduced.matches?0:Math.max(300,settings.transitionMs*Math.abs(travel)/Math.PI),travel,speaker:index};
  spinTrace.push({id:spin.id,t:spin.start,angle:from,travel,speaker:index,done:false});
  if(!spin.duration){turntable.rotation.y=to;spin=null;renderFrame();}
}
function restoreTable(){if(!turntable)return;if(reduced.matches)focus=0;const from=turntable.rotation.y;spin={id:++spinSerial,from,to:shortest(0,from),start:performance.now(),duration:reduced.matches?0:1100,travel:0,speaker:null};if(!spin.duration){turntable.rotation.y=spin.to;spin=null;}}
function speakerState(){
 const actor=actors[speakingRole],p=actor.g.getWorldPosition(new THREE.Vector3()),face=new THREE.Vector3(0,0,-1).transformDirection(actor.g.matrixWorld),toward=new THREE.Vector3().subVectors(camera.position,p);toward.y=0;toward.normalize();const q=p.clone().setY(1.55).project(camera);
 return {index:speakingRole,faceDot:face.dot(toward),ndc:{x:q.x,y:q.y},pose:actor.body.userData.poseName};
}
function shortest(target,from){while(target-from>Math.PI)target-=Math.PI*2;while(target-from<-Math.PI)target+=Math.PI*2;return target;}
function switchView(v,r,instant=false){
 const next=desired(v,r);next.az=shortest(next.az,current.az);role=r;view=v;
 anim={from:{...current},to:next,start:performance.now(),duration:instant||reduced.matches?0:settings.transitionMs};
 if(anim.duration===0){current={...next};anim=null;renderFrame();}
}
function stageElevation(){return stage==='accuse'?.32:stage==='read'?settings.readElevation:stage==='discuss'?.56:settings.speakerElevation;}
// A fixed seat anchor looks from that seat; a null anchor follows the current view and role.
function explorationAnchor(){if(exploreState.seat!==null)return {az:seatAngle(exploreState.seat),elev:stageElevation()};const settled=desired(view,role);return {az:settled.az,elev:settled.elev};}
function updateCamera(){
 const radius=8.1,lookY=.83+.78*activityMix*(1-focus)+.25*focus,push=1.45*focus+.50*activityMix*(1-focus);
 const exploring=exploreState.active&&stage!=='turn';
 const anchor=exploring?explorationAnchor():{az:current.az,elev:current.elev};
 const az=anchor.az+(exploring?exploreState.yaw:0);
 const elev=exploring?THREE.MathUtils.clamp(anchor.elev+exploreState.pitch,.08,Math.PI/2-.001):anchor.elev;
 const target=new THREE.Vector3(Math.sin(az)*push,lookY,-Math.cos(az)*push);
 camera.position.copy(target).add(new THREE.Vector3(-Math.sin(az)*Math.cos(elev)*radius,Math.sin(elev)*radius,Math.cos(az)*Math.cos(elev)*radius));
 if(exploring){const hr=Math.hypot(camera.position.x,camera.position.z);if(hr>6.3){camera.position.x*=6.3/hr;camera.position.z*=6.3/hr;}camera.position.y=THREE.MathUtils.clamp(camera.position.y,.12,8.2);}
 camera.lookAt(target);camera.updateMatrixWorld();
 const bounds=viewport.getBoundingClientRect(),aspect=bounds.width/bounds.height;
 let half=THREE.MathUtils.lerp(THREE.MathUtils.lerp(settings.roomHalf,settings.activityHalf*(stage==='accuse'?.90:1)*activityWiden,activityMix),settings.speakerHalf,focus);
 // A taller viewport keeps the horizontal table scale and spends the extra height on room.
 half*=Math.max(1,BASE_ASPECT/Math.max(.2,aspect));
 if(exploring)half=THREE.MathUtils.clamp(half/exploreState.zoom,.3,16);
 camera.userData.half=half;camera.aspect=aspect;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(half/radius));camera.updateProjectionMatrix();
 // The activity frames are measured, never guessed: the view widens until no actor is cut by the frame edge.
 if(stage==='discuss'||stage==='accuse'){
  const fit=activityFit(az,aspect,radius);
  if(fit>half)half=Math.min(fit,ACTIVITY_HALF_MAX);
  camera.userData.half=half;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(half/radius));camera.updateProjectionMatrix();
 }
 if(view==='god'&&stage!=='turn'){
   const lift=THREE.MathUtils.clamp(Number(window.__chapelGodLift)||0,0,1);
   const orbitTarget=new THREE.Vector3(0,2.8+lift*11.8,-2.5-lift*3);
    const orbitOffset=new THREE.Vector3(0,5.8+lift*2.4,8.7).sub(orbitTarget);
    if(exploring){const orbit=new THREE.Spherical().setFromVector3(orbitOffset);orbit.theta+=exploreState.yaw;orbit.phi=THREE.MathUtils.clamp(orbit.phi-exploreState.pitch,.15,Math.PI/2-.05);orbit.radius/=exploreState.zoom;orbitOffset.setFromSpherical(orbit);}
    camera.position.copy(orbitTarget).add(orbitOffset);
   camera.lookAt(0,2.8+lift*11.8,-2.5-lift*3);
   const roomBounds=roomEnvironment.snapshot().bounds,margin=.45;
    constrainCamera(camera.position,roomBounds,margin);
    camera.lookAt(orbitTarget);camera.fov=82;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  cameraPath.push({t:performance.now(),...cameraState()});if(cameraPath.length>300)cameraPath.shift();
}
// Head and torso of every actor, in world space: the framing is fitted against the figure, not the chair.
function actorFigureBoxes(){
 const out=[];
 for(const a of actors.filter(a=>a.g.visible)){const p=a.g.getWorldPosition(new THREE.Vector3());out.push(new THREE.Box3(new THREE.Vector3(p.x-.27,.98,p.z-.27),new THREE.Vector3(p.x+.27,1.95,p.z+.27)));}
 return out;
}
function projectedSpread(cam,boxes){
 let maxAbs=0;
 for(const b of boxes)for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
  const v=new THREE.Vector3(x,y,z).applyMatrix4(cam.matrixWorldInverse);if(v.z>=-.05)continue;
  const p=new THREE.Vector3(x,y,z).project(cam);if(!Number.isFinite(p.x))continue;
  maxAbs=Math.max(maxAbs,Math.abs(p.x));
 }
 return maxAbs;
}
// Measure one activity stage on the real canvas and return how wide it has to be so nobody is cut.
function stageSpread(elev,half,az,aspect,radius){
 const push=.5,lookY=1.61;
 const target=new THREE.Vector3(Math.sin(az)*push,lookY,-Math.cos(az)*push);
 probeCamera.position.copy(target).add(new THREE.Vector3(-Math.sin(az)*Math.cos(elev)*radius,Math.sin(elev)*radius,Math.cos(az)*Math.cos(elev)*radius));
 probeCamera.lookAt(target);probeCamera.aspect=aspect;probeCamera.fov=THREE.MathUtils.radToDeg(2*Math.atan(half/radius));probeCamera.updateMatrixWorld();probeCamera.updateProjectionMatrix();
 return projectedSpread(probeCamera,actorFigureBoxes());
}
// The discussion frame is the widest one; the voting frame stays closer but still keeps every actor whole.
function activityFit(az,aspect,radius){
 const af=Math.max(1,BASE_ASPECT/Math.max(.2,aspect));
 const baseD=settings.activityHalf*ACTIVITY_WIDEN*af,baseA=settings.activityHalf*.90*ACTIVITY_WIDEN*af;
 const reqD=baseD*stageSpread(.56,baseD,az,aspect,radius)/ACTIVITY_FIT;
 const reqA=baseA*stageSpread(.32,baseA,az,aspect,radius)/ACTIVITY_FIT;
 // The lower voting angle needs MORE width just to fit all bodies. Reserve that
  // width in the discussion master shot, then vote can really tighten by 10%
  // without cutting the side seats or weakening the framing contract.
  const discuss=Math.max(baseD,reqD,reqA/ACCUSE_RATIO);
 return stage==='accuse'?Math.max(baseA,reqA,ACCUSE_RATIO*discuss):discuss;
}
// The canvas origin inside the .scene overlay is measured from the real boxes, never assumed.
function canvasOffset(host){const cr=viewport.getBoundingClientRect(),hr=host&&host.getBoundingClientRect?host.getBoundingClientRect():{left:0,top:0};return {left:cr.left-hr.left,top:cr.top-hr.top};}
// Screen position of the physical objects the canvas can pick, in canvas CSS pixels.
function interactiveTargets(){const b=viewport.getBoundingClientRect(),zoom=b.width/392,w=392,h=b.height/zoom;return targets.map(t=>{const p=t.obj.getWorldPosition(new THREE.Vector3()).project(camera);return {kind:t.kind,name:t.obj.name,x:((p.x+1)*w/2)*zoom,y:((1-p.y)*h/2)*zoom};});}
// The real poster UI rows, measured in canvas units: the band between the header row and the private cards.
function uiRows(zoom,selectors){
 const cr=viewport.getBoundingClientRect(),out=[];
 for(const sel of selectors){const el=document.querySelector(sel);if(!el)continue;const r=el.getBoundingClientRect();if(r.width<1||r.height<1)continue;out.push({sel,left:(r.left-cr.left)/zoom,right:(r.right-cr.left)/zoom,top:(r.top-cr.top)/zoom,bottom:(r.bottom-cr.top)/zoom});}
 return out;
}
function uiBand(zoom){
 const rows=uiRows(zoom,PLATE_TOP_BOXES),bottomRows=uiRows(zoom,PLATE_BOTTOM_BOXES);let top=0,bottom=Infinity;
 for(const r of rows)top=Math.max(top,r.bottom);
 for(const r of bottomRows)bottom=Math.min(bottom,r.top);
 return {top,bottom,rows,bottomRows};
}
// Pure rectangle overlap: a plate is only hidden when it really covers the actor.
function rectsOverlap(a,b){return !!(a&&b)&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
function positionUI(){
 const bounds=viewport.getBoundingClientRect(),zoom=bounds.width/392;const w=392,h=bounds.height/zoom;
 const band=uiBand(zoom),plates=[],placed=[],boxes=[],figures=[];
 // Pass one: project every actor once, so a plate can be tested against all of them.
 for(const a of actors.filter(a=>a.g.visible)){
   const b=new THREE.Box3().setFromObject(a.g),points=[];
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);points.push({x:(p.x+1)*w/2,y:(1-p.y)*h/2});}
  boxes.push({left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))});
  // The head and torso of the figure: the frame is judged on the person, not on the chair.
  const o=a.g.getWorldPosition(new THREE.Vector3()),fig=[];
  for(const x of [o.x-.27,o.x+.27])for(const y of [.98,1.95])for(const z of [o.z-.27,o.z+.27]){const p=new THREE.Vector3(x,y,z).project(camera);fig.push({x:(p.x+1)*w/2,y:(1-p.y)*h/2});}
  figures.push({left:Math.min(...fig.map(p=>p.x)),right:Math.max(...fig.map(p=>p.x)),top:Math.min(...fig.map(p=>p.y)),bottom:Math.max(...fig.map(p=>p.y))});
 }
 for(let ai=0;ai<playerCount;ai++){
   const a=actors[ai];
  const el=document.querySelector('[data-seat-index="'+a.index+'"]');if(!el)continue;
  const minX=boxes[ai].left,maxX=boxes[ai].right,minY=boxes[ai].top,maxY=boxes[ai].bottom;
  const centre=a.g.localToWorld(new THREE.Vector3(0,.83,0)).project(camera),tableCentre=new THREE.Vector3(0,.83,0).project(camera);
  const dx=centre.x-tableCentre.x,dy=-(centre.y-tableCentre.y);let x=(minX+maxX)/2-37,y;
  if(Math.abs(dx)>Math.abs(dy)*1.4){x=dx<0?minX-77:maxX+3;y=(minY+maxY)/2-15;}
  else y=dy<0?minY-34:maxY+4;
  // The natural anchor is kept: a plate that leaves the band is hidden where it was computed, never dragged into it.
  const naturalLeft=x,naturalTop=y,pw=el.offsetWidth||PLATE_WIDTH,ph=el.offsetHeight||PLATE_HEIGHT;
  // Five real slots: the natural anchor, above the head, under the body and both sides.
  const cx=(minX+maxX)/2,mid=(minY+maxY)/2-ph/2;
  const slots=[[x,y],[cx-pw/2,minY-ph-4],[cx-pw/2,maxY+4],[minX-pw-3,mid],[maxX+3,mid]];
  let visible=!(focus>.5&&stage==='turn'&&a.index!==speakingRole),reason=visible?'':'turn-focus',chosen=null;
  if(visible){
   for(const slot of slots){
    const left=Math.max(PLATE_MARGIN,Math.min(w-PLATE_MARGIN-pw,slot[0]));
    const top=Math.max(band.top,Math.min(band.bottom-ph,slot[1]));
    const rect={left,top,right:left+pw,bottom:top+ph};
    if(rect.bottom>band.bottom+.5||rect.bottom>h||rect.top<band.top-.5)continue;
    if(boxes.some(b=>rectsOverlap(rect,b)))continue;
    if(placed.some(p=>rectsOverlap(rect,p)))continue;
    if(band.rows.some(r=>rectsOverlap(rect,r)))continue;
    if(band.bottomRows.some(r=>rectsOverlap(rect,r)))continue;
    chosen={left,top,rect};break;
   }
   if(!chosen){visible=false;reason='no-free-slot';}
  }
  const left=chosen?chosen.left:naturalLeft,top=chosen?chosen.top:naturalTop;
  const nudged=Math.abs(left-naturalLeft)>.5||Math.abs(top-naturalTop)>.5;
  if(chosen)placed.push(chosen.rect);
  const off=canvasOffset(el.offsetParent);el.style.left=(left*zoom+off.left)+'px';el.style.top=(top*zoom+off.top)+'px';el.style.visibility=visible?'visible':'hidden';el.style.pointerEvents=visible?'':'none';el.classList.toggle('me',a.index===role);el.classList.toggle('speaking',stage==='turn'&&a.index===speakingRole);
  plates.push({index:a.index,name:names[a.index],left,top,width:pw,height:ph,naturalLeft,naturalTop,visible,reason,nudged});
 }
 framingInfo.w=w;framingInfo.h=h;framingInfo.band={top:band.top,bottom:band.bottom,left:PLATE_MARGIN,right:w-PLATE_MARGIN};framingInfo.plates=plates;framingInfo.actors=figures;
// Invisible accessible proxy for the physically small folder; label is kept below the canvas.
 for(const item of targets){const p=item.obj.getWorldPosition(new THREE.Vector3()).project(camera),el=document.querySelector(item.kind==='evidence'?'.scene .folder':'.scene .phone-card');if(el){const off=canvasOffset(el.offsetParent);el.style.left=(((p.x+1)*w/2-22)*zoom+off.left)+'px';el.style.top=(((1-p.y)*h/2-22)*zoom+off.top)+'px';}}
 for(const a of actors){a.marker.visible=a.index===(stage==='turn'?speakingRole:role);a.marker.material.emissiveIntensity=stage==='turn'?1.2:.25;}
  // Phase changes may dim the lamp, but never move its source or its aim.
   if(speakerLight){const actor=actors[speakingRole];speakerLightTarget.position.copy(roomEnvironment?.snapshot().style==='intimate-gothic-chapel'?new THREE.Vector3(0,1.48,2.40):actor?actor.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.78,0)):new THREE.Vector3(0,1.2,0));speakerLight.intensity=stage==='turn'?settings.spotlight:0;speakerRimLight.intensity=stage==='turn'?settings.spotlight*.16:0;}
  document.documentElement.dataset.turntable=spin?'rotating':'settled';
}
// --- Free exploration -------------------------------------------------------
// World-space diagnostics exclude intensity/visibility: scene phases may dim fixed lights,
// but neither their fixture nor beam direction may follow the rotating cast.
function lightingSnapshot(){
 scene.updateMatrixWorld(true);
 const onTurntable=o=>{for(let p=o;p;p=p.parent)if(p===turntable)return true;return false;};
 const transform=o=>({position:o.getWorldPosition(new THREE.Vector3()).toArray(),quaternion:o.getWorldQuaternion(new THREE.Quaternion()).toArray(),onTurntable:onTurntable(o)});
 const lights=[];scene.traverse(o=>{if(o.isLight)lights.push({type:o.type,...transform(o),...(o.target?{target:transform(o.target)}:{})});});
 return {lights,fixtures:lampParts.map(o=>({name:o.name,...transform(o)}))};
}
function explorationSnapshot(){return {active:exploreState.active,seat:exploreState.seat,yaw:exploreState.yaw,pitch:exploreState.pitch,zoom:exploreState.zoom,locked:stage==='turn',limits:{yaw:[...EXPLORE_LIMITS.yaw],pitch:[...EXPLORE_LIMITS.pitch],zoom:[...EXPLORE_LIMITS.zoom]}};}
function clearExploration(){exploreState.active=false;exploreState.seat=null;exploreState.yaw=0;exploreState.pitch=0;exploreState.zoom=1;}
// Every parameter is checked before anything is written, so a rejected call leaves the scene untouched.
function validateExploration(options){
 if(!options||typeof options!=='object'||Array.isArray(options))throw Error('探索参数必须是对象');
 const next={};
 if('seat' in options){const s=options.seat;if(s===null||s===undefined)next.seat=null;else if(!Number.isInteger(s)||s<0||s>=playerCount)throw Error('旁观座位超出范围');else next.seat=s;}
 if('yaw' in options){const v=options.yaw;if(!Number.isFinite(v)||v<EXPLORE_LIMITS.yaw[0]||v>EXPLORE_LIMITS.yaw[1])throw Error('环看角度超出范围：-π 到 π');next.yaw=v;}
 if('pitch' in options){const v=options.pitch;if(!Number.isFinite(v)||v<EXPLORE_LIMITS.pitch[0]||v>EXPLORE_LIMITS.pitch[1])throw Error('俯仰超出范围：-0.30 到 0.30');next.pitch=v;}
 if('zoom' in options){const v=options.zoom;if(!Number.isFinite(v)||v<EXPLORE_LIMITS.zoom[0]||v>EXPLORE_LIMITS.zoom[1])throw Error('缩放超出范围：0.65 到 1.35');next.zoom=v;}
 return next;
}
// The seat is a camera anchor only: the private role, private note and turntable state are never touched.
function exploreScene(options){
 if(stage==='turn')return {ok:false,locked:true,reason:'发言转台由导演镜头接管，先回到房间再自由探索。'};
 const next=validateExploration(options);
 Object.assign(exploreState,{active:true},next);
 renderFrame();
 return {ok:true,...explorationSnapshot()};
}
function resetExplore(){if(stage==='turn')return {ok:false,locked:true,reason:'发言转台由导演镜头接管，先回到房间再重置探索。'};clearExploration();switchView(view,role,true);renderFrame();return {ok:true,...explorationSnapshot()};}
// --- Lamp occlusion ---------------------------------------------------------
function projectBox(box){
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,any=false;
 // Corners behind or level with the camera are skipped: their projection is meaningless and would flood the box.
 const view=camera.matrixWorldInverse;
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
  const v=new THREE.Vector3(x,y,z).applyMatrix4(view);if(v.z>=-.05)continue;
  const p=new THREE.Vector3(x,y,z).project(camera);if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
  any=true;minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
 return any?{minX,minY,maxX,maxY}:null;
}
function boxesOverlap(a,b){return!!(a&&b)&&a.minX<=b.maxX&&a.maxX>=b.minX&&a.minY<=b.maxY&&a.maxY>=b.minY;}
// A suspended lamp may hang between the camera and the table. Only the fixture is hidden; walls and roof stay closed.
function updateLampOcclusion(){
 if(!lampParts.length||!scene||!camera)return;
 scene.updateMatrixWorld(true);
 const centre=new THREE.Vector3(0,D.tableTop,0),dir=centre.clone().sub(camera.position),distance=dir.length();
 let blocked=false;
 if(distance>.001){dir.normalize();const ray=new THREE.Raycaster(camera.position,dir,0,distance);blocked=ray.intersectObjects(lampParts,false).length>0;}
 const felt=scene.getObjectByName('felt-top');
 const tableNdc=felt?projectBox(new THREE.Box3().setFromObject(felt)):null;
 let overlaps=false;
 for(const m of lampParts){if(m.getWorldPosition(new THREE.Vector3()).distanceTo(camera.position)>=distance)continue;if(boxesOverlap(tableNdc,projectBox(new THREE.Box3().setFromObject(m)))){overlaps=true;break;}}
 if(overlaps)blocked=true;
 lampBlocksTable=overlaps;
 for(const m of lampParts)m.visible=!blocked;
 lampOcclusionSuppressed=blocked;
}
function renderFrame(){if(!ready)return;restoreRefinedInspection();floorGlow=THREE.MathUtils.lerp(floorGlow,spin?.speaker!==null&&!!spin?.travel?.valueOf()?1:0,.045);floorInlayMaterial.emissiveIntensity=.12+.22*floorGlow;const designs=scene.getObjectByName('floor-design-options');for(const g of designs.children){g.visible=g.name===(window.__floorPattern||'rose');g.material.color.copy(floorInlayMaterial.color);g.material.emissive.copy(floorInlayMaterial.emissive);g.material.emissiveIntensity=floorInlayMaterial.emissiveIntensity;}if(window.__floorPatternColor){floorInlayMaterial.color.set(window.__floorPatternColor);floorInlayMaterial.emissive.set(window.__floorPatternColor);}for(const a of actors){const lobby=window.__roomLobby; a.body.visible=!lobby?.active || a.index<lobby.joined; if(lobby?.active&&Array.isArray(lobby.roles)){const roleIndex=lobby.roles[a.index];const shades=[0xd9b580,0x8d9ba2,0xb19296,0x8d9d7d,0xb69b81];a.body.traverse(o=>{if(!o.isMesh||!o.name.includes('torso'))return;for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m.userData.focusBase&&roleIndex!=null)m.userData.focusBase.setHex(shades[roleIndex%shades.length]);});}const dim=1; /* Moonlight and bounce determine contrast, preserving material detail. */for(const m of a.localMaterials)m.color.copy(m.userData.focusBase).multiplyScalar(dim);}roomEnvironment.setVisibility(roomMix);roomEnvironment.applyOptions?.();scene.getObjectByName('activity-ballot').visible=stage==='accuse';renderer.toneMappingExposure=1.25*settings.roomBrightness*THREE.MathUtils.clamp(Number(window.__sceneBrightnessPercent??50)/50,.02,2);scene.updateMatrixWorld(true);updateCamera();updateLampOcclusion();if(!window.__seatImmersion?.enabled)positionUI();applySeatedSample();for(const actor of actors)actor.body.userData.tickRefined?.(performance.now()/1000);applyRefinedInspection();renderer.render(scene,camera);frame++;}
let verdictMotion=null;
function clearVerdictMotion(){if(!verdictMotion)return;const b=actors[verdictMotion.target].body;b.position.y=verdictMotion.y;b.rotation.z=verdictMotion.z;verdictMotion=null;}
function startVerdictMotion(target,result){if(!Number.isInteger(target)||target<0||target>=playerCount||!['correct','wrong'].includes(result))throw Error('invalid verdict');clearVerdictMotion();const b=actors[target].body;verdictMotion={target,result,start:performance.now(),y:b.position.y,z:b.rotation.z};if(reduced.matches){b.position.y=verdictMotion.y+(result==='correct'?.22:0);b.rotation.z=verdictMotion.z+(result==='correct'?-.12:0);verdictMotion.finished=true;renderFrame();}}
const trace=[];
function animate(now){
 let active=false;
 const elapsed=focusLast?Math.max(0,now-focusLast):16,blend=reduced.matches?1:1-Math.exp(-elapsed/210),roomTarget=stage==='turn'?.66:stage==='read'?1:.85,activityTarget=stage==='read'?0:1;
 for(const key of ['room','activity']){const old=key==='room'?roomMix:activityMix,target=key==='room'?roomTarget:activityTarget;let next=old+(target-old)*blend;if(Math.abs(next-target)<.0005)next=target;if(key==='room')roomMix=next;else activityMix=next;if(next!==old)active=true;}
  const widenTarget=(stage==='discuss'||stage==='accuse')?ACTIVITY_WIDEN:1;activityWiden=activityWiden+(widenTarget-activityWiden)*blend;if(Math.abs(activityWiden-widenTarget)<.0005)activityWiden=widenTarget;
 const focusTarget=stage==='turn'&&!spin?1:0;const dt=focusLast?Math.max(0,now-focusLast):16;focusLast=now;const oldFocus=focus;focus=reduced.matches?focusTarget:focus+(focusTarget-focus)*(1-Math.exp(-dt/170));if(Math.abs(focus-focusTarget)<.0005)focus=focusTarget;if(focus!==oldFocus)active=true;
 if(anim){const t=anim.duration?Math.min(1,(now-anim.start)/anim.duration):1;const e=ease(t);current.az=THREE.MathUtils.lerp(anim.from.az,anim.to.az,e);current.elev=THREE.MathUtils.lerp(anim.from.elev,anim.to.elev,e);trace.push({t:now,az:current.az,elev:current.elev});if(trace.length>300)trace.shift();if(t>=1)anim=null;active=true;}
 if(spin){const elapsed=Math.max(0,now-spin.start),t=spin.duration?Math.min(1,elapsed/spin.duration):1;turntable.rotation.y=spin.motion?speakerMotionAt(spin.motion,elapsed):THREE.MathUtils.lerp(spin.from,spin.to,ease(t));spinTrace.push({id:spin.id,t:now,angle:turntable.rotation.y,travel:spin.travel,speaker:spin.speaker,phase:t,elapsed,decel:spin.decel??null,motion:spin.motion?{...spin.motion}:null,done:t>=1});if(spinTrace.length>600)spinTrace.shift();if(t>=1)spin=null;active=true;}
 if(stage==='turn'&&!reduced.matches){for(const a of actors)if(!verdictMotion||a.index!==verdictMotion.target)a.body.userData.animatePose?.(now/1000*settings.gesture,a.index===speakingRole&&!spin);active=true;}
 if(verdictMotion){const t=reduced.matches?1:Math.min(1,Math.max(0,(now-verdictMotion.start)/1200)),e=t*t*(3-2*t),b=actors[verdictMotion.target].body;b.position.y=verdictMotion.y+(verdictMotion.result==='correct'?.22*e:0);b.rotation.z=verdictMotion.z+(verdictMotion.result==='correct'?-.12*e:.16*Math.sin(Math.PI*e));if(t<1||!verdictMotion.finished){active=true;if(t>=1)verdictMotion.finished=true;}}
 if(active||sampleEmote||window.__seatImmersion?.enabled||window.__puppetInspection?.enabled||actors.some(a=>a.body.userData.gestureActive?.())||now-last>200){renderFrame();last=now;}
 requestAnimationFrame(animate);
}

function resize(){if(!ready)return;const b=viewport.getBoundingClientRect(),w=Math.max(1,Math.round(b.width)),h=Math.max(1,Math.round(b.height));renderer.setSize(w,h,false);renderFrame();}
function geometryAudit(){
 scene.updateMatrixWorld(true);const tableBox=new THREE.Box3().setFromObject(scene.getObjectByName('table-solid'));const issues=[],details=[];
 // Analytic solid-vs-AABB check, conservative for the entire geometric leg envelope.
 function intersectsCylinder(b){const nearestX=Math.max(b.min.x,Math.min(0,b.max.x)),nearestZ=Math.max(b.min.z,Math.min(0,b.max.z));return b.max.y>D.tableBottom&&b.min.y<D.tableTop&&Math.hypot(nearestX,nearestZ)<D.tableRadius;}
 for(const a of actors.filter(a=>a.g.visible)){let legTop=-Infinity,minLegRadial=Infinity;const parts=[];
 a.body.traverse(o=>{if(!o.isMesh)return;const b=new THREE.Box3().setFromObject(o);if(['thigh','shin','shoe'].includes(o.name)){legTop=Math.max(legTop,b.max.y);minLegRadial=Math.min(minLegRadial,Math.hypot(b.min.x,b.min.z));if(intersectsCylinder(b))issues.push('leg-through-table:'+a.index+':'+o.name);parts.push(o.name);}if(['torso','head','upper-arm','forearm','hand','palm','thumb','cloth-finger','cuff'].includes(o.name)&&intersectsCylinder(b))issues.push('upper-through-table:'+a.index+':'+o.name);});
 const panel=a.chair.getObjectByName('high-back-panel'),torso=a.body.getObjectByName('torso');const panelFront=.34-.065/2,bodyBack=.145;const backGap=panelFront-bodyBack;
 if(backGap<.08)issues.push('chair-through-torso:'+a.index);
  if(new THREE.Box3().setFromObject(a.chair.getObjectByName('back-top-rail')).max.y>=new THREE.Box3().setFromObject(a.body.getObjectByName('head')).min.y)issues.push('chair-rail-at-head-height:'+a.index);
 details.push({role:a.index,legParts:parts.length,legTop,undersideClearance:D.tableBottom-legTop,chairTorsoGap:backGap,backTop:new THREE.Box3().setFromObject(a.chair.getObjectByName('back-top-rail')).max.y,personTop:new THREE.Box3().setFromObject(a.body).max.y,pose:a.body.userData.poseName});
 }
 const folder=scene.getObjectByName('public-folder');const fb=new THREE.Box3().setFromObject(folder);if(fb.min.y<1.267)issues.push('folder-through-felt');
 const visibleActors=actors.filter(a=>a.g.visible);const actorFootprints=visibleActors.map(a=>{const b=new THREE.Box3().setFromObject(a.body),p=a.g.getWorldPosition(new THREE.Vector3());return {index:a.index,b};});const adjacent=[];for(let i=0;i<actorFootprints.length;i++)for(let j=i+1;j<actorFootprints.length;j++){const one=actorFootprints[i],two=actorFootprints[j],overlapX=Math.min(one.b.max.x,two.b.max.x)-Math.max(one.b.min.x,two.b.min.x),overlapZ=Math.min(one.b.max.z,two.b.max.z)-Math.max(one.b.min.z,two.b.min.z);adjacent.push({a:one.index,b:two.index,overlapX,overlapZ});if(overlapX>.015&&overlapZ>.015)issues.push('adjacent-actor-overlap:'+one.index+':'+two.index);}const radialExtent=Math.max(...visibleActors.map(a=>{const b=new THREE.Box3().setFromObject(a.g);return Math.max(...[b.min.x,b.max.x].flatMap(x=>[b.min.z,b.max.z].map(z=>Math.hypot(x,z))));}));
  return {issues,actors:details,stage:{radius:STAGE_RADIUS,radialExtent,allInside:radialExtent<STAGE_RADIUS},table:{radius:D.tableRadius,bottom:D.tableBottom,top:D.tableTop},folder:{width:.30,depth:.23,shoulderWidth:.422},renderer:renderer.getContext().getParameter(renderer.getContext().VERSION),depthTest:true};
}
try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;viewport.replaceChildren(renderer.domElement);renderer.domElement.setAttribute('aria-label','真实三维圆桌、布偶人物与高靠背座椅');
 scene=buildScene();camera=new THREE.PerspectiveCamera(65,1,.08,50);ready=true;resize();requestAnimationFrame(animate);
  // Exploration pointer: a drag orbits the room, a tap picks an object, and a drag never picks.
  const canvas=renderer.domElement,pointers=new Map();let drag=null,pointerFrame=0;
   const requestPointerFrame=()=>{if(pointerFrame)return;pointerFrame=requestAnimationFrame(()=>{pointerFrame=0;renderFrame();});};
  canvas.style.touchAction='none';
  const pointerAt=ev=>{const r=canvas.getBoundingClientRect();return {x:ev.clientX-r.left,y:ev.clientY-r.top};};
  const roomPickables=()=>{const out=[];roomEnvironment&&roomEnvironment.root&&roomEnvironment.root.traverse(o=>{if(o.isMesh&&o.visible)out.push(o);});return out;};
  function pick(px,py){const r=canvas.getBoundingClientRect(),p=new THREE.Vector2(px/r.width*2-1,-(py/r.height*2-1)),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);
   const hits=ray.intersectObjects(targets.map(t=>t.obj),true);
   if(hits.length){let o=hits[0].object;while(o&&!targets.some(t=>t.obj===o))o=o.parent;const t=targets.find(t=>t.obj===o);if(t){window.deskPrototype&&window.deskPrototype.open&&window.deskPrototype.open(t.kind);return;}}
   const rh=ray.intersectObjects(roomPickables(),false);
   if(rh.length&&rh[0].object.name&&window.deskPrototype&&window.deskPrototype.inspectObject)window.deskPrototype.inspectObject(rh[0].object.name);
  }
  function beginExplore(){if(exploreState.active)return;exploreState.active=true;exploreState.seat=null;exploreState.yaw=0;exploreState.pitch=0;exploreState.zoom=1;}
  canvas.addEventListener('pointerdown',ev=>{if(stage==='turn'||window.__seatImmersion?.enabled)return;try{if(canvas.setPointerCapture)canvas.setPointerCapture(ev.pointerId);}catch(error){}pointers.set(ev.pointerId,pointerAt(ev));if(pointers.size===1)drag={id:ev.pointerId,start:pointerAt(ev),last:pointerAt(ev),moved:false,pinch:0};else if(pointers.size===2&&drag){drag.moved=true;const[a,b]=[...pointers.values()];drag.pinch=Math.hypot(a.x-b.x,a.y-b.y);}});
  canvas.addEventListener('pointermove',ev=>{if(!pointers.has(ev.pointerId))return;pointers.set(ev.pointerId,pointerAt(ev));
   if(pointers.size===2&&drag){const[a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(drag.pinch>4){beginExplore();exploreState.zoom=THREE.MathUtils.clamp(exploreState.zoom*(d/drag.pinch),EXPLORE_LIMITS.zoom[0],EXPLORE_LIMITS.zoom[1]);drag.pinch=d;requestPointerFrame();}return;}
   if(!drag||drag.id!==ev.pointerId)return;const p=pointerAt(ev),dx=p.x-drag.last.x,dy=p.y-drag.last.y;
   if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>5)drag.moved=true;
   if(!drag.moved)return;
   beginExplore();exploreState.yaw=THREE.MathUtils.clamp(exploreState.yaw-dx*.006,EXPLORE_LIMITS.yaw[0],EXPLORE_LIMITS.yaw[1]);exploreState.pitch=THREE.MathUtils.clamp(exploreState.pitch+dy*.004,EXPLORE_LIMITS.pitch[0],EXPLORE_LIMITS.pitch[1]);drag.last=p;requestPointerFrame();});
  const endPointer=ev=>{const p=pointers.get(ev.pointerId);pointers.delete(ev.pointerId);if(drag&&drag.id===ev.pointerId){const moved=drag.moved;drag=null;if(!moved&&p)pick(p.x,p.y);}else if(drag)drag.pinch=0;};
  canvas.addEventListener('pointerup',endPointer);
  canvas.addEventListener('pointercancel',ev=>{pointers.delete(ev.pointerId);drag=null;});
  canvas.addEventListener('wheel',ev=>{if(stage==='turn')return;ev.preventDefault();beginExplore();exploreState.zoom=THREE.MathUtils.clamp(exploreState.zoom*(ev.deltaY>0?.92:1.08),EXPLORE_LIMITS.zoom[0],EXPLORE_LIMITS.zoom[1]);renderFrame();},{passive:false});
 new ResizeObserver(resize).observe(viewport);window.addEventListener('resize',resize);
 window.desk3D={refinedSnapshot(){return {...actors[0].body.userData.inspectRefined(),screenBounds:refinedScreenBounds()};},emoteSample:triggerSampleEmote,seatSampleSnapshot:sampleSeatSnapshot,startVerdictMotion,setChapelDraftMaterials,setChapel4kMaterials,seatedDebug:()=>({playerCount,seatedVisible}),setSeatedVisible(n){seatedVisible=Math.max(0,Math.min(8,Number(n)||0));layoutPlayers();renderFrame();return seatedVisible;},setFurniture,furnitureState,auditOpenings:()=>roomEnvironment.auditOpenings(),clearVerdictMotion,setCast(count,mode){if(!Number.isInteger(count)||count<4||count>8||!['light','table'].includes(mode))throw Error('invalid cast configuration');clearVerdictMotion();playerCount=count;focusMode=mode;spin=null;turntable.rotation.y=0;layoutPlayers();clearExploration();current={...desired(view,Math.min(role,count-1))};renderFrame();},sync(v,r,s,speaker=r){const was=stage,oldRole=role,oldView=view;stage=s;if(reduced.matches){roomMix=stage==='turn'?.66:stage==='read'?1:.85;activityMix=stage==='read'?0:1;activityWiden=(s==='discuss'||s==='accuse')?ACTIVITY_WIDEN:1;}if(!(s==='turn'&&focusMode==='light'&&was==='turn'&&speaker===speakingRole&&oldRole===r))switchView(s==='turn'?'first':v,r);if(s==='turn'&&(was!=='turn'||speaker!==speakingRole||oldRole!==r||oldView!=='first'))startSpeaker(speaker);else if(s!=='turn'&&was==='turn')restoreTable();if(s==='turn'||was==='turn'||was!==s||oldRole!==r)clearExploration();},audit:geometryAudit,explore(o){return exploreScene(o);},resetExplore(){return resetExplore();},snapshot(){return {view,role,stage,frame,playerCount,focusMode,environment:roomEnvironment.snapshot(),floorPattern:{style:window.__floorPattern||"rose",color:floorInlayMaterial.color.getHexString(),glow:floorGlow},lighting:lightingSnapshot(),exploration:explorationSnapshot(),lampOcclusionSuppressed,lamp:{suppressed:lampOcclusionSuppressed,blocksTable:lampBlocksTable,visible:lampParts.some(m=>m.visible)},interactive:interactiveTargets(),activityMix,framing:{w:framingInfo.w,h:framingInfo.h,band:{...framingInfo.band},plates:framingInfo.plates.map(p=>({...p})),actors:framingInfo.actors.map(a=>({...a}))},settings:{...settings},turntable:{angle:turntable.rotation.y,rotating:!!spin,id:spinSerial,trace:spinTrace.slice(-400),speaker:speakerState()},transitioning:!!anim,camera:cameraState(),cameraPath:cameraPath.slice(-160),rotationProfile:{kind:focusMode==='light'?'stationary spotlight':'shortest table rotation',fastMs:800,settleMs:settings.spinMs-800},spinProfile:{fastMs:800,settleMs:settings.spinMs-800},trace:trace.slice(-160),renderCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};},configure(patch){if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('invalid parameter object');for(const [key,value] of Object.entries(patch)){if(!limits[key]||!Number.isFinite(value)||value<limits[key][0]||value>limits[key][1])throw Error('parameter out of range: '+key);}Object.assign(settings,patch);switchView(view,role);renderFrame();return {...settings};},resetParameters(){Object.assign(settings,defaults);switchView(view,role);renderFrame();return {...settings};},inspectionAngle(elevation){if(!Number.isFinite(elevation)||elevation<-.10||elevation>1.57)throw Error('invalid inspection elevation');anim=null;current.elev=elevation;renderFrame();},capture(){renderFrame();return renderer.domElement.toDataURL('image/png');}};
 const initial=(window.deskPrototype&&window.deskPrototype.state&&window.deskPrototype.state())||{stage:'read',camera:'god',currentRole:0};stage=initial.stage||'read';switchView(initial.camera||'god',initial.currentRole||0,true);document.documentElement.dataset.sceneReady='true';
}catch(error){viewport.textContent='3D场景未能加载：'+error.message;document.documentElement.dataset.sceneError=error.message;console.error(error);}
