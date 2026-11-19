import * as THREE from './vendor/three.module.js';

export async function loadChapelDrafts(){
 const sources=JSON.parse(document.getElementById('chapel-draft-assets')?.textContent||'{}');
 const names=['limestone','dark-oak','antique-brass'];
 if(!names.every(name=>sources[name]))return null;
 const loader=new THREE.TextureLoader();
 const maps=await Promise.all(names.map(name=>loader.loadAsync(sources[name])));
 for(const map of maps){map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;}
 maps[1].repeat.set(2,1);maps[2].repeat.set(2,2);
 return {stone:maps[0],oak:maps[1],brass:maps[2]};
}

export function applyDraftSurface(material,texture,roughness,bumpScale){
 const base=material.userData.chapelSurface??={map:material.map,bumpMap:material.bumpMap,roughness:material.roughness,bumpScale:material.bumpScale};
 material.map=texture??base.map;material.bumpMap=texture??base.bumpMap;
 material.roughness=texture?roughness:base.roughness;material.bumpScale=texture?bumpScale:base.bumpScale;material.needsUpdate=true;
}


// 本地 4K 材质（Poly Haven CC0，4096×4096）。运行时按需加载，不内联进单页 HTML。
const H4K = 'assets/chapel-materials-4k/';
const MAP4K = {
  stoneDiffuse: 'castle_wall_slates_diff_4k.jpg',
  stoneNormal: 'castle_wall_slates_nor_gl_4k.jpg',
  stoneRough: 'castle_wall_slates_rough_4k.jpg',
  floorDiffuse: 'monastery_stone_floor_diff_4k.jpg',
  floorNormal: 'monastery_stone_floor_nor_gl_4k.jpg',
  floorRough: 'monastery_stone_floor_rough_4k.jpg'
};

export async function loadChapel4kTextures() {
  const loader = new THREE.TextureLoader();
  const out = {};
  const jobs = Object.entries(MAP4K).map(async ([key, file]) => {
    try {
      const tex = await loader.loadAsync(H4K + file);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = (key.endsWith('Normal') || key.endsWith('Rough')) ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      out[key] = tex;
    } catch (e) {
      out[key] = null;
    }
  });
  await Promise.all(jobs);
  return out;
}
