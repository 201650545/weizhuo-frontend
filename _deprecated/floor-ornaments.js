import * as THREE from './vendor/three.module.js';
// Whole-disc engraved ornaments, authored as four flat textures rather than intersecting meshes.
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
