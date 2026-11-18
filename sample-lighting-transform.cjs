'use strict';
// Build-time, sample-only lighting study. Never writes to original scene sources.
// ?lighting=original keeps old values for controlled visual comparison.
module.exports = function transform(code, basename) {
  if (!['desk-scene3d.js', 'factory-room3d.js'].includes(basename)) return code;
  const patch = (oldText, newText) => {
    if (code.split(oldText).length !== 2) throw Error('lighting anchor changed: ' + basename + ' / ' + oldText.slice(0, 65));
    code = code.replace(oldText, newText);
  };
  code = "const atmosphericSample = new URLSearchParams(location.search).get('lighting') !== 'original';\n" + code;
  if (basename === 'desk-scene3d.js') {
    patch("s.fog=new THREE.Fog(0x020304,16,25)", "s.fog=new THREE.Fog(atmosphericSample?0x030508:0x020304,atmosphericSample?22:16,atmosphericSample?45:25)");
    patch('new THREE.HemisphereLight(0xc5d6e3,0x273339,1.65)', 'new THREE.HemisphereLight(0xc5d6e3,0x273339,atmosphericSample?.025:1.65)');
    patch('new THREE.AmbientLight(0xb9cad4,.55)', 'new THREE.AmbientLight(0xb9cad4,atmosphericSample?.008:.55)');
    patch('new THREE.DirectionalLight(0xd7e2e7,2.8)', 'new THREE.DirectionalLight(0xd7e2e7,atmosphericSample?.018:2.8)');
    patch('new THREE.DirectionalLight(0x8ba8b5,1.1)', 'new THREE.DirectionalLight(0x8ba8b5,atmosphericSample?.035:1.1)');
    patch('s.add(rim);', `s.add(rim);
  if(false){
    // Legacy overhead pool disabled: chapel is lit by window moonlight and candles.
    const pool=new THREE.SpotLight(0xffd19a,83,7.0,.60,.84,2);
    pool.name='sample-table-warm-pool';pool.position.set(0,5.25,0);
    const target=new THREE.Object3D();target.position.set(0,.90,0);target.name='sample-table-pool-target';s.add(target);pool.target=target;
    pool.castShadow=true;pool.shadow.mapSize.set(1024,1024);pool.shadow.normalBias=.018;pool.shadow.bias=-.00008;pool.shadow.radius=4;s.add(pool);
    // Small cool rear rim separates cloth silhouettes; limited range does not flood architecture.
    const edge=new THREE.SpotLight(0x819dbb,10,5.4,.82,.95,2);edge.name='sample-cool-seat-rim';edge.position.set(1.3,3.4,-2.7);edge.target=target;s.add(edge);
  }`);
    patch('speakerLight=new THREE.SpotLight(0xd8e5ea,0,8,.34,.72,1.35)', 'speakerLight=new THREE.SpotLight(atmosphericSample?0xffd7aa:0xd8e5ea,0,atmosphericSample?5.8:8,.34,.72,1.35)');
    patch("speakerLight.intensity=stage==='turn'?settings.spotlight:0;speakerRimLight.intensity=stage==='turn'?settings.spotlight*.16:0;", "speakerLight.intensity=stage==='turn'?settings.spotlight*(atmosphericSample?0:1):0;speakerRimLight.intensity=stage==='turn'?settings.spotlight*(atmosphericSample?0:.16):0;");
    // Floor inlay brightness now follows the turntable motion directly.
    patch('renderer.toneMappingExposure=1.25*settings.roomBrightness', 'renderer.toneMappingExposure=(atmosphericSample?.95:1.25)*settings.roomBrightness');
    patch('renderer.shadowMap.type=THREE.PCFShadowMap', 'renderer.shadowMap.type=atmosphericSample?THREE.PCFSoftShadowMap:THREE.PCFShadowMap');
    patch('lights.push({type:o.type,...transform(o)', 'lights.push({name:o.name,type:o.type,intensity:o.intensity,color:o.color.getHexString(),distance:o.distance,decay:o.decay,angle:o.angle,penumbra:o.penumbra,castShadow:o.castShadow,...transform(o)');
    patch('fixtures:lampParts.map(o=>({name:o.name,...transform(o)}))','fixtures:lampParts.map(o=>({name:o.name,color:o.material.color.getHexString(),emissive:o.material.emissive?.getHexString(),...transform(o)}))');
    patch('return {view,role,stage,frame,playerCount,focusMode,environment:', "return {sampleLighting:atmosphericSample?'table-pool':'original',view,role,stage,frame,playerCount,focusMode,environment:");
  } else {
    patch('emissiveIntensity:.45}', 'emissiveIntensity:atmosphericSample?.10:.45}');
    patch("const glow=mat(0xc8dbe1,{emissive:0xb7d2df,emissiveIntensity:1.1});", "const glow=mat(atmosphericSample?0xffca78:0xc8dbe1,{emissive:atmosphericSample?0xffae43:0xb7d2df,emissiveIntensity:atmosphericSample?.65:1.1});");
    patch("box('lamp-cable',.018,4.4,.018,iron,0,6.25,-3.2);box('fluorescent-housing',1.5,.12,.35,iron,0,4.01,-3.2);", "box('lamp-cable',.018,atmosphericSample?3.10:4.4,.018,iron,0,atmosphericSample?6.92:6.25,atmosphericSample?0:-3.2);box('fluorescent-housing',1.5,.12,.35,iron,0,atmosphericSample?5.33:4.01,atmosphericSample?0:-3.2);");
    patch("box('fluorescent-diffuser',1.37,.035,.27,glow,0,3.935,-3.2)", "box('fluorescent-diffuser',1.37,.035,.27,glow,0,atmosphericSample?5.255:3.935,atmosphericSample?0:-3.2)");
    patch("return {name:root.name,visibility:level,decorations:", "return {sampleFixture:atmosphericSample?'warm-overhead-high':'original',name:root.name,visibility:level,decorations:");
  }
  return code;
};
