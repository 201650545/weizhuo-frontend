import * as THREE from './vendor/three.module.js';

export const sideSpans=[-6.3,-.5,5.3];
function outline(style){
 const p=new THREE.Shape();p.moveTo(-1.36,0);p.lineTo(1.36,0);
 if(style==='round'){p.lineTo(1.36,6.9);p.absarc(0,6.9,1.36,0,Math.PI,false);}
 else if(style==='flamboyant'){p.lineTo(1.36,6.45);p.bezierCurveTo(1.36,8.1,.42,8.12,0,9.45);p.bezierCurveTo(-.42,8.12,-1.36,8.1,-1.36,6.45);}
 else{p.lineTo(1.36,7.05);p.quadraticCurveTo(1.15,8.34,0,9.10);p.quadraticCurveTo(-1.15,8.34,-1.36,7.05);}
 p.closePath();return p;
}
export function buildSideWindows(style,{mesh,rod,tube,trim,iron,group}){
 const shape=outline(style),points=shape.getPoints(24),wall=new THREE.Shape();wall.moveTo(-10.425,0);wall.lineTo(10.425,0);wall.lineTo(10.425,17.25);wall.lineTo(-10.425,17.25);wall.closePath();
 for(const z of sideSpans){const h=new THREE.Path();points.forEach((p,i)=>i?h.lineTo(p.x+z,p.y+.65):h.moveTo(p.x+z,p.y+.65));h.closePath();wall.holes.push(h);}
 const geometry=new THREE.ExtrudeGeometry(wall,{depth:.45,bevelEnabled:false,curveSegments:24});geometry.rotateY(-Math.PI/2);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=640;const c=canvas.getContext('2d');
 const colors=['#b14952','#4a73c3','#439684','#d6a65e','#8462a9'];
 for(let j=0;j<10;j++)for(let i=0;i<4;i++){const x=i*64,y=j*64;c.fillStyle=colors[(i*3+j)%5];c.globalAlpha=.58;c.fillRect(x,y,64,64);c.globalAlpha=.90;c.strokeStyle='#171a21';c.lineWidth=2.5;c.beginPath();c.moveTo(x,y+32);c.lineTo(x+32,y);c.lineTo(x+64,y+32);c.lineTo(x+32,y+64);c.closePath();c.stroke();}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map,transparent:true,side:THREE.DoubleSide,depthWrite:false});
 for(const side of [-1,1])for(const z of sideSpans){const x=side*9.95,px=x-side*.055;const pane=new THREE.ShapeGeometry(shape,24),a=pane.getAttribute('position'),uv=pane.getAttribute('uv');for(let i=0;i<a.count;i++)uv.setXY(i,(a.getX(i)+1.36)/2.72,a.getY(i)/9.45);
  const p=mesh('tall-stained-glass',pane,material,[x,.65,z]);p.rotation.y=-Math.PI/2;p.castShadow=false;group.add(p);
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(a.distanceTo(b)>.001)group.add(rod('tall-window-stone-frame',[px,a.y+.65,a.x+z],[px,b.y+.65,b.x+z],.096,trim));}
  for(const d of [-.46,0,.46])group.add(rod('tall-window-mullion',[px,.65,z+d],[px,d===0?8.90:7.70,z+d],.046,iron));
  for(const y of [2.15,4.30,6.45])group.add(rod('tall-window-transom',[px,y,z-1.36],[px,y,z+1.36],.036,iron));
  for(const d of [-1,1])group.add(tube('tall-window-lancet-tracery',[[px,6.45,z+d*1.12],[px,7.35,z+d*.89],[px,8.02,z+d*.49],[px,7.35,z+d*.12],[px,6.45,z]],.045,iron));
 }
 for(const side of [-1,1]){const l=new THREE.PointLight(side===1?0x8daade:0x9b97c2,12,5.6,1.45);l.name='side-window-local-scatter';l.position.set(side*9.61,4.1,-.5);group.add(l);}
 return {geometry,material,dispose(){group.traverse(o=>o.geometry?.dispose());group.clear();geometry.dispose();map.dispose();material.dispose();}};
}
