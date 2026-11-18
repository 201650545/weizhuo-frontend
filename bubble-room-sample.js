// Isolated visual sample: uses the original scene, never changes the real room.
(() => {
  'use strict';
  const layer = document.getElementById('bubble-layer'), phone = document.querySelector('.phone');
  const records = [];
  let lastPhase = -1, lastOffline = false, fadeTimer, lastLayout = 0, lastBounds = [], lastAvoidance = null, glassOnly = false, serial = 0;
  const brief = ['先读自己的角色本，读完主动确认。', '现在请 B 席陈述，其他人先听。', '可以互相提问了，公共资料稍后开放。', '本幕资料已开放，一起核对材料。', '现在自由讨论，主持不代替大家判断。'];
  function showMessage(who, text, full = text) {
    const record = { id: ++serial, who, text, full }; records.push(record);
    if (records.length > 30) records.shift();
    clearTimeout(fadeTimer);
    if (s.tab !== 'room' || glassOnly) return;
    layer.hidden = false;
    layer.innerHTML = `<article class="room-bubble" data-message-id="${record.id}" aria-label="${esc(who)}的新消息"><div class="bubble-meta"><span>${esc(who)} · 新消息</span><button data-bubble-dismiss="true" aria-label="收起这条气泡">×</button></div><p>${esc(text)}</p><button class="bubble-open" data-bubble-history="true">点开完整消息 ›</button></article>`;
    layoutBubble();
    fadeTimer = setTimeout(hideBubble, 7000);
    updateCount();
  }
  function hideBubble() { clearTimeout(fadeTimer); layer.hidden = true; layer.innerHTML = ''; lastAvoidance = null; }
  function updateCount() { const n = document.getElementById('bubble-count'); if (n) n.textContent = records.length ? `消息 ${records.length}` : '消息'; }
  function rect(el, base) { const r=el.getBoundingClientRect(); return { left:r.left-base.left, right:r.right-base.left, top:r.top-base.top, bottom:r.bottom-base.top }; }
  function overlap(a,b,pad=0) { return a.left<b.right+pad && a.right>b.left-pad && a.top<b.bottom+pad && a.bottom>b.top-pad; }
  function actorBounds() {
    if (!window.desk3D) return [];
    const snap=desk3D.snapshot(), b=document.getElementById('table-world').getBoundingClientRect(), p=phone.getBoundingClientRect(), scale=b.width/snap.framing.w;
    return snap.framing.actors.map(a=>({left:a.left*scale+b.left-p.left,right:a.right*scale+b.left-p.left,top:a.top*scale+b.top-p.top,bottom:a.bottom*scale+b.top-p.top})).filter(a=>a.right>0&&a.left<p.width&&a.bottom>0&&a.top<p.height);
  }
  function layoutBubble() {
    const el=layer.querySelector('.room-bubble');
    if (!el || s.tab!=='room' || glassOnly) return;
    const base=phone.getBoundingClientRect(), actors=actorBounds(); lastBounds=actors;
    const fixed=[...phone.querySelectorAll('.topbar,.demo-label,.glass-status,.glass-room-controls,.nav')].filter(e=>getComputedStyle(e).visibility!=='hidden').map(e=>rect(e,base));
    const w=el.offsetWidth,h=el.offsetHeight;
    const status=phone.querySelector('.glass-status'), controls=phone.querySelector('.glass-room-controls');
    const top=status?rect(status,base).bottom+10:155, bottom=controls?rect(controls,base).top-10:base.height-185;
    const candidates=[];
    for (let y=top;y+h<=bottom;y+=12) for(const x of [16,base.width-w-16,(base.width-w)/2]) candidates.push({left:x,top:y,right:x+w,bottom:y+h});
    const candidate=candidates.find(r=>r.left>=12&&r.right<=base.width-12&&!actors.some(a=>overlap(r,a,9))&&!fixed.some(a=>overlap(r,a,5)));
    if (candidate) { el.style.left=candidate.left+'px';el.style.top=candidate.top+'px';el.style.visibility='visible';lastAvoidance={visible:true,rect:candidate,actors,overlaps:actors.filter(a=>overlap(candidate,a,6)).length}; }
    else { el.style.visibility='hidden';lastAvoidance={visible:false,reason:'没有可避让人物的空间，消息保留在记录',actors}; }
  }
  function renderRoom() {
    phone.classList.toggle('bubble-mode',s.tab==='room');
    if (s.tab!=='room') { hideBubble(); return; }
    const p=phases[s.phase];
    document.getElementById('app').innerHTML=`<section class="glass-status"><div><h2>${esc(p.name)}</h2><p>第一幕 · ${s.phase===1?'B 席发言中':'五人围桌'}${s.offline?' · 固定文案回退':''}</p></div><div class="status-time">--:--<small>阶段时间示意</small></div></section><div class="glass-room-controls"><div class="glass-row"><button data-open="ask">问主持</button><button data-bubble-history="true" id="bubble-count">消息</button><button data-room-view="true" class="current-view">${(s.view||'first')==='god'?'第一人称':'固定座次'}</button><button data-room-clear="true">只看房间</button></div><button class="glass-action" data-main="true"><span>${esc(p.action)}</span><span>${s.phase===0?(s.read?'5/5 已读':'4/5 已读'):'进入 →'}</span></button><p class="glass-hint">拖动环视 · 新消息短暂弹出，完整内容在消息记录</p></div>`;
    if (lastPhase!==s.phase || lastOffline!==s.offline) { lastPhase=s.phase;lastOffline=s.offline;showMessage('AI 主持',s.offline?'接口暂不可用，按当前规则继续。':brief[s.phase],p.hint); }
    updateCount(); phone.classList.toggle('glass-only',glassOnly);
    layoutBubble();
  }
  function history() {
    openSheet('help');
    document.getElementById('sheet-heading').textContent='房间消息';
    document.getElementById('sheet-body').innerHTML=`<p class="sheet-intro">消息留在这里，不一直盖住人物。全部为交互演示，没有真实玩家对话。</p><ol class="bubble-history">${records.map(r=>`<li><small>${esc(r.who)}</small>${esc(r.full)}</li>`).join('')}</ol><button data-bubble-replay="true" style="min-height:44px;background:rgba(15,13,11,.22)">重显最近一条气泡</button><p class="bubble-safety">头像或身体没有空位时，气泡会直接收进记录，不硬盖在人物上。手动展开阅读面板除外。</p>`;
    hideBubble();
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.bubbleHistory)history();
    else if(b.dataset.bubbleDismiss)hideBubble();
    else if(b.dataset.bubbleReplay){const r=records[records.length-1];closeSheet();if(r)showMessage(r.who,r.text,r.full);}
    else if(b.dataset.bubbleDemo)showMessage('B 席 · 演示消息','我已经准备好了。','我已经准备好了。（气泡效果示意，不是角色台词）');
    else if(b.dataset.roomView){s.view=(s.view||'first')==='god'?'first':'god';syncScene();renderRoom();}
    else if(b.dataset.roomClear){glassOnly=true;phone.classList.add('glass-only');hideBubble();const restore=document.createElement('button');restore.className='restore-ui';restore.dataset.restoreUi='true';restore.textContent='显示操作';phone.append(restore);}
    else if(b.dataset.restoreUi){glassOnly=false;phone.classList.remove('glass-only');b.remove();renderRoom();}
  });
  function tick(now){if(now-lastLayout>100){lastLayout=now;layoutBubble();}requestAnimationFrame(tick);}
  window.bubbleRoom={render:renderRoom,showMessage,hideBubble,inspect:()=>({records:records.length,avoidance:lastAvoidance,actors:lastBounds,glassOnly})};
  render();requestAnimationFrame(tick);
})();
