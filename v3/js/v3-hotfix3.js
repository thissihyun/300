/* 300 Days With You — stable movie drag + resilient Kakao import */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const me=()=>{try{return Identity.displayName(Identity.current())}catch(e){return ''}};
const rawDb=()=>{try{return window.firebase&&firebase.firestore?firebase.firestore():null}catch(e){return null}};
const today=()=>typeof todayISO==='function'?todayISO():(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})();

/* ---------- Stable V1 movie track ---------- */
function bindStableTrack(track){
  if(!track||track.dataset.hotfixDrag==='1')return;
  track.dataset.hotfixDrag='1';
  let down=false,startX=0,startLeft=0,dragged=false,pid=null;
  track.addEventListener('dragstart',e=>e.preventDefault());
  track.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse' && e.button!==0)return;
    down=true;dragged=false;pid=e.pointerId;startX=e.clientX;startLeft=track.scrollLeft;
    track.classList.add('is-grabbing');
    try{track.setPointerCapture(pid)}catch(_e){}
  });
  track.addEventListener('pointermove',e=>{
    if(!down)return;
    const dx=e.clientX-startX;
    if(Math.abs(dx)>4)dragged=true;
    if(dragged){track.scrollLeft=startLeft-dx;e.preventDefault();}
  },{passive:false});
  const finish=()=>{if(!down)return;down=false;track.classList.remove('is-grabbing');try{if(pid!=null)track.releasePointerCapture(pid)}catch(_e){}pid=null;};
  track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',finish);track.addEventListener('lostpointercapture',finish);
  track.addEventListener('click',e=>{if(!dragged)return;e.preventDefault();e.stopImmediatePropagation();dragged=false;},true);
  track.addEventListener('wheel',e=>{
    if(track.scrollWidth<=track.clientWidth+3)return;
    const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
    if(delta){track.scrollLeft+=delta;e.preventDefault();}
  },{passive:false});
}
function addMovieArrows(frame){
  if(!frame||frame.querySelector('.v3-movie-arrow'))return;
  const track=frame.querySelector('.v1-film-track');if(!track)return;
  const left=document.createElement('button'),right=document.createElement('button');
  left.type=right.type='button';left.className='v3-movie-arrow left';right.className='v3-movie-arrow right';left.textContent='‹';right.textContent='›';
  left.setAttribute('aria-label','이전 챕터');right.setAttribute('aria-label','다음 챕터');
  left.onclick=e=>{e.stopPropagation();track.scrollBy({left:-Math.max(220,track.clientWidth*.72),behavior:'smooth'})};
  right.onclick=e=>{e.stopPropagation();track.scrollBy({left:Math.max(220,track.clientWidth*.72),behavior:'smooth'})};
  frame.append(left,right);
}
function stabilizeHomeMovie(){
  const fresh=$('#view-home #movieStrip');
  if(fresh&&fresh.querySelector('.v1-movie-frame')){
    /* v3-userfix continuously rewrites #movieStrip. Rename it once populated so that observer can no longer replace it. */
    fresh.id='movieStripStable';fresh.dataset.movieStable='1';
  }
  $$('#view-home #movieStripStable .v1-film-track, #view-ourstory .v1-film-track').forEach(bindStableTrack);
  $$('#view-home #movieStripStable .v1-movie-frame, #view-ourstory .v1-movie-frame').forEach(addMovieArrows);
}
let movieQueued=false;
const movieObserver=new MutationObserver(()=>{if(movieQueued)return;movieQueued=true;requestAnimationFrame(()=>{movieQueued=false;stabilizeHomeMovie()})});
movieObserver.observe(document.body,{childList:true,subtree:true});
stabilizeHomeMovie();

