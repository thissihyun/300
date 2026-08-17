/* 300 Days With You — interaction, bulk photo dates, and Kakao archive sync */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const me=()=>{try{return Identity.displayName(Identity.current())}catch(e){return ''}};
  const today=()=>typeof todayISO==='function'?todayISO():(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})();
  const rawDb=()=>{try{return window.firebase&&firebase.firestore?firebase.firestore():null}catch(e){return null}};

  function enableFilmDrag(track){
    if(!track||track.dataset.v3Drag==='1')return;
    track.dataset.v3Drag='1';
    let dragging=false,startX=0,startLeft=0,moved=false,pointerId=null;
    track.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch')return;
      if(e.button!=null&&e.button!==0)return;
      dragging=true;moved=false;startX=e.clientX;startLeft=track.scrollLeft;pointerId=e.pointerId;
      try{track.setPointerCapture(pointerId)}catch(_e){}
      track.classList.add('is-dragging');
    });
    track.addEventListener('pointermove',e=>{
      if(!dragging)return;
      const dx=e.clientX-startX;
      if(Math.abs(dx)>5)moved=true;
      track.scrollLeft=startLeft-dx;
      if(moved)e.preventDefault();
    });
    const stop=()=>{
      if(!dragging)return;
      dragging=false;track.classList.remove('is-dragging');
      try{if(pointerId!=null)track.releasePointerCapture(pointerId)}catch(_e){}
      pointerId=null;
    };
    track.addEventListener('pointerup',stop);
    track.addEventListener('pointercancel',stop);
    track.addEventListener('click',e=>{
      if(!moved)return;
      e.preventDefault();e.stopPropagation();moved=false;
    },true);
    track.addEventListener('wheel',e=>{
      if(track.scrollWidth<=track.clientWidth+2)return;
      if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){track.scrollLeft+=e.deltaY;e.preventDefault();}
    },{passive:false});
  }
  function installFilmDrag(){ $$('.v1-film-track').forEach(enableFilmDrag); }

  let photoCache=[];
  if(window.DB&&DB.onAllPhotos)DB.onAllPhotos(rows=>{photoCache=rows||[]});
  const pad=n=>String(n).padStart(2,'0');
  function ymdFromDate(d){if(!(d instanceof Date)||Number.isNaN(+d))return null;return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
  function parseExifString(s){const m=String(s||'').match(/(20\d{2}):(\d{2}):(\d{2})/);return m?`${m[1]}-${m[2]}-${m[3]}`:null;}
  function readAscii(view,offset,len){let out='';for(let i=0;i<len&&offset+i<view.byteLength;i++){const c=view.getUint8(offset+i);if(!c)break;out+=String.fromCharCode(c);}return out;}
  async function jpegExifDate(file){
    if(!/^image\/(jpeg|jpg)$/i.test(file.type)&&!/.jpe?g$/i.test(file.name))return null;
    const buf=await file.slice(0,Math.min(file.size,512*1024)).arrayBuffer();
    const v=new DataView(buf);if(v.byteLength<4||v.getUint16(0,false)!==0xffd8)return null;
    let p=2;
    while(p+4<v.byteLength){
      if(v.getUint8(p)!==0xff){p++;continue}
      const marker=v.getUint8(p+1);p+=2;
      if(marker===0xd9||marker===0xda)break;
      if(p+2>v.byteLength)break;
      const len=v.getUint16(p,false);if(len<2||p+len>v.byteLength)break;
      if(marker===0xe1&&len>=10&&readAscii(v,p+2,6)==='Exif'){
        const tiff=p+8;if(tiff+8>v.byteLength)return null;
        const order=readAscii(v,tiff,2),little=order==='II';if(!little&&order!=='MM')return null;
        const u16=o=>v.getUint16(o,little),u32=o=>v.getUint32(o,little);
        const readEntryString=(base,entry)=>{const type=u16(entry+2),count=u32(entry+4);if(type!==2||!count)return null;const off=count<=4?entry+8:base+u32(entry+8);if(off<0||off+count>v.byteLength)return null;return readAscii(v,off,count);};
        const scanIfd=(base,ifdOff)=>{const pos=base+ifdOff;if(pos+2>v.byteLength)return {date:null,exif:null};const count=u16(pos);let date=null,exif=null;for(let i=0;i<count;i++){const e=pos+2+i*12;if(e+12>v.byteLength)break;const tag=u16(e);if(tag===0x0132)date=parseExifString(readEntryString(base,e))||date;if(tag===0x8769)exif=u32(e+8);}return {date,exif};};
        const ifd0=u32(tiff+4),base=tiff,root=scanIfd(base,ifd0);
        if(root.exif){const pos=base+root.exif;if(pos+2<=v.byteLength){const count=u16(pos);for(let i=0;i<count;i++){const e=pos+2+i*12;if(e+12>v.byteLength)break;const tag=u16(e);if(tag===0x9003||tag===0x9004){const d=parseExifString(readEntryString(base,e));if(d)return d;}}}}
        return root.date;
      }
      p+=len;
    }
    return null;
  }
  function filenameDate(name){const m=String(name||'').match(/(20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?([0-2]\d|3[01])/);return m?`${m[1]}-${m[2]}-${m[3]}`:null;}
  async function dateForFile(file){try{const exif=await jpegExifDate(file);if(exif)return {date:exif,source:'EXIF'};}catch(_e){}const fn=filenameDate(file.name);if(fn)return {date:fn,source:'파일명'};if(file.lastModified){const d=ymdFromDate(new Date(file.lastModified));if(d)return {date:d,source:'파일 날짜'};}return {date:today(),source:'오늘'};}
  function imageToSafeDataURL(file,maxDim=1500){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('image-decode-failed'));img.onload=()=>{let w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(w>maxDim||h>maxDim){const scale=maxDim/Math.max(w,h);w=Math.round(w*scale);h=Math.round(h*scale)}const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);let q=.82,url=canvas.toDataURL('image/jpeg',q);while(url.length>850000&&q>.5){q-=.1;url=canvas.toDataURL('image/jpeg',q)}resolve(url);};img.src=reader.result;};reader.readAsDataURL(file);
    });
  }
  function addBulkButton(){
    const actions=$('#view-album .v3-album-hero-actions');if(!actions||$('#v3BulkPhotoBtn',actions))return;
    const b=document.createElement('button');b.className='btn btn-outline';b.id='v3BulkPhotoBtn';b.textContent='＋ 여러 장 날짜 자동';b.addEventListener('click',openBulkUploader);actions.insertBefore(b,actions.firstChild?.nextSibling||null);
  }
  function openBulkUploader(){
    const panel=$('#uploadPanel');if(!panel)return;
    panel.innerHTML=`<div class="modal-top"><button class="icon-btn" data-action="close-modal">✕</button></div><div class="v3-album-modal-k">BULK PHOTO IMPORT</div><h2 class="modal-title">여러 장을 촬영일별로 자동 정리</h2><div class="v3-bulk-help"><b>아이클라우드 앨범도 이렇게 가져오면 돼요.</b><span>사진 여러 장을 한 번에 선택하면 EXIF 촬영일 → 파일명 날짜 → 파일 수정일 순으로 날짜를 찾습니다. 저장 전 날짜별 개수를 먼저 보여줘요.</span><span>원본 파일 자체는 바꾸지 않고, 웹 표시용 복사본만 크기를 줄여 저장합니다.</span></div><label class="section-note v3-album-field-label">사진 여러 장 선택</label><input class="v3-file-input" type="file" id="v3BulkFiles" accept="image/*" multiple><label class="section-note v3-album-field-label">컴퓨터에서 폴더째 선택</label><input class="v3-file-input" type="file" id="v3BulkFolder" accept="image/*" multiple webkitdirectory directory><div id="v3BulkStatus" class="section-note" style="margin-top:10px"></div><div id="v3BulkPreview" class="v3-bulk-preview"></div><div class="v3-album-modal-actions"><button class="btn" id="v3BulkSave" disabled>날짜별로 저장</button></div>`;
    let pending=[];
    const prepare=async files=>{pending=[];const status=$('#v3BulkStatus',panel),preview=$('#v3BulkPreview',panel);preview.innerHTML='';const imgs=Array.from(files||[]).filter(f=>f.type.startsWith('image/')||/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));for(let i=0;i<imgs.length;i++){status.textContent=`날짜 확인 중 ${i+1} / ${imgs.length} · ${imgs[i].name}`;const info=await dateForFile(imgs[i]);pending.push({file:imgs[i],...info});}const groups={};pending.forEach(x=>(groups[x.date]=groups[x.date]||[]).push(x));preview.innerHTML=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,rows])=>`<div class="v3-bulk-group"><b>${esc(date)}</b><span>${rows.length}장</span><small>${[...new Set(rows.map(r=>r.source))].join(' · ')}</small></div>`).join('')||'<div class="empty-frame">선택한 사진이 없어요.</div>';status.textContent=`${pending.length}장 · ${Object.keys(groups).length}개 날짜로 분류됨`;$('#v3BulkSave',panel).disabled=!pending.length;};
    $('#v3BulkFiles',panel).addEventListener('change',e=>prepare(e.target.files));$('#v3BulkFolder',panel).addEventListener('change',e=>prepare(e.target.files));
    $('#v3BulkSave',panel).addEventListener('click',async()=>{if(!pending.length)return;const btn=$('#v3BulkSave',panel),status=$('#v3BulkStatus',panel);btn.disabled=true;const heroByDate={};photoCache.forEach(p=>{if(p.hero)heroByDate[p.date]=true});const counts={},failed=[];for(let i=0;i<pending.length;i++){const x=pending[i];status.textContent=`저장 중 ${i+1} / ${pending.length} · ${x.date} · ${x.file.name}`;try{const url=await imageToSafeDataURL(x.file);const hero=!heroByDate[x.date];await DB.addPhoto({date:x.date,url,hero,bookPick:false,place:'',food:'',type:'',moods:[],caption:'',author:me(),originalName:x.file.name,dateSource:x.source});if(hero)heroByDate[x.date]=true;counts[x.date]=(counts[x.date]||0)+1;}catch(err){failed.push(x.file.name);console.warn('[bulk photo]',x.file.name,err)}}for(const [date,n] of Object.entries(counts)){try{await DB.logActivity('photo',date,me(),`${n}장 대량 추가`)}catch(_e){}}status.textContent=`완료 · ${pending.length-failed.length}장 저장${failed.length?` · ${failed.length}장 실패`:''}`;Router.toast(`${pending.length-failed.length}장의 사진을 날짜별로 저장했어요`);if(!failed.length)setTimeout(()=>{const m=$('#uploadModal');if(m)m.classList.remove('is-open');document.body.classList.remove('modal-open')},700);else{btn.disabled=false;btn.textContent='다시 시도';}});
    $('#uploadModal').classList.add('is-open');document.body.classList.add('modal-open');
  }

  const baseFullChat=window.FullChat;let cloudChat=null,cloudLoading=null;
  function flattenChat(data){const out=[];Object.keys(data||{}).sort().forEach(date=>(data[date]||[]).forEach(m=>out.push({date,speaker:m.s,text:m.t})));return out;}
  async function loadCloudChat(force=false){if(cloudChat&&!force)return cloudChat;if(cloudLoading&&!force)return cloudLoading;const db=rawDb();if(!db)return null;cloudLoading=(async()=>{try{const snap=await db.collection('kakao_archive').get();const data={};snap.forEach(doc=>{if(doc.id==='_meta')return;const row=doc.data();if(Array.isArray(row.messages))data[doc.id]=row.messages});cloudChat=Object.keys(data).length?data:null;return cloudChat;}catch(e){console.warn('[Kakao cloud archive load]',e);return null}finally{cloudLoading=null}})();return cloudLoading;}
  if(baseFullChat){window.FullChat={load:async()=>{const cloud=await loadCloudChat();if(cloud)return cloud;return baseFullChat.load();},allMessages:()=>cloudChat?flattenChat(cloudChat):baseFullChat.allMessages(),messagesForDate:date=>cloudChat?(cloudChat[date]||[]).map(m=>({date,speaker:m.s,text:m.t})):baseFullChat.messagesForDate(date),get ready(){return !!cloudChat||baseFullChat.ready;}};}
  function groupChat(messages){const out={};messages.forEach(m=>{(out[m.date]=out[m.date]||[]).push({s:m.speaker,t:m.text})});return out;}
  async function saveChatArchive(messages,stats,onProgress){
    const db=rawDb();if(!db)throw new Error('firebase-not-ready');const grouped=groupChat(messages),dates=Object.keys(grouped).sort();const old=await db.collection('kakao_archive').get();const oldIds=new Set(old.docs.filter(d=>d.id!=='_meta').map(d=>d.id));const ops=[];dates.forEach(date=>{oldIds.delete(date);ops.push({type:'set',ref:db.collection('kakao_archive').doc(date),data:{date,messages:grouped[date],count:grouped[date].length}})});oldIds.forEach(id=>ops.push({type:'delete',ref:db.collection('kakao_archive').doc(id)}));ops.push({type:'set',ref:db.collection('kakao_archive').doc('_meta'),data:{total:messages.length,byDays:dates.length,dateRange:stats.dateRange||null,asOf:stats.asOf||today(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()}});const chunk=400;for(let i=0;i<ops.length;i+=chunk){const batch=db.batch();ops.slice(i,i+chunk).forEach(op=>op.type==='delete'?batch.delete(op.ref):batch.set(op.ref,op.data));await batch.commit();if(onProgress)onProgress(Math.min(ops.length,i+chunk),ops.length);}cloudChat=grouped;
  }
  function registerKakaoImport(){
    if(!window.Router||!window.KakaoParse||!window.DB)return;
    Router.registerSpecial('kakao',{render(host){
      host.innerHTML=`<button class="btn btn-sm btn-outline" data-action="special-back">← SPECIAL</button><div class="section-head" style="margin-top:14px"><div><div class="section-title">KAKAO IMPORT</div><div class="section-note">최신 카카오톡 .txt를 올리면 통계뿐 아니라 실제 대화 아카이브도 새 파일 기준으로 갱신돼요.</div></div></div><div class="v3-kakao-import-card"><div class="v3-kakao-how"><b>이번부터 저장되는 것</b><span>월별 메시지 수 · 단어 통계 · 실제 날짜별 카톡 원문</span><span>그래서 업로드 후 검색, Memory, THANK-YOU JAR에도 최신 대화가 반영됩니다.</span></div><input type="file" id="v3KakaoFile" accept=".txt,text/plain"><div id="v3KakaoPreview" class="section-note"></div><button class="btn btn-sm" id="v3KakaoSave" style="display:none">최신 카톡으로 저장</button></div>`;
      let pending=null,messages=null;const file=$('#v3KakaoFile',host),preview=$('#v3KakaoPreview',host),save=$('#v3KakaoSave',host);
      file.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;preview.textContent='파일을 읽는 중…';save.style.display='none';try{const text=await f.text();messages=KakaoParse.parseKakaoExport(text);if(!messages.length){preview.textContent='카카오톡 대화 내보내기 형식을 인식하지 못했어요.';return}pending=KakaoParse.aggregate(messages);const [from,to]=pending.dateRange||['',''];preview.innerHTML=`<b>${messages.length.toLocaleString()}개 메시지</b> · ${pending.byDays}일 · ${esc(from)} ~ ${esc(to)}<br>${Object.entries(pending.bySpeaker).map(([k,v])=>`${esc(k)} ${Number(v).toLocaleString()}`).join(' · ')}<br><span class="v3-kakao-warning">저장하면 현재 공유 카톡 아카이브를 이 파일 내용으로 교체합니다.</span>`;save.style.display='inline-flex';}catch(err){console.warn(err);preview.textContent='파일을 읽는 중 문제가 생겼어요.'}});
      save.addEventListener('click',async()=>{if(!pending||!messages)return;save.disabled=true;save.textContent='저장 중…';try{await DB.setKakaoStats(pending);await saveChatArchive(messages,pending,(done,total)=>{preview.innerHTML=`카톡 원문 저장 중… ${done} / ${total} 묶음`});await DB.logActivity('kakao',null,me(),`카톡 아카이브 갱신 · ${pending.total.toLocaleString()}개`);preview.innerHTML=`<b>저장 완료 ✓</b><br>${pending.total.toLocaleString()}개 메시지 · ${pending.byDays}일 · 검색/감사/Memory에 최신 대화가 적용됩니다.`;save.textContent='저장 완료';Router.toast('최신 카톡 아카이브를 저장했어요');window.dispatchEvent(new CustomEvent('kakao-archive-updated'));}catch(err){console.warn('[Kakao save]',err);preview.textContent='저장에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.';save.disabled=false;save.textContent='다시 저장'}});
    }});
  }
  registerKakaoImport();

  let queued=false;function polish(){queued=false;installFilmDrag();addBulkButton();}
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(polish)});observer.observe(document.body,{childList:true,subtree:true});polish();
})();