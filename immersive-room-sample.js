(() => {
 'use strict';
 const $=s=>document.querySelector(s),root=$('.phone'),hud=$('#hud');
 window.__seatImmersion={enabled:false,seat:0,yaw:0,pitch:0,fov:78};
 window.deskPrototype={state:()=>({stage:'read',camera:'first',currentRole:0})};
 let hudTimer,messageTimer,pointer=null,ready=false,cooldown=0;
 function note(text){$('#message').textContent=text;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('#message').textContent='',2200);}
 function showHud(){if(!__seatImmersion.enabled)return;hud.classList.add('open');hud.setAttribute('aria-hidden','false');clearTimeout(hudTimer);hudTimer=setTimeout(hideHud,5500);}
 function hideHud(){hud.classList.remove('open');hud.setAttribute('aria-hidden','true');if(hud.contains(document.activeElement))document.activeElement.blur();}
 async function enter(){if(!ready){note('场景正在加载，请稍后再点。');return;}const seat=Number($('#seat-select').value);__seatImmersion.enabled=true;__seatImmersion.seat=seat;__seatImmersion.yaw=0;__seatImmersion.pitch=0;desk3D.resetExplore();desk3D.sync('first',seat,'read',seat);root.classList.add('pure');hideHud();$('#message').textContent='';
  // Browser support varies: immersion remains usable even if fullscreen/orientation are denied.
  try{if(!document.fullscreenElement&&root.requestFullscreen)await root.requestFullscreen();}catch{}
  try{if(screen.orientation?.lock)await screen.orientation.lock('landscape');}catch{}
 }
 function exit(){__seatImmersion.enabled=false;root.classList.remove('pure');hideHud();$('#message').textContent='';try{screen.orientation?.unlock?.();}catch{}if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});desk3D.sync('first',Number($('#seat-select').value),'read',0);$('#enter').focus();}
 $('#enter').onclick=enter;$('#exit').onclick=exit;$('#hide').onclick=hideHud;
 $('#seat-select').onchange=()=>{if(ready)desk3D.sync('first',Number($('#seat-select').value),'read',0);};
 document.addEventListener('click',e=>{const b=e.target.closest('[data-emote]');if(!b)return;if(performance.now()<cooldown){note('等这个动作结束再选下一个。');return;}desk3D.emoteSample(__seatImmersion.seat,b.dataset.emote);cooldown=performance.now()+1900;hideHud();/* No toast in clean view. The local player intentionally cannot see their own head. */});
 $('#other-demo').onclick=()=>{const target=(__seatImmersion.seat+2)%5;desk3D.emoteSample(target,'chuckle');hideHud();};
 root.addEventListener('pointerdown',e=>{if(e.target.closest('button,select,.hud,.setup'))return;if(!__seatImmersion.enabled)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};});
 root.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.lastX,dy=e.clientY-pointer.lastY;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>6)pointer.moved=true;if(pointer.moved){__seatImmersion.yaw=Math.max(-1.25,Math.min(1.25,__seatImmersion.yaw-dx*.005));__seatImmersion.pitch=Math.max(-.32,Math.min(.30,__seatImmersion.pitch+dy*.003));hideHud();}pointer.lastX=e.clientX;pointer.lastY=e.clientY;});
 root.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const moved=pointer.moved;pointer=null;if(!moved){if(hud.classList.contains('open'))hideHud();else showHud();}});
 root.addEventListener('pointercancel',()=>pointer=null);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&__seatImmersion.enabled)exit();else if(e.key===' '&&__seatImmersion.enabled){e.preventDefault();showHud();}});
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&__seatImmersion.enabled)showHud();});
 window.immersiveSample={ready(){ready=true;$('#enter').disabled=false;},enter,exit,showHud,hideHud,inspect(){return {enabled:__seatImmersion.enabled,seat:__seatImmersion.seat,yaw:__seatImmersion.yaw,pitch:__seatImmersion.pitch,hudVisible:hud.classList.contains('open'),networkSynchronized:false};}};
 $('#enter').disabled=true;hideHud();
})();
