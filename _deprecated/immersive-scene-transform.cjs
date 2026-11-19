'use strict';
// Only the independent immersive sample receives these hooks; the original files stay intact.
const fs=require('node:fs'),path=require('node:path');
module.exports=function(code,basename){
 if(basename!=='desk-scene3d.js')return code;
 const patch=(a,b)=>{if(code.split(a).length!==2)throw Error('immersive anchor changed '+a.slice(0,60));code=code.replace(a,b);};
 code=fs.readFileSync(path.join(__dirname,'immersive-scene-hooks.txt'),'utf8')+'\n'+code;
 patch('positionUI();renderer.render(scene,camera);','if(!window.__seatImmersion?.enabled)positionUI();applySeatedSample();renderer.render(scene,camera);');
 patch('if(active||now-last>200)', 'if(active||sampleEmote||window.__seatImmersion?.enabled||now-last>200)');
 patch('window.desk3D={startVerdictMotion,','window.desk3D={emoteSample:triggerSampleEmote,seatSampleSnapshot:sampleSeatSnapshot,startVerdictMotion,');
 return code;
};