/* ---------- Local latest-chat fallback (IndexedDB) ---------- */
const IDB_NAME='days300-kakao',IDB_STORE='archive';
function idbOpen(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(new Error('indexeddb-unavailable'));const req=indexedDB.open(IDB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(IDB_STORE))db.createObjectStore(IDB_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('indexeddb-open'));});}
async function idbSet(key,val){const db=await idbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).put(val,key);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{const e=tx.error;db.close();reject(e)}})}
async function idbGet(key){const db=await idbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readonly'),req=tx.objectStore(IDB_STORE).get(key);req.onsuccess=()=>{const v=req.result;db.close();resolve(v||null)};req.onerror=()=>{const e=req.error;db.close();reject(e)}})}
function groupChat(messages){const out={};(messages||[]).forEach(m=>{(out[m.date]=out[m.date]||[]).push({s:m.speaker,t:m.text})});return out;}
function flatten(data){const out=[];Object.keys(data||{}).sort().forEach(date=>(data[date]||[]).forEach(m=>out.push({date,speaker:m.s,text:m.t})));return out;}
let activeChat=null,activeLoaded=false;

/* Store raw chat in small documents inside the already-used kakao_stats collection. */
async function saveCloudChunks(messages,stats,onProgress){
  const db=rawDb();if(!db)throw Object.assign(new Error('Firebase is not ready'),{code:'firebase-not-ready'});
  const grouped=groupChat(messages),col=db.collection('kakao_stats');
  const existing=await col.get();
  const deletions=[];existing.forEach(doc=>{if(doc.id.startsWith('chat__')||doc.id==='_chat_meta')deletions.push(doc.ref)});
  const ops=deletions.map(ref=>({del:true,ref}));
  const CHUNK=160;
  Object.keys(grouped).sort().forEach(date=>{
    const rows=grouped[date];
    for(let i=0;i<rows.length;i+=CHUNK){
      const part=Math.floor(i/CHUNK),id=`chat__${date}__${String(part).padStart(3,'0')}`;
      ops.push({ref:col.doc(id),data:{kind:'chat_chunk',date,part,messages:rows.slice(i,i+CHUNK),count:Math.min(CHUNK,rows.length-i)}});
    }
  });
  ops.push({ref:col.doc('_chat_meta'),data:{kind:'chat_meta',total:messages.length,byDays:Object.keys(grouped).length,dateRange:stats.dateRange||null,asOf:stats.asOf||today(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()}});
  const BATCH=300;
  for(let i=0;i<ops.length;i+=BATCH){const batch=db.batch();ops.slice(i,i+BATCH).forEach(op=>op.del?batch.delete(op.ref):batch.set(op.ref,op.data));await batch.commit();onProgress&&onProgress(Math.min(i+BATCH,ops.length),ops.length);}
  activeChat=grouped;activeLoaded=true;
}
async function loadCloudChunks(){
  const db=rawDb();if(!db)return null;
  try{
    const snap=await db.collection('kakao_stats').get(),parts={};
    snap.forEach(doc=>{if(!doc.id.startsWith('chat__'))return;const d=doc.data();if(!d.date||!Array.isArray(d.messages))return;(parts[d.date]=parts[d.date]||[]).push({part:Number(d.part)||0,messages:d.messages});});
    const data={};Object.keys(parts).forEach(date=>{data[date]=parts[date].sort((a,b)=>a.part-b.part).flatMap(x=>x.messages)});
    return Object.keys(data).length?data:null;
  }catch(e){console.warn('[Kakao chunks load]',e);return null;}
}
async function ensureActiveChat(){
  if(activeLoaded)return activeChat;
  activeLoaded=true;
  const cloud=await loadCloudChunks();if(cloud){activeChat=cloud;try{await idbSet('latest',cloud)}catch(_e){}return activeChat;}
  try{activeChat=await idbGet('latest')}catch(_e){activeChat=null}
  return activeChat;
}
const priorFullChat=window.FullChat;
if(priorFullChat){
  window.FullChat={
    load:async()=>{const a=await ensureActiveChat();if(a)return a;return priorFullChat.load();},
    allMessages:()=>activeChat?flatten(activeChat):priorFullChat.allMessages(),
    messagesForDate:date=>activeChat?(activeChat[date]||[]).map(m=>({date,speaker:m.s,text:m.t})):priorFullChat.messagesForDate(date),
    get ready(){return !!activeChat||priorFullChat.ready;}
  };
}
ensureActiveChat().catch(()=>{});

function errLabel(err){const code=String(err?.code||err?.message||'unknown');if(/permission-denied/i.test(code))return '공유 저장 권한이 허용되지 않았어요 (permission-denied)';if(/resource-exhausted|quota/i.test(code))return '저장 용량/사용량 한도에 걸렸어요';if(/unavailable|network|offline/i.test(code))return '네트워크 연결을 확인해주세요';return `원문 공유 저장 오류 · ${code}`;}

/* Override the importer last, so saving stats never gets reported as a total failure just because raw-chat cloud sync failed. */
function registerImport(){
  if(!window.Router||!window.KakaoParse||!window.DB)return;
  Router.registerSpecial('kakao',{render(host){
    host.innerHTML=`<button class="btn btn-sm btn-outline" data-action="special-back">← SPECIAL</button><div class="section-head" style="margin-top:14px"><div><div class="section-title">KAKAO IMPORT</div><div class="section-note">최신 카카오톡 .txt를 올리면 통계와 실제 대화를 함께 갱신해요.</div></div></div><div class="v3-kakao-import-card"><div class="v3-kakao-how"><b>저장 방식</b><span>① 통계는 둘이 함께 보는 저장소에 갱신</span><span>② 실제 대화는 이 기기에 먼저 보관하고, 공유 저장도 이어서 시도합니다.</span><span>③ 공유 저장이 막혀도 통계와 이 기기의 최신 카톡은 사라지지 않아요.</span></div><input type="file" id="v3KakaoFile" accept=".txt,text/plain"><div id="v3KakaoPreview" class="section-note" style="margin-top:10px"></div><button class="btn btn-sm" id="v3KakaoSave" style="display:none">최신 카톡으로 저장</button></div>`;
    let pending=null,messages=null;const file=$('#v3KakaoFile',host),preview=$('#v3KakaoPreview',host),save=$('#v3KakaoSave',host);
    file.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;preview.textContent='파일을 읽는 중…';save.style.display='none';try{const text=await f.text();messages=KakaoParse.parseKakaoExport(text);if(!messages.length){preview.textContent='카카오톡 대화 내보내기 형식을 인식하지 못했어요.';return}pending=KakaoParse.aggregate(messages);const [from,to]=pending.dateRange||['',''];preview.innerHTML=`<b>${messages.length.toLocaleString()}개 메시지</b> · ${pending.byDays}일 · ${esc(from)} ~ ${esc(to)}<br>${Object.entries(pending.bySpeaker).map(([k,v])=>`${esc(k)} ${Number(v).toLocaleString()}`).join(' · ')}`;save.style.display='inline-flex';}catch(err){console.warn(err);preview.textContent='파일을 읽는 중 문제가 생겼어요.'}};
    save.onclick=async()=>{
      if(!pending||!messages)return;save.disabled=true;save.textContent='저장 중…';
      let localOK=false,statsOK=false,cloudOK=false,cloudErr=null;
      const grouped=groupChat(messages);
      try{await idbSet('latest',grouped);activeChat=grouped;activeLoaded=true;localOK=true;}catch(e){console.warn('[Kakao local save]',e)}
      try{await DB.setKakaoStats(pending);statsOK=true;}catch(e){console.warn('[Kakao stats save]',e)}
      if(statsOK){try{await saveCloudChunks(messages,pending,(done,total)=>{preview.innerHTML=`통계 저장 완료 ✓<br>실제 카톡 공유 저장 중… ${done} / ${total}`});cloudOK=true;}catch(e){cloudErr=e;console.warn('[Kakao raw cloud save]',e)}}
      try{await DB.logActivity('kakao',null,me(),`카톡 갱신 · ${pending.total.toLocaleString()}개`)}catch(_e){}
      window.dispatchEvent(new CustomEvent('kakao-archive-updated'));
      if(statsOK&&cloudOK){preview.innerHTML=`<b>저장 완료 ✓</b><br>${pending.total.toLocaleString()}개 메시지 · 통계와 실제 카톡이 둘이 보는 아카이브에 갱신됐어요.`;save.textContent='저장 완료';Router.toast('최신 카톡을 저장했어요');return;}
      if(statsOK&&localOK){preview.innerHTML=`<b>통계 저장 완료 ✓ · 이 기기 최신 카톡 저장 완료 ✓</b><br><span class="v3-kakao-warning">${esc(errLabel(cloudErr))}</span><br>검색·감사·Memory는 이 기기에서 최신 파일을 사용해요. 공유 원문 저장은 권한을 보완하면 다시 동기화할 수 있어요.`;save.disabled=false;save.textContent='공유 저장 다시 시도';Router.toast('통계와 이 기기 카톡은 저장됐어요');return;}
      preview.innerHTML=`<b>저장이 완료되지 않았어요.</b><br>${statsOK?'통계 ✓':'통계 ✕'} · ${localOK?'이 기기 카톡 ✓':'이 기기 카톡 ✕'}${cloudErr?`<br>${esc(errLabel(cloudErr))}`:''}`;save.disabled=false;save.textContent='다시 저장';
    };
  }});
}
registerImport();
})();
