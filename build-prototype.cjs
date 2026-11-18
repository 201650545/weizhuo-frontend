'use strict';
// The only published prototype: all pages and one WebGL canvas in a single file.
const fs=require('node:fs'),path=require('node:path'),root=__dirname,ids=new Map(),sources=new Map();
function assign(abs){if(ids.has(abs))return ids.get(abs);const id='#app-scene-'+(ids.size+1);ids.set(abs,id);sources.set(id,null);let c=fs.readFileSync(abs,'utf8');c=require('./sample-lighting-transform.cjs')(c,path.basename(abs));c=require('./immersive-scene-transform.cjs')(c,path.basename(abs));c=require('./refined-puppet-transform.cjs')(c,path.basename(abs));const replace=(m,h,q,rel)=>`${h}${q}${assign(path.resolve(path.dirname(abs),rel))}${q}`;c=c.replace(/(\bfrom\s*)(['"])(\.{1,2}\/[^'"]+)\2/g,replace).replace(/(\bimport\s*)(['"])(\.{1,2}\/[^'"]+)\2/g,replace);sources.set(id,c);return id;}
const sourcePath=path.join(root,'样板源码','围桌.source.html');
let html=fs.readFileSync(sourcePath,'utf8');
html=html.replace('__BUBBLE_CSS__',()=>fs.readFileSync(path.join(root,'bubble-room-sample.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'unified-prototype.css'),'utf8'));
html=html.replace(/<script type="module" src="\.\/([^"]+)"><\/script>/g,(_,rel)=>`<script type="module">import '${assign(path.join(root,rel))}';</script>`);
const imports={};for(const[id,c]of sources)imports[id]='data:text/javascript;base64,'+Buffer.from(c).toString('base64');html=html.replace('<script type="module">','<script type="importmap">'+JSON.stringify({imports})+'</script><script type="module">');
for(const file of ['mock-background-music.js','bubble-room-sample.js','unified-prototype.js']){let c=fs.readFileSync(path.join(root,file),'utf8');if(file==='unified-prototype.js')c=c.replace('__PUPPET_IMAGE__','data:image/png;base64,'+fs.readFileSync(path.join(root,'人物概念样片','角色01_木偶版_1K.png')).toString('base64'));html=html.replace(`<script src="./${file}"></script>`,()=>'<script>'+c+'</script>');}
html=html.replace('__PRIVATE_MUSIC_PLAYER__','');
// Keep audio assets external so the single HTML stays small and mobile-friendly.

const book={meta:{title:'示例剧本',players:6},opening:'示例内容。供界面开发使用。'};
const books=[{id:'last-whistle',title:book.meta.title,players:book.meta.players,type:'近现代悬疑 · 六人四幕',status:'已安装 · 六人',summary:book.opening.split('。').slice(0,2).join('。')+'。',note:'正式服务已有完整六人内容。本HTML只做界面与场景演示，不包含私密正文；开局请使用正式服务。'},{id:'nianlun-candidate',title:'年轮',players:5,type:'现代变格 · 硬核还原',status:'五人主候选 · 未安装',summary:'旧村火灾后的废墟，五个人带着各自经历聚到这里。围绕阅读、交换信息与推理还原展开。',note:'资料约4–6小时，主持负担与数字化使用许可待核。可预览五人界面，不能称已导入原作。'}];
const details=JSON.parse(fs.readFileSync(path.join(root,'book-details.json'),'utf8'));
for(const b of books){Object.assign(b,details[b.id]);const coverName=b.id==='last-whistle'?'last-whistle':'nianlun';b.thumbnail='./assets/book-covers/'+coverName+'.png';b.cover='./assets/book-covers/'+coverName+'-21x9.png';}
const safe=o=>JSON.stringify(o).replace(/</g,'\\u003c');
html=html.replace('__BOOKS_JSON__',()=>safe(books));
html=html.replace('</body>',()=>'<script>'+fs.readFileSync(path.join(root,'compact-toolbar.js'),'utf8')+'</script></body>');
html=html.replace('</body>',()=>'<script>'+fs.readFileSync(path.join(root,'theme-layout.js'),'utf8')+'</script></body>');
html=html.replace('</body>',()=>'<script>'+fs.readFileSync(path.join(root,'room-lobby-preview.js'),'utf8')+'</script></body>');
html=html.replace('</body>',()=>'<script>'+fs.readFileSync(path.join(root,'lobby-roles-preview.js'),'utf8')+'</script></body>');
html=html.replace('</body>',()=>'<script>'+fs.readFileSync(path.join(root,'usb-room-client.js'),'utf8')+'</script></body>');
html=html.replace('</head>',()=>'<style>'+fs.readFileSync(path.join(root,'assets/book-covers/cinema-layout.css'),'utf8')+'</style></head>');
const draftAssets=Object.fromEntries(['limestone','dark-oak','antique-brass'].flatMap(name=>{const file=path.join(root,'assets','chapel-materials',name+'.webp');return fs.existsSync(file)?[[name,'data:image/webp;base64,'+fs.readFileSync(file).toString('base64')]]:[];}));
html=html.replace('</body>',()=>'<script type="application/json" id="chapel-draft-assets">'+safe(draftAssets)+'</script><script>'+fs.readFileSync(path.join(root,'chapel-direct-preview.js'),'utf8')+'</script></body>');
html=html.replace('</body>',()=>'<script>'+fs.readFileSync(path.join(root,'desktop-controller.js'),'utf8')+'</script></body>');
const target=path.join(root,'围桌样板.html');fs.writeFileSync(target,html);console.log(`UNIFIED PROTOTYPE BUILT / one HTML / ${sources.size} shared scene modules / ${fs.statSync(target).size} bytes / home + room + immersive + gestures + music + concept / local M4A assets loaded on demand`);
