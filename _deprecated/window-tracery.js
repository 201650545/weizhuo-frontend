import * as THREE from './vendor/three.module.js';

const polar=(r,a)=>[r*Math.cos(a),r*Math.sin(a)];
const tau=Math.PI*2;


export function createTracery(style,radius,center,frame,crisp=false){
 const group=new THREE.Group();group.name='north-window-tracery';group.position.copy(center);
 const make=()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=768;const ctx=canvas.getContext('2d');ctx.translate(384,384);ctx.scale(378,-378);return {canvas,ctx};};
 const pane=make(),mask=make();
 const {ctx:c}=pane,{ctx:m}=mask;
 m.fillStyle='#000';m.fillRect(-1.02,-1.02,2.04,2.04);
 function path(points,closed){for(const ctx of [c,m]){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(closed)ctx.closePath();}}
 const ring=(r,n=96)=>Array.from({length:n},(_,i)=>polar(r,tau*i/n));
 // Neutral glazing and an achromatic projector: only the leadwork interrupts the light.
 const aperture=m.createRadialGradient(0,0,0,0,0,1);
 aperture.addColorStop(0,'#fff');aperture.addColorStop(.86,'#fff');aperture.addColorStop(1,'#bdbdbd');
 m.beginPath();m.arc(0,0,.995,0,tau);m.fillStyle=aperture;m.fill();
 function lead(points,{closed=false,fill,width=.013,depth=0}={}){
  path(points,closed);
  if(fill){c.fillStyle='#ffffff';c.globalAlpha=.025;c.fill();c.globalAlpha=1;}
  for(const ctx of (crisp&&depth?[m]:[c,m])){ctx.strokeStyle=ctx===c?'#242424':'#626262';ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();}
  if(depth){const xyz=points.map(([x,y])=>new THREE.Vector3(x*radius,y*radius,0));if(closed)xyz.push(xyz[0]);const curve=new THREE.CurvePath();for(let i=1;i<xyz.length;i++)curve.add(new THREE.LineCurve3(xyz[i-1],xyz[i]));const rib=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*2),depth*radius,6,closed),frame);rib.name='tracery-structural-rib';group.add(rib);}
 }
 const disk=(r,fill,depth)=>lead(ring(r),{closed:true,fill,width:.024,depth});
 const petal=(a,r0,r1,spread)=>Array.from({length:64},(_,i)=>{const t=i/64*tau;const r=r0+(r1-r0)*(1-Math.cos(t))/2;const w=spread*Math.sin(t)*Math.pow(Math.abs(Math.sin(t/2)),.30);return [r*Math.cos(a)-w*Math.sin(a),r*Math.sin(a)+w*Math.cos(a)];});
 disk(.995,true,.02);disk(.877,true,.015);
 const n=style==='radial'?12:style==='quatrefoil'?4:8;
 if(style==='royal'){
  // Crown and fleur-de-lis, rather than another radial flower.
  const fleur=[[0,.75],[.16,.52],[.15,.32],[.07,.12],[.26,.32],[.48,.36],[.54,.19],[.43,.00],[.34,.08],[.21,-.12],[.11,-.16],[.26,-.26],[.26,-.35],[.09,-.35],[.16,-.48],[0,-.65],[-.16,-.48],[-.09,-.35],[-.26,-.35],[-.26,-.26],[-.11,-.16],[-.21,-.12],[-.34,.08],[-.43,0],[-.54,.19],[-.48,.36],[-.26,.32],[-.07,.12],[-.15,.32],[-.16,.52]];
  for(const h of [-.7,-.46,-.22,.02,.26,.50,.72]){const x=Math.sqrt(.877**2-h*h);lead([[-x,h],[-.31,h+.09],[.31,h-.09],[x,h]],{width:.016});}
  lead(fleur,{closed:true,fill:true,depth:.009});lead([[0,.75],[0,.997]],{depth:.013});lead([[0,-.65],[0,-.997]],{depth:.013});
  lead([[-.26,-.35],[-.41,-.72],[-.19,-.57],[0,-.78],[.19,-.57],[.41,-.72],[.26,-.35]],{closed:true,fill:true,depth:.007});
 }else if(style==='story'){
  // A triptych assembled from three pointed lancets with a star canopy.
  for(let i=-1;i<=1;i++){const x=i*.44,y=i===0?-.82:-.59,top=i===0?.46:.25,w=.19;lead([[x-w,y],[x+w,y],[x+w,top-.24],[x+.11,top-.10],[x,top],[x-.11,top-.10],[x-w,top-.24]],{closed:true,fill:true,depth:.011});
   for(let j=1;j<=4;j++){const b=y+j*(top-y-.19)/5;lead([[x-w,b],[x,b+.124],[x+w,b],[x,b-.124]],{closed:true,fill:true});}
   lead([[x,top],[x,Math.sqrt(.995**2-x*x)]],{depth:.01});}
  lead(Array.from({length:16},(_,i)=>{const [x,y]=polar(i%2?.10:.25,i*tau/16);return [x,y+.60];}),{closed:true,fill:true,depth:.009});
 }else{
  for(let i=0;i<n;i++){const a=Math.PI/2+i*tau/n;
   lead([polar(.12,a),polar(.995,a)],{depth:.012,width:.019});
   lead(petal(a,.13,.88,n===4?.27:n===12?.104:.155),{closed:true,fill:true,depth:.008});
   lead(petal(a,.24,.79,n===4?.15:n===12?.047:.076),{closed:true,fill:true,width:.014});
   const seam=a+Math.PI/n;lead([polar(.875,seam),polar(.995,seam)],{depth:.011});
  }
  disk(.143,true,.012);disk(.084,true);
 }
 for(let i=0;i<24;i++){const a=i*tau/24,b=(i+.92)*tau/24;lead([polar(.897,a),polar(.988,a),polar(.988,b),polar(.897,b)],{closed:true,fill:true});}
 const image=new THREE.CanvasTexture(pane.canvas);image.colorSpace=THREE.SRGBColorSpace;image.anisotropy=4;
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(radius*2.032,radius*2.032),new THREE.MeshBasicMaterial({map:image,transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:.9}));glass.name='clear-leaded-rose-panes';glass.position.z=-.057;group.add(glass);
 const texture=new THREE.CanvasTexture(mask.canvas);texture.colorSpace=THREE.SRGBColorSpace;
 return {group,texture,glass,dispose(){group.traverse(o=>o.geometry?.dispose());glass.material.dispose();texture.dispose();image.dispose();}};
}
