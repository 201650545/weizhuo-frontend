// Direct scene review on the existing loopback preview server.
(()=>{
 const params=new URLSearchParams(location.search),study=params.get('preview')==='chapel-study';
 if(!study&&params.get('preview')!=='chapel')return;
 if(study)window.__chapelStudy=params.get('version')==='baseline'?'baseline':'compact';
 const style=document.createElement('style');style.textContent=`body.chapel-review{margin:0;background:#080c12}.chapel-review .workspace{display:block;padding:0}.chapel-review .design-note,.chapel-review .review-note{display:none}.chapel-review .phone{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;border:0!important;border-radius:0!important}.chapel-review .original-scene{inset:0!important;opacity:1!important}.chapel-review .viewport,.chapel-review .topbar,.chapel-review .nav,.chapel-review .demo-label,.chapel-review .original-scrim,.chapel-review .unified-hud{display:none!important}.chapel-review .chapel-review-tools{position:fixed;z-index:9999;left:20px;bottom:20px;display:flex;gap:8px;align-items:center;color:#d9e4f0;font:14px sans-serif;background:#0a101bcc;padding:12px 16px;border:1px solid #485364;border-radius:10px}.chapel-review-tools button,.chapel-review-tools a{padding:8px 12px;color:#e4eaf2;background:#243244;border:1px solid #53647b;border-radius:6px;text-decoration:none;cursor:pointer}`;document.head.append(style);
 function startStudy(){
  const tools=document.createElement('div');tools.className='chapel-review-tools chapel-study-tools';
  const style=document.createElement('style');style.textContent=`.chapel-study-tools{left:14px;right:14px;bottom:14px;max-width:850px;margin:auto;flex-wrap:wrap;gap:6px;background:#0b111aee}.chapel-study-tools [aria-pressed=true]{background:#b6c2d3;color:#111923}.chapel-study-tools label{display:flex;align-items:center;gap:4px}.chapel-study-tools small{color:#9ba9bd}.chapel-review #table-world canvas{touch-action:none;cursor:grab}.chapel-review #table-world canvas:active{cursor:grabbing}@media(max-width:550px){.chapel-study-tools{font-size:11px;bottom:6px;left:6px;right:6px;padding:7px}.chapel-study-tools button{padding:6px}}`;document.head.append(style);
  tools.innerHTML=`<strong id="study-title"></strong><button data-study-version>切换新旧</button><button data-study-material aria-pressed="false" disabled>材质草稿</button><button data-shot="seat">坐姿</button><button data-shot="table">全桌</button><button data-shot="window">抬头看窗</button><button data-shot="side">侧看月光</button><label>座位 <select id="study-seat">${Array.from({length:6},(_,i)=>`<option value="${i}">${i+1} 号</option>`).join('')}</select></label><button data-study-spin>让对面发言</button><small>坐姿可拖动转头 · 几何与灯光样片</small>`;document.body.append(tools);
  unifiedPrototype.selectBook('last-whistle');unifiedPrototype.enterGame(true);desk3D.setCast(6,'table');
  const canvas=document.querySelector('#table-world canvas'), cfg=window.__seatImmersion;let shot='seat',drag=null;
  const draw=()=>dispatchEvent(new Event('resize'));const title=()=>tools.querySelector('#study-title').textContent=window.__chapelStudy==='compact'?'B · 紧凑礼拜堂':'A · 现有教堂';
  function frame(next){shot=next;cfg.enabled=shot==='seat'||shot==='window';cfg.yaw=0;cfg.pitch=shot==='window'?.60:0;
   if(shot==='window'){cfg.seat=0;tools.querySelector('#study-seat').value='0';}
   window.__chapelStudyCamera=shot==='table'?{eye:[0,4.8,5.95],target:[0,1.13,-.12],fov:62}:shot==='side'?{eye:[5.5,2.35,3.75],target:[0,4.0,-2.7],fov:64}:null;
   desk3D.sync(shot==='table'?'god':'first',cfg.seat,'read');tools.querySelectorAll('[data-shot]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shot===shot)));draw();}
  const materialButton=tools.querySelector('[data-study-material]');let wantsDraft=params.get('materials')!=='original',materialRevision=0;
  async function refreshMaterials(){const rev=++materialRevision,compact=window.__chapelStudy==='compact';materialButton.disabled=true;let applied=false;
   try{applied=await desk3D.setChapelDraftMaterials(compact&&wantsDraft);}catch{if(rev!==materialRevision)return;materialButton.textContent='材质加载失败';return;}
   if(rev!==materialRevision)return;materialButton.disabled=!compact;materialButton.setAttribute('aria-pressed',String(applied));materialButton.textContent=applied?'材质草稿':'原材质';}
  tools.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-study-version')){window.__chapelStudy=window.__chapelStudy==='compact'?'baseline':'compact';title();draw();refreshMaterials();}else if(b===materialButton){wantsDraft=!wantsDraft;refreshMaterials();}else if(b.dataset.shot){frame(b.dataset.shot);}else if(b.hasAttribute('data-study-spin')){frame('table');desk3D.sync('first',0,'turn',3);}});
  refreshMaterials();
  tools.querySelector('#study-seat').addEventListener('change',e=>{cfg.seat=Number(e.target.value);frame('seat');});
  canvas.addEventListener('pointerdown',e=>{if(shot==='table')return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;cfg.yaw=Math.max(-2.9,Math.min(2.9,cfg.yaw-(e.clientX-drag.x)*.004));cfg.pitch=Math.max(-.7,Math.min(1.1,cfg.pitch+(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY;draw();});
  for(const key of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(key,()=>{drag=null;});
  title();frame('seat');
 }
 const deadline=Date.now()+20000;
 function start(){if(!window.desk3D||!window.unifiedPrototype){if(Date.now()<deadline)requestAnimationFrame(start);return;}
  unifiedPrototype.enterGame(true);window.__roomLobby={active:false};desk3D.setCast(5,'table');desk3D.sync('first',0,'read');document.body.classList.add('chapel-review');
  if(study){startStudy();return;}
   const tools=document.createElement('div');tools.className='chapel-review-tools';tools.innerHTML='<span>小礼拜堂 · 月光发言预览</span><button data-chapel-view="first">围桌视角</button><button data-chapel-view="god">上帝视角</button><label>抬头 <input id="chapel-god-lift" type="range" min="0" max="100" value="35" style="width:90px"></label><button data-chapel-speak="0">发言席 1</button><button data-chapel-speak="1">发言席 2</button><button data-chapel-speak="2">发言席 3</button><button data-chapel-speak="3">发言席 4</button><button data-chapel-speak="4">发言席 5</button><a href="/">返回样板</a>';document.body.append(tools);
  window.__chapelGodLift=.35;tools.querySelector('#chapel-god-lift').addEventListener('input',e=>{window.__chapelGodLift=Number(e.target.value)/100;desk3D.sync('god',0,'read');window.dispatchEvent(new Event('resize'));});
   tools.addEventListener('click',e=>{const v=e.target.dataset.chapelView;if(v){window.__seatImmersion.enabled=v==='first';window.__seatImmersion.seat=0;window.__seatImmersion.fov=78;desk3D.sync(v,0,'read');}if(e.target.dataset.chapelSpeak!==undefined){window.__seatImmersion.enabled=false;desk3D.sync('first',0,'turn',Number(e.target.dataset.chapelSpeak));}});window.dispatchEvent(new Event('resize'));
 }requestAnimationFrame(start);
})();
