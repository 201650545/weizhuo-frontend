'use strict';
// Ephemeral loopback-only USB rehearsal; no copyrighted script or private data.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=__dirname, rooms=new Map(), sessions=new Map();
const send=(res,code,obj,extra={})=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(obj));};
const secret=()=>crypto.randomBytes(24).toString('hex');
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1');const host=req.headers.host;if(host!=='127.0.0.1:4388'&&host!=='localhost:4388')return send(res,403,{error:'HOST'});
 if(url.pathname.startsWith('/usb-api/')){
  if(req.method==='POST'&&req.headers.origin!==`http://${host}`)return send(res,403,{error:'ORIGIN'});
  const token=(req.headers.cookie||'').split('; ').find(x=>x.startsWith('usb_room='))?.slice(9), id=sessions.get(token);let room=[...rooms.values()].find(r=>r.players.some(p=>p.id===id)),me=room?.players.find(p=>p.id===id);
  if(req.method==='GET'&&url.pathname==='/usb-api/state')return room?send(res,200,view(room,me)):send(res,401,{error:'NO_SESSION'});
  let data='';for await(const chunk of req){data+=chunk;if(data.length>4096)return send(res,413,{error:'TOO_LARGE'});}const body=JSON.parse(data||'{}');
  if(url.pathname==='/usb-api/create'||url.pathname==='/usb-api/join'){
   if(url.pathname.endsWith('create')){const code=crypto.randomBytes(3).toString('hex').toUpperCase();room={code,book:body.book==='last-whistle'?'last-whistle':'nianlun-candidate',players:[],pending:null,started:false};rooms.set(code,room)}else room=rooms.get(String(body.code||'').trim().toUpperCase());
   if(!room)return send(res,404,{error:'ROOM_NOT_FOUND'});if(room.started||room.players.length>=(room.book==='last-whistle'?6:5))return send(res,409,{error:'ROOM_FULL'});
   const t=secret();me={id:secret(),name:String(body.name||'玩家').trim().slice(0,20)||'玩家',role:null,ready:false,read:false};room.players.push(me);sessions.set(t,me.id);return send(res,200,view(room,me),{'Set-Cookie':`usb_room=${t}; HttpOnly; SameSite=Strict; Path=/`});
  }
  if(!room)return send(res,401,{error:'NO_SESSION'});if(room.started&&!url.pathname.endsWith('/read'))return send(res,409,{error:'STARTED'});
  if(url.pathname==='/usb-api/claim'){const role=Number(body.role),max=room.book==='last-whistle'?6:5;if(!Number.isInteger(role)||role<0||role>=max||me.ready||room.players.some(p=>p!==me&&p.role===role))return send(res,409,{error:'ROLE_UNAVAILABLE'});me.role=role;}
  else if(url.pathname==='/usb-api/ready'){if(me.role===null)return send(res,409,{error:'ROLE_REQUIRED'});me.ready=!!body.ready;if(room.players.length===(room.book==='last-whistle'?6:5)&&room.players.every(p=>p.ready)&&!room.pending)room.started=true;}
  else if(url.pathname==='/usb-api/read'){if(!room.started)return send(res,409,{error:'NOT_STARTED'});me.read=true;if(room.players.every(p=>p.read))room.stage=1;}
  else if(url.pathname==='/usb-api/swap'){const other=room.players[Number(body.target)];if(!other||other===me||other.role===null||me.role===null||room.pending)return send(res,409,{error:'SWAP_UNAVAILABLE'});room.pending={from:me.id,to:other.id};}
  else if(url.pathname==='/usb-api/respond'){if(!room.pending||room.pending.to!==me.id)return send(res,409,{error:'NO_REQUEST'});const other=room.players.find(p=>p.id===room.pending.from);if(body.accept){[me.role,other.role]=[other.role,me.role];me.ready=other.ready=false;}room.pending=null;}
  else return send(res,404,{error:'NOT_FOUND'});return send(res,200,view(room,me));
 }
 if(req.method!=='GET')return send(res,404,{error:'NOT_FOUND'});if(url.pathname==='/favicon.ico'){res.writeHead(204);return res.end();}let rel=decodeURIComponent(url.pathname);if(rel==='/')rel='/围桌样板.html';const target=path.resolve(root,'.'+rel);if(!target.startsWith(root+path.sep)||!(/^(围桌样板\.html|assets[\\/]book-covers[\\/][^\\/]+\.png|assets[\\/]role-concept[\\/][^\\/]+\.(png|webp)|assets[\\/]chapel-materials-4k[\\/][^\\/]+\.(jpg|png|webp)|assets[\\/]chapel-materials[\\/][^\\/]+\.(png|webp)|音乐策划_20261116[\\/]游戏音乐[\\/]audio[\\/][^\\/]+\.m4a)$/u.test(path.relative(root,target))))return send(res,404,{error:'NOT_FOUND'});const type=target.endsWith('.html')?'text/html; charset=utf-8':target.endsWith('.png')?'image/png':'audio/mp4';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});fs.createReadStream(target).on('error',()=>res.destroy()).pipe(res);
 }catch(e){send(res,400,{error:'BAD_REQUEST'});}});
function view(room,me){return {code:room.code,book:room.book,started:room.started,stage:room.stage||0,me:room.players.indexOf(me),players:room.players.map(p=>({name:p.name,role:p.role,ready:p.ready,read:!!p.read})),pending:room.pending?{from:room.players.findIndex(p=>p.id===room.pending.from),to:room.players.findIndex(p=>p.id===room.pending.to)}:null};}
server.listen(4388,'127.0.0.1',()=>console.log('USB ROOM TEST http://127.0.0.1:4388/')); 
