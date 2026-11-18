import * as THREE from './vendor/three.module.js';

export function makeMoonShaft() {
 const mesh=new THREE.Group();mesh.name='visible-window-moon-shaft';mesh.visible=false;
 const slab=new THREE.PlaneGeometry(2,2);
 const air=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{pattern:{value:null}},vertexShader:`varying vec2 p;void main(){p=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`varying vec2 p;uniform sampler2D pattern;void main(){float r=length(p);float edge=1.0-smoothstep(.42,.99,r);float mask=texture2D(pattern,p*.46+.5).r;float alpha=edge*mix(.72,1.0,mask)*.032;if(alpha<.0003)discard;gl_FragColor=vec4(.40,.57,.79,alpha);}`});
 for(let i=0;i<32;i++){const plane=new THREE.Mesh(slab,air);plane.renderOrder=2;mesh.add(plane);}
 function configure(entry,exit,pattern){air.uniforms.pattern.value=pattern;
  for(let i=0;i<mesh.children.length;i++){
   const t=(i+.5)/mesh.children.length,plane=mesh.children[i],w=1+.25*t;
   plane.position.lerpVectors(entry,exit,t);plane.scale.set(1.02*w,.79*w,1);
  }
 }
 return {mesh,configure};
}

export function makeFlagstoneMap(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');
 let seed=7241;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.fillStyle='#53545a';ctx.fillRect(0,0,1024,1024);
 for(let row=0;row<8;row++)for(let col=-1;col<8;col++){
  const x=col*128+64*(row%2),y=row*128,v=123+Math.floor(random()*33);
  const bevel=ctx.createLinearGradient(x,y,x+128,y+128);bevel.addColorStop(0,`rgb(${v+13},${v+13},${v+14})`);bevel.addColorStop(.15,`rgb(${v},${v},${v+2})`);bevel.addColorStop(.86,`rgb(${v-8},${v-7},${v-5})`);bevel.addColorStop(1,`rgb(${v-24},${v-22},${v-18})`);
  ctx.fillStyle=bevel;ctx.fillRect(x+2,y+2,124,124);
  for(let i=0;i<190;i++){ctx.fillStyle=random()<.49?'rgba(20,20,23,.09)':'rgba(230,229,223,.09)';ctx.fillRect(x+3+random()*118,y+3+random()*118,1+random()*4,1+random());}
 }
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;map.repeat.set(2,2);return map;
}

export function makeNightGround(stoneMap){
 const group=new THREE.Group();group.name='exterior-churchyard';
 const earth=new THREE.Mesh(new THREE.PlaneGeometry(48,48),new THREE.MeshLambertMaterial({color:0x36312a,map:stoneMap,fog:false}));earth.rotation.x=-Math.PI/2;earth.position.y=-.18;group.add(earth);
 const blade=new THREE.BufferGeometry();blade.setAttribute('position',new THREE.Float32BufferAttribute([-.07,0,0,.07,0,0,.035,.46,0,.07,0,0,.12,.27,.08,.035,.46,0],3));blade.computeVertexNormals();
 const grass=new THREE.InstancedMesh(blade,new THREE.MeshBasicMaterial({color:0xa49a7a,side:THREE.DoubleSide,fog:false}),2400);grass.name='dry-grass';
 let seed=19883;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const dummy=new THREE.Object3D();
 for(let i=0;i<grass.count;i++){const side=i%2?1:-1;dummy.position.set(side*(10.85+random()*9.15),-.17,(random()-.5)*30);dummy.rotation.y=random()*Math.PI*2;dummy.scale.set(.55+random(),.50+random()*.8,.65+random());dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);grass.setColorAt(i,new THREE.Color().setScalar(.35+random()*.4));}
 group.add(grass);return group;
}

export function makeStoneReveal(radius,center,materials){
 const group=new THREE.Group();group.name='carved-north-stone-reveal';group.position.copy(center);
 const n=32;
 for(let i=0;i<n;i++){
  const first=i*Math.PI*2/n+.006,last=(i+1)*Math.PI*2/n-.006;
  const shape=new THREE.Shape();shape.absarc(0,0,radius+.33,first,last,false);
  shape.lineTo(Math.cos(last)*(radius+.045),Math.sin(last)*(radius+.045));shape.absarc(0,0,radius+.045,last,first,true);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.10,bevelEnabled:true,bevelSize:.019,bevelThickness:.025,bevelSegments:2,curveSegments:8});
  const block=new THREE.Mesh(geo,materials[(i*13+i%4)%materials.length]);block.position.z=.05+(i%3)*.008;block.receiveShadow=true;group.add(block);
 }
 for(const [r,t,z] of [[radius+.026,.035,.135],[radius+.354,.041,.13],[radius+.417,.03,.09]]){
  const mould=new THREE.Mesh(new THREE.TorusGeometry(r,t,10,128),materials[0]);mould.position.z=z;mould.receiveShadow=true;group.add(mould);
 }
 return group;
}
