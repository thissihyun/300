/* 300 Days With You — richer representative Kakao conversations */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATS={
  '달달':['사랑해','사랑하','여보','자기','좋아해','좋아하','평생','결혼','뽀뽀','안아','귀여워','귀엽','보고싶'],
  '설렘':['데이트','만나','같이 가','같이 놀','기대','처음','보고싶','놀자','가자'],
  '위로':['괜찮아','들어줄게','걱정마','울지마','속상','힘들','곁에','미안해','다행'],
  '응원':['화이팅','힘내','응원','잘할','멋지','축하','고생했','잘하고','잘 보고','잘보고'],
  '웃김':['ㅋㅋㅋㅋ','개웃','웃기','킹받','드립','놀려','레전드','푸하하','크하하'],
  '서운함':['서운','속상','왜 안','왜 톡','왜 카톡','말뿐','피곤해','무시','싫어','미안'],
  '슬픔':['슬퍼','슬프','울었','눈물','아쉽','ㅠㅠ','🥲','보고싶다'],
  '보고싶음':['보고싶','그립','빨리 보고','언제 봐','만나고 싶']
};
const SYSTEM=/^(사진(?: \d+장)?|동영상|이모티콘|파일:|카카오톡 프로필)$/;
function clean(date){
  let rows=[];try{rows=FullChat.messagesForDate(date)||[]}catch(_e){}
  return rows.map((m,i)=>({...m,_i:i})).filter(m=>m.text&&!SYSTEM.test(String(m.text).trim())&&!/^https?:\/\//.test(String(m.text).trim())&&!/^\[(네이버지도|지도)\]/.test(String(m.text).trim())&&!/원을 (보냈어요|받았어요)/.test(String(m.text)));
}
function score(text,cat){let n=0,s=String(text||'');(CATS[cat]||[]).forEach(k=>{if(s.includes(k))n+=k.length>3?4:3});if(s.length>=8&&s.length<=100)n++;if(/사랑|평생|보고싶|고마워|미안|괜찮|ㅋㅋㅋㅋ/.test(s))n++;return n}
function windowAround(rows,center,count=20){
  if(rows.length<=count)return rows;
  let start=Math.max(0,center-Math.floor(count*.42));
  if(start+count>rows.length)start=Math.max(0,rows.length-count);
  return rows.slice(start,start+count);
}
function auto20(date,preferredCategory){
  const rows=clean(date);if(!rows.length)return{category:'일상',rows:[]};
  let best={score:-1,category:preferredCategory||'일상',idx:Math.floor(rows.length*.55)};
  const cats=preferredCategory&&CATS[preferredCategory]?[preferredCategory]:Object.keys(CATS);
  cats.forEach(cat=>rows.forEach((m,i)=>{const s=score(m.text,cat);if(s>best.score)best={score:s,category:cat,idx:i}}));
  if(best.score<=1){best.category=preferredCategory||'일상';best.idx=Math.min(rows.length-1,Math.floor(rows.length*.55));}
  return {category:best.category,rows:windowAround(rows,best.idx,20).map(m=>({speaker:m.speaker||m.s,text:m.text,index:m._i}))};
}
function expandedFromMeta(date,meta){
  const rows=clean(date);if(!rows.length)return{category:meta?.repChatCategory||'일상',rows:[]};
  const saved=Array.isArray(meta?.repChat)?meta.repChat:[];
  if(saved.length>=10)return{category:meta.repChatCategory||'우리의 말',rows:saved.slice(0,20)};
  if(saved.length){
    const idxs=saved.map(x=>Number(x.index)).filter(Number.isFinite);
    if(idxs.length){
      const avg=idxs.reduce((a,b)=>a+b,0)/idxs.length;
      let center=0,dist=Infinity;rows.forEach((r,i)=>{const d=Math.abs(r._i-avg);if(d<dist){dist=d;center=i}});
      return {category:meta.repChatCategory||'우리의 말',rows:windowAround(rows,center,20).map(m=>({speaker:m.speaker||m.s,text:m.text,index:m._i}))};
    }
  }
  return auto20(date,meta?.repChatCategory);
}
function currentDate(){const m=location.hash.match(/^#\/memory\/(\d{4}-\d{2}-\d{2})/);return m?m[1]:''}
function getMeta(date){return new Promise(resolve=>{if(!DB.onDayMeta)return resolve(null);let off=null,done=false;off=DB.onDayMeta(date,d=>{if(done)return;done=true;try{off&&off()}catch(_e){}resolve(d||null)});setTimeout(()=>{if(!done){done=true;try{off&&off()}catch(_e){}resolve(null)}},1200)})}
async function paintMemory(){
  const date=currentDate(),box=$('#memoryPanel .v6-representative-kakao');if(!date||!box||box.dataset.v8Painting==='1')return;
  box.dataset.v8Painting='1';
  try{await FullChat.load();const meta=await getMeta(date),rep=expandedFromMeta(date,meta);if(!rep.rows.length)return;
    box.innerHTML=`<div class="v6-rep-head"><div><span>TODAY'S KAKAO · ${rep.rows.length} MESSAGES</span><b>${esc(rep.category||'우리의 말')}</b></div><button type="button" data-v6-edit-day="${esc(date)}">대표카톡 수정</button></div><div class="v6-rep-bubbles">${rep.rows.map(x=>`<div class="v6-rep-msg ${String(x.speaker||'').includes('시현')?'sihyun':'gangwon'}"><small>${esc(x.speaker||'')}</small><p>${esc(x.text||'')}</p></div>`).join('')}</div>`;
  }finally{delete box.dataset.v8Painting}
}
async function enhanceEditor(){
  const panel=$('#uploadPanel'),k=$('.v3-album-modal-k',panel);if(!panel||!k||!/^OUR DAY/.test(k.textContent||''))return;
  const m=(k.textContent||'').match(/(\d{4}-\d{2}-\d{2})/);if(!m)return;const date=m[1],preview=$('.v6-auto-preview',panel);if(!preview||preview.dataset.v8==='1')return;
  preview.dataset.v8='1';await FullChat.load();const cat=$('#v6RepCat',panel)?.value||'',a=auto20(date,cat);preview.innerHTML=`<span>AUTO · ${esc(a.category)} · 최대 20개</span>${a.rows.map(x=>`<p><b>${esc(x.speaker)}</b> ${esc(x.text)}</p>`).join('')}`;
  const head=$('.v6-rep-editor-head span',panel);if(head)head.textContent='실제 카톡 원문에서 자동으로 약 20개를 추천해요. 직접 최대 20개까지 고를 수도 있어요.';
}
function closeEditor(){const m=$('#uploadModal');if(m)m.classList.remove('is-open');document.body.classList.remove('modal-open')}
document.addEventListener('change',e=>{
  const x=e.target.closest?.('[data-v6-chat-idx]');if(!x||!x.checked)return;const checked=$$('#uploadPanel [data-v6-chat-idx]:checked');if(checked.length>20){x.checked=false;Router.toast('대표카톡은 최대 20개까지 고를 수 있어요')}
},true);
document.addEventListener('click',async e=>{
  const btn=e.target.closest?.('#v6DaySave,#v6UseAuto');if(!btn)return;
  e.preventDefault();e.stopImmediatePropagation();
  const panel=$('#uploadPanel'),k=$('.v3-album-modal-k',panel),m=(k?.textContent||'').match(/(\d{4}-\d{2}-\d{2})/);if(!m||!DB.setDayMeta)return;const date=m[1];
  await FullChat.load();const title=$('#v6DayTitle',panel)?.value.trim()||'',cat=$('#v6RepCat',panel)?.value||'일상';let result;
  if(btn.id==='v6UseAuto')result=auto20(date,cat);else{
    const rows=clean(date),selected=$$('[data-v6-chat-idx]:checked',panel).slice(0,20).map(x=>rows.find(r=>r._i===Number(x.dataset.v6ChatIdx))).filter(Boolean).map(r=>({speaker:r.speaker||r.s,text:r.text,index:r._i}));
    result=selected.length?{category:cat,rows:selected}:auto20(date,cat);
  }
  await DB.setDayMeta(date,{title,repChatCategory:result.category,repChat:result.rows,updatedBy:(()=>{try{return Identity.displayName(Identity.current())}catch(_e){return''}})()});
  Router.toast(`대표카톡 ${result.rows.length}개를 저장했어요`);closeEditor();setTimeout(paintMemory,100);
},true);
let q=false;function run(){q=false;paintMemory();enhanceEditor()}
new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>setTimeout(paintMemory,80));run();
})();

