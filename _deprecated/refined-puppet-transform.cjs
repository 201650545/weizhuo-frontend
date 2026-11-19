'use strict';
// Only current prototype swaps one seat. Formal six-player runtime remains untouched.
module.exports=(code,basename)=>{
 if(basename!=='desk-scene3d.js')return code;
 const patch=(a,b)=>{if(code.split(a).length!==2)throw Error('refined anchor changed '+a.slice(0,60));code=code.replace(a,b);};
 code="import { buildRefinedPuppet } from './refined-puppet.js';\n"+code;
 patch('const body=buildPuppet(index%6);','const body=index===0?buildRefinedPuppet():buildPuppet(index%6);');
 patch('window.desk3D={emoteSample:',"window.desk3D={refinedSnapshot(){return {...actors[0].body.userData.inspectRefined(),screenBounds:refinedScreenBounds()};},emoteSample:");
 patch('applySeatedSample();renderer.render(scene,camera);',`applySeatedSample();
  actors[0].body.userData.tickRefined(performance.now()/1000,stage==='turn'&&speakingRole===0);
  applyRefinedInspection();renderer.render(scene,camera);`);
 patch('if(active||sampleEmote||window.__seatImmersion?.enabled||now-last>200)', 'if(active||sampleEmote||window.__seatImmersion?.enabled||window.__puppetInspection?.enabled||actors[0].body.userData.gestureActive()||now-last>200)');
 patch('function renderFrame(){if(!ready)return;', 'function renderFrame(){if(!ready)return;restoreRefinedInspection();');
 const hooks=`
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
`;
 code=hooks+'\n'+code;return code;
};