/* Home first-screen photo manager + release-copy cleanup */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>typeof todayISO==='function'?todayISO():(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})();
const me=()=>{try{return Identity.displayName(Identity.current())}catch(_e){return''}};
let photos=[];
if(window.DB&&DB.onAllPhotos)DB.onAllPhotos(rows=>{photos=rows||[];if($('#v9HomeGrid'))renderHomeGrid();installHomeEntry()});
function closeModal(){const m=$('#uploadModal');if(m)m.classList.remove('is-open');document.body.classList.remove('modal-open')}
function safeDataUrl(file){return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onerror=reject;fr.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('image-decode-failed'));img.onload=()=>{let w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,max=1500;if(Math.max(w,h)>max){const s=max/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s)}let tries=0;const make=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);let q=.82,u=c.toDataURL('image/jpeg',q);while(u.length>430000&&q>.42){q-=.08;u=c.toDataURL('image/jpeg',q)}if(u.length>470000&&tries<3){tries++;w=Math.max(640,Math.round(w*.82));h=Math.max(640,Math.round(h*.82));return make()}resolve(u)};make()};img.src=fr.result};fr.readAsDataURL(file)})}
function candidates(){const chosen=photos.filter(p=>p.homeHero),heroes=photos.filter(p=>p.hero&&!p.homeHero),seen=new Set(chosen.map(p=>p.id));const out=chosen.slice();heroes.forEach(p=>{if(!seen.has(p.id)){seen.add(p.id);out.push(p)}});return out.sort((a,b)=>(b.date||'').localeCompare(a.date||''))}
function photoTitle(p){return p.title||p.caption||((window.EVENTS||{})[p.date]?.title)||'우리 사진'}
function renderHomeGrid(){const host=$('#v9HomeGrid');if(!host)return;const date=$('#v9HomeDateFilter')?.value||'';let list=date?photos.filter(p=>p.date===date):candidates();list=list.sort((a,b)=>(b.date||'').localeCompare(a.date||''));host.innerHTML=list.length?list.map(p=>`<button type="button" class="v9-home-choice ${p.homeHero?'is-selected':''}" data-v9-home-photo="${esc(p.id)}"><div class="v9-home-thumb"><img src="${esc(p.url)}" alt=""></div><div class="v9-home-choice-copy"><b>${esc(photoTitle(p))}</b><span>${esc(p.date||'')}</span></div><i>${p.homeHero?'✓ 첫 화면':'선택'}</i></button>`).join(''):`<div class="empty-frame v9-home-empty">${date?'이 날짜에 저장된 사진이 없어요.':'앨범의 대표사진이 아직 없어요.'}</div>`}
async function togglePhoto(id){const p=photos.find(x=>String(x.id)===String(id));if(!p)return;const next=!p.homeHero;if(next&&photos.filter(x=>x.homeHero).length>=8){Router.toast('첫 화면 사진은 최대 8장까지 고를 수 있어요');return}p.homeHero=next;renderHomeGrid();try{await DB.updatePhoto(p.id,{homeHero:next});Router.toast(next?'첫 화면 사진에 추가했어요':'첫 화면 사진에서 뺐어요')}catch(e){p.homeHero=!next;renderHomeGrid();Router.toast('저장 중 문제가 생겼어요')}}
async function uploadHomeFiles(files,date){const list=Array.from(files||[]).filter(f=>f.type.startsWith('image/'));if(!list.length)return;const status=$('#v9HomeUploadState');let done=0;for(let i=0;i<list.length;i++){if(photos.filter(x=>x.homeHero).length>=8){Router.toast('첫 화면 사진은 최대 8장까지 고를 수 있어요');break}const f=list[i];if(status)status.textContent=`사진 준비 중 ${i+1} / ${list.length}`;try{const url=await safeDataUrl(f),hero=!photos.some(x=>x.date===date&&x.hero);const id=await DB.addPhoto({date,url,hero,homeHero:true,bookPick:false,place:'',food:'',type:'',moods:[],title:'',caption:'',author:me(),originalName:f.name,dateSource:'직접 선택'});if(id)photos.push({id,date,url,hero,homeHero:true,title:'',caption:'',author:me()});done++}catch(e){console.warn('[home photo upload]',e)}}if(status)status.textContent=done?`${done}장 추가 완료 ✓`:'추가된 사진이 없어요.';renderHomeGrid();if(done)Router.toast(`${done}장을 첫 화면 사진으로 추가했어요`)}
function openHomeManager(){const panel=$('#uploadPanel');if(!panel)return;panel.innerHTML=`<div class="modal-top"><button class="icon-btn" data-action="close-modal">✕</button></div><div class="v3-album-modal-k">HOME PHOTO</div><h2 class="modal-title">첫 화면 사진</h2><p class="v9-home-intro">홈 첫 화면에 보여줄 사진을 직접 골라요. 여러 장을 고르면 차례로 바뀝니다.</p><div class="v9-home-upload"><input class="field" type="date" id="v9HomeUploadDate" value="${today()}"><label class="btn v9-home-file">＋ 새 사진 추가<input type="file" id="v9HomeFiles" accept="image/*" multiple hidden></label><span id="v9HomeUploadState"></span></div><div class="v9-home-filter"><span>앨범 사진에서 고르기</span><input class="field" type="date" id="v9HomeDateFilter"><button type="button" class="btn btn-sm btn-outline" id="v9HomeAll">대표사진 보기</button></div><div id="v9HomeGrid" class="v9-home-grid"></div><div class="v3-album-modal-actions"><button class="btn" id="v9HomeDone">완료</button></div>`;renderHomeGrid();$('#v9HomeFiles',panel).onchange=async e=>{const fs=Array.from(e.target.files||[]),date=$('#v9HomeUploadDate',panel).value||today();e.target.value='';await uploadHomeFiles(fs,date)};$('#v9HomeDateFilter',panel).onchange=renderHomeGrid;$('#v9HomeAll',panel).onclick=()=>{$('#v9HomeDateFilter',panel).value='';renderHomeGrid()};$('#v9HomeGrid',panel).onclick=e=>{const b=e.target.closest('[data-v9-home-photo]');if(b)togglePhoto(b.dataset.v9HomePhoto)};$('#v9HomeDone',panel).onclick=closeModal;$('#uploadModal').classList.add('is-open');document.body.classList.add('modal-open')}
function installHomeEntry(){const hero=$('#view-home .hero');if(!hero)return;const old=$('.v6-home-hero-manage',hero);if(old)old.style.display='none';let b=$('.v9-home-hero-manage',hero);if(!b){b=document.createElement('button');b.type='button';b.className='v9-home-hero-manage';b.textContent='✎ 첫 화면 사진';b.onclick=e=>{e.preventDefault();e.stopPropagation();openHomeManager()};hero.appendChild(b)}const add=$('.v3-hero-add',hero);if(add&&!add.dataset.v9){const n=add.cloneNode(true);n.dataset.v9='1';n.innerHTML='<span class="plus">＋</span><strong>첫 화면 사진 추가</strong><span>앨범에서 고르거나 새 사진을 올려요.</span>';n.onclick=e=>{e.preventDefault();e.stopPropagation();openHomeManager()};add.replaceWith(n)}}
function cleanCopy(){const ed=$('.v3-day-editor');if(ed){const h=$('h3',ed);if(h&&h.textContent.trim()==='Edit this day')h.textContent='OUR DAY';$$('.section-note',ed).forEach(n=>{if((n.textContent||'').includes('V1처럼 과거 날짜도 다시 열어'))n.remove()})}installHomeEntry()}
const style=document.createElement('style');style.textContent=`.v9-home-hero-manage{position:absolute;right:14px;top:14px;z-index:20;border:1px solid rgba(255,255,255,.72);background:rgba(28,23,18,.68);color:#fff;border-radius:999px;padding:9px 12px;font-family:var(--hand);font-size:10px;backdrop-filter:blur(6px);cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.18)}.v9-home-intro{margin:0 0 14px;font-size:12px;line-height:1.65;color:var(--ink-soft);word-break:keep-all}.v9-home-upload{display:grid;grid-template-columns:minmax(135px,180px) auto 1fr;gap:8px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:13px;background:#fffaf0}.v9-home-file{margin:0!important;justify-content:center}.v9-home-upload>span{font-size:10px;color:var(--ink-soft)}.v9-home-filter{display:flex;gap:8px;align-items:center;margin:15px 0 9px}.v9-home-filter>span{font-family:var(--serif);font-size:15px;margin-right:auto}.v9-home-filter .field{max-width:180px}.v9-home-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;max-height:52vh;overflow:auto;padding:2px}.v9-home-choice{position:relative;display:block;min-width:0;padding:6px;border:1px solid var(--line);border-radius:11px;background:#fffdf8;color:var(--ink);text-align:left;cursor:pointer;overflow:hidden}.v9-home-choice.is-selected{border:2px solid var(--red);padding:5px;box-shadow:0 0 0 3px rgba(165,55,44,.08)}.v9-home-thumb{aspect-ratio:1;overflow:hidden;border-radius:7px;background:#ebe1d0}.v9-home-thumb img{display:block;width:100%;height:100%;object-fit:cover}.v9-home-choice-copy{padding:7px 3px 3px}.v9-home-choice-copy b{display:block;font-family:var(--serif);font-size:12px;line-height:1.25;font-weight:500;word-break:keep-all}.v9-home-choice-copy span{display:block;margin-top:3px;font-size:8px;color:var(--kraft)}.v9-home-choice>i{position:absolute;right:10px;top:10px;background:rgba(255,253,248,.92);border-radius:999px;padding:4px 6px;font-style:normal;font-size:8px;color:var(--red);box-shadow:0 2px 7px rgba(0,0,0,.12)}.v9-home-empty{grid-column:1/-1}.v3-day-editor>.section-note:first-of-type{word-break:keep-all}@media(max-width:700px){.v9-home-hero-manage{right:9px;top:9px;min-height:42px;padding:9px 11px}.v9-home-upload{grid-template-columns:1fr}.v9-home-upload .field{width:100%}.v9-home-filter{display:grid;grid-template-columns:1fr auto}.v9-home-filter>span{grid-column:1/-1}.v9-home-filter .field{max-width:none;width:100%}.v9-home-grid{grid-template-columns:repeat(2,minmax(0,1fr));max-height:48vh}.v9-home-choice{min-height:0!important}.v9-home-choice-copy b{font-size:11px}}@media(max-width:360px){.v9-home-grid{grid-template-columns:1fr 1fr;gap:6px}.v9-home-choice-copy b{font-size:10px}}`;document.head.appendChild(style);
let queued=false;function run(){queued=false;cleanCopy()}new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true});run();
})();
