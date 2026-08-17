/* 300 Days With You — Our Days curation: day titles, representative Kakao, calendar focal point, home hero */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rawDb=()=>{try{return window.firebase&&firebase.firestore?firebase.firestore():null}catch(e){return null}};
const me=()=>{try{return Identity.displayName(Identity.current())}catch(e){return ''}};

/* Latest uploaded Kakao patch wins only for its exact dates. Older archive stays untouched. */
function patchRows(date){return (window.V3_LATEST_CHAT_PATCH&&window.V3_LATEST_CHAT_PATCH[date])||null}
if(window.FullChat&&!FullChat.__v6patched){
  FullChat.__v6patched=true;
  const oldLoad=FullChat.load.bind(FullChat),oldFor=FullChat.messagesForDate.bind(FullChat),oldAll=FullChat.allMessages.bind(FullChat);
  FullChat.load=async()=>{const d=await oldLoad();if(window.FULL_CHAT_DATA&&window.V3_LATEST_CHAT_PATCH)Object.entries(window.V3_LATEST_CHAT_PATCH).forEach(([k,v])=>{if(Array.isArray(v)&&v.length)window.FULL_CHAT_DATA[k]=v});return window.FULL_CHAT_DATA||d||{}};
  FullChat.messagesForDate=date=>{const p=patchRows(date);return p&&p.length?p.map(m=>({date,speaker:m.s,text:m.t,ap:m.ap,h:m.h,m:m.m})):oldFor(date)};
  FullChat.allMessages=()=>{const rows=oldAll(),patch=window.V3_LATEST_CHAT_PATCH||{},replaced=new Set(Object.keys(patch).filter(k=>patch[k]&&patch[k].length)),out=rows.filter(r=>!replaced.has(r.date));Object.entries(patch).forEach(([date,list])=>(list||[]).forEach(m=>out.push({date,speaker:m.s,text:m.t,ap:m.ap,h:m.h,m:m.m})));return out};
}

/* Additive date-level metadata store. */
if(window.DB&&!DB.setDayMeta){
  DB.setDayMeta=async(date,data)=>{const db=rawDb();if(!db)return;await db.collection('day_meta').doc(date).set({date,...data,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})};
  DB.onDayMeta=(date,cb)=>{const db=rawDb();if(!db)return()=>{};return db.collection('day_meta').doc(date).onSnapshot(s=>cb(s.exists?s.data():null),e=>console.warn('[day_meta]',e))};
  DB.onAllDayMeta=cb=>{const db=rawDb();if(!db)return()=>{};return db.collection('day_meta').onSnapshot(s=>{const out=[];s.forEach(d=>out.push({id:d.id,...d.data()}));cb(out)},e=>console.warn('[day_meta all]',e))};
}

let photos=[], dayMeta={};
if(window.DB&&DB.onAllPhotos)DB.onAllPhotos(rows=>{photos=rows||[];queueEnhance()});
if(window.DB&&DB.onAllDayMeta)DB.onAllDayMeta(rows=>{dayMeta={};(rows||[]).forEach(r=>dayMeta[r.date||r.id]=r);queueEnhance()});
const photoFor=date=>photos.find(p=>p.date===date&&p.hero)||photos.find(p=>p.date===date)||null;

const CATS={
  '달달':['사랑해','사랑하','여보','자기','좋아해','좋아하','평생','결혼','뽀뽀','안아','귀여워','귀엽','보고싶'],
  '설렘':['데이트','만나','같이 가','같이 놀','기대','처음','보고싶','놀자','가자'],
  '위로':['괜찮아','들어줄게','걱정마','울지마','울지마','속상','힘들','곁에','미안해','다행'],
  '응원':['화이팅','힘내','응원','잘할','멋지','축하','고생했','잘하고','잘 보고','잘보고'],
  '웃김':['ㅋㅋㅋㅋ','개웃','웃기','킹받','드립','놀려','레전드','푸하하','크하하'],
  '서운함':['서운','속상','왜 안','왜 톡','왜 카톡','말뿐','피곤해','무시','싫어','미안'],
  '슬픔':['슬퍼','슬프','울었','눈물','아쉽','ㅠㅠ','🥲','보고싶다'],
  '보고싶음':['보고싶','그립','빨리 보고','언제 봐','만나고 싶']
};
const SYSTEM=/^(사진(?: \d+장)?|동영상|이모티콘|파일:|카카오톡 프로필)$/;
function cleanMessages(date){
  let rows=[];try{rows=FullChat.messagesForDate(date)||[]}catch(_e){}
  return rows.map((m,i)=>({...m,_i:i})).filter(m=>m.text&&!SYSTEM.test(String(m.text).trim())&&!/^https?:\/\//.test(String(m.text).trim())&&!/^\[(네이버지도|지도)\]/.test(String(m.text).trim())&&!/원을 (보냈어요|받았어요)/.test(m.text));
}
function scoreText(text,cat){let score=0;const s=String(text||'');(CATS[cat]||[]).forEach(k=>{if(s.includes(k))score+=k.length>3?4:3});if(s.length>=8&&s.length<=90)score+=1;if(/사랑|평생|보고싶|고마워|미안|괜찮|ㅋㅋㅋㅋ/.test(s))score+=1;return score}
function autoRepresentative(date){
  const rows=cleanMessages(date);if(!rows.length)return{category:'일상',rows:[]};
  let best={score:-1,category:'일상',idx:0};
  Object.keys(CATS).forEach(cat=>rows.forEach((m,i)=>{const s=scoreText(m.text,cat);if(s>best.score)best={score:s,category:cat,idx:i}}));
  if(best.score<=1){best.category='일상';best.idx=Math.min(rows.length-1,Math.floor(rows.length*.55))}
  let start=Math.max(0,best.idx-1),end=Math.min(rows.length,start+4);if(end-start<2)start=Math.max(0,end-2);
  const chosen=rows.slice(start,end).map(m=>({speaker:m.speaker||m.s,text:m.text,index:m._i}));
  return{category:best.category,rows:chosen};
}
function representative(date){const m=dayMeta[date]||{};if(Array.isArray(m.repChat)&&m.repChat.length)return{category:m.repChatCategory||'우리의 말',rows:m.repChat};return autoRepresentative(date)}

function dateFromCell(cell){
  if(cell.dataset.date)return cell.dataset.date;if(cell.dataset.v6Date)return cell.dataset.v6Date;
  const n=Number($('.cal-num',cell)?.textContent);if(!n)return'';
  const label=$('#view-ourdays .cal-header h2, #view-ourdays #calMonthLabel, #view-ourdays .cal-month-title')?.textContent||'';
  const en={January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};
  let y,m,hit=label.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i);if(hit){m=en[hit[1][0].toUpperCase()+hit[1].slice(1).toLowerCase()];y=+hit[2]}
  if(!y){hit=label.match(/(20\d{2}).*?(\d{1,2})/);if(hit){y=+hit[1];m=+hit[2]}}
  if(!y||!m)return'';return`${y}-${String(m).padStart(2,'0')}-${String(n).padStart(2,'0')}`;
}

function decorateCalendar(){
  const view=$('#view-ourdays');if(!view||!view.classList.contains('is-active'))return;
  $$('.cal-cell',view).forEach(cell=>{
    const date=dateFromCell(cell);if(!date)return;cell.dataset.v6Date=date;
    const meta=dayMeta[date]||{},p=photoFor(date),ev=(window.EVENTS||{})[date]||{};
    if(meta.title){let t=$('.cal-title',cell);if(!t){t=document.createElement('div');t.className='cal-title';cell.appendChild(t)}t.textContent=meta.title}
    if((ev.title||meta.title||p||cleanMessages(date).length)&&!cell.dataset.action){cell.dataset.action='memory';cell.dataset.date=date}
    if(!$('.v6-day-edit-icon',cell)){const e=document.createElement('span');e.className='v6-day-edit-icon';e.dataset.v6EditDay=date;e.textContent='✎';e.title='이 날 제목·대표카톡 수정';cell.appendChild(e)}
    if(p){cell.classList.add('has-photo');cell.style.backgroundImage=`url("${String(p.url||'').replace(/"/g,'&quot;')}")`;cell.style.backgroundPosition=`${p.focusX==null?50:p.focusX}% ${p.focusY==null?50:p.focusY}%`;
      if(!$('.v6-calendar-photo-hit',cell)){const h=document.createElement('span');h.className='v6-calendar-photo-hit';h.dataset.v6EditPhoto=p.id;h.title='사진 설명·대표사진 위치 수정';h.innerHTML='<i>▣</i><b>사진 수정</b>';cell.appendChild(h)}else{$('.v6-calendar-photo-hit',cell).dataset.v6EditPhoto=p.id}
    }
  });
}

async function openDayEditor(date){
  const panel=$('#uploadPanel');if(!panel)return;await FullChat.load();const current=dayMeta[date]||{},auto=autoRepresentative(date),saved=representative(date),rows=cleanMessages(date);
  const scored=rows.map(r=>({r,s:Math.max(...Object.keys(CATS).map(c=>scoreText(r.text,c)))})).sort((a,b)=>b.s-a.s||a.r._i-b.r._i).slice(0,28).map(x=>x.r);
  const savedIdx=new Set((current.repChat||[]).map(x=>Number(x.index)));
  panel.innerHTML=`<div class="modal-top"><button class="icon-btn" data-action="close-modal">✕</button></div><div class="v3-album-modal-k">OUR DAY · ${esc(date)}</div><h2 class="modal-title">이 날을 우리가 직접 정리하기</h2><label class="section-note v3-album-field-label">달력 대표 제목</label><input class="field" id="v6DayTitle" value="${esc(current.title||'')}" placeholder="${esc((window.EVENTS||{})[date]?.title||'예: 처음 같이 모마 간 날')}"><div class="v6-day-editor-note">비워두면 기존 제목을 사용해요.</div><div class="v6-rep-editor-head"><div><b>대표 카톡</b><span>실제 카톡 원문에서 자동 추천했어요. 직접 바꿀 수도 있어요.</span></div><select class="field" id="v6RepCat">${[...Object.keys(CATS),'일상'].map(c=>`<option ${c===(current.repChatCategory||auto.category)?'selected':''}>${c}</option>`).join('')}</select></div><div class="v6-auto-preview"><span>AUTO · ${esc(auto.category)}</span>${auto.rows.map(x=>`<p><b>${esc(x.speaker)}</b> ${esc(x.text)}</p>`).join('')}</div><div class="v6-chat-pick-list">${scored.map(r=>`<label><input type="checkbox" data-v6-chat-idx="${r._i}" ${savedIdx.has(r._i)?'checked':''}><span><b>${esc(r.speaker)}</b>${esc(r.text)}</span></label>`).join('')}</div><div class="v3-album-modal-actions"><button class="btn" id="v6DaySave">저장</button><button class="btn btn-outline" id="v6UseAuto">자동 추천으로 저장</button></div>`;
  $('#v6UseAuto',panel).onclick=async()=>{await DB.setDayMeta(date,{title:$('#v6DayTitle',panel).value.trim(),repChatCategory:auto.category,repChat:auto.rows,updatedBy:me()});Router.toast('자동 추천 대표카톡으로 저장했어요');closeUpload()};
  $('#v6DaySave',panel).onclick=async()=>{const selected=$$('[data-v6-chat-idx]:checked',panel).slice(0,4).map(x=>{const r=rows.find(m=>m._i===Number(x.dataset.v6ChatIdx));return r?{speaker:r.speaker,text:r.text,index:r._i}:null}).filter(Boolean);await DB.setDayMeta(date,{title:$('#v6DayTitle',panel).value.trim(),repChatCategory:$('#v6RepCat',panel).value,repChat:selected.length?selected:auto.rows,updatedBy:me()});Router.toast('이 날의 제목과 대표카톡을 저장했어요');closeUpload()};
  $('#uploadModal').classList.add('is-open');document.body.classList.add('modal-open')
}
function closeUpload(){$('#uploadModal')?.classList.remove('is-open');document.body.classList.remove('modal-open')}

function injectPhotoEditor(){
  const panel=$('#uploadPanel'),img=$('#v3MetaPreview img',panel);if(!panel||!img||$('#v6FocusEditor',panel))return;const p=photos.find(x=>String(x.url||'')===String(img.src||''));if(!p)return;
  let fx=p.focusX==null?50:Number(p.focusX),fy=p.focusY==null?50:Number(p.focusY);
  const box=document.createElement('section');box.id='v6FocusEditor';box.className='v6-focus-editor';box.innerHTML=`<div class="v6-focus-head"><div><b>달력 정사각형 위치</b><span>원본은 그대로 두고 달력에서 보이는 위치만 정해요.</span></div><button type="button" class="btn btn-sm btn-outline" id="v6FocusReset">가운데</button></div><div class="v6-focus-preview" id="v6FocusPreview"><img src="${esc(p.url)}" alt=""><i></i><span>여기를 중심으로 표시</span></div><div class="v6-focus-sliders"><label>좌우 <input type="range" min="0" max="100" value="${fx}" id="v6FocusX"></label><label>상하 <input type="range" min="0" max="100" value="${fy}" id="v6FocusY"></label></div><div class="v6-photo-extra-actions"><button type="button" class="btn btn-sm btn-outline" id="v6HomeHero">${p.homeHero?'⌂ 홈 대표사진에서 빼기':'⌂ 홈 대표사진에 추가'}</button><button type="button" class="btn btn-sm btn-outline" id="v6FocusSave">달력 위치 저장</button></div>`;
  const actions=$('.v3-album-modal-actions',panel);actions?actions.before(box):panel.appendChild(box);
  const preview=$('#v6FocusPreview',box),x=$('#v6FocusX',box),y=$('#v6FocusY',box);function draw(){fx=Number(x.value);fy=Number(y.value);$('img',preview).style.objectPosition=`${fx}% ${fy}%`;$('i',preview).style.left=`${fx}%`;$('i',preview).style.top=`${fy}%`}
  x.oninput=y.oninput=draw;$('#v6FocusReset',box).onclick=()=>{x.value=y.value=50;draw()};
  preview.addEventListener('pointerdown',e=>{const r=preview.getBoundingClientRect();x.value=clamp(Math.round((e.clientX-r.left)/r.width*100),0,100);y.value=clamp(Math.round((e.clientY-r.top)/r.height*100),0,100);draw()});
  $('#v6FocusSave',box).onclick=async()=>{await DB.updatePhoto(p.id,{focusX:fx,focusY:fy});Router.toast('달력 사진 위치를 저장했어요')};
  $('#v6HomeHero',box).onclick=async e=>{await DB.updatePhoto(p.id,{homeHero:!p.homeHero});Router.toast(p.homeHero?'홈 대표사진에서 뺐어요':'홈 대표사진에 추가했어요');e.currentTarget.textContent=p.homeHero?'⌂ 홈 대표사진에 추가':'⌂ 홈 대표사진에서 빼기'};draw();
}

function cleanAlbumCards(){
  $$('.v3-photo-imagebtn').forEach(old=>{if(old.dataset.v6Clean==='1')return;const div=document.createElement('div');div.className=old.className+' v6-clean-photo-hit';div.dataset.v6Clean='1';Object.keys(old.dataset).forEach(k=>div.dataset[k]=old.dataset[k]);div.setAttribute('role','button');div.tabIndex=0;div.innerHTML=old.innerHTML;old.replaceWith(div)});
}

let homeTimer=null;
function paintHomeHeroes(){
  const view=$('#view-home');if(!view||!view.classList.contains('is-active'))return;const hero=$('.hero',view),wrap=$('#heroPhotoWrap',view);if(!hero||!wrap)return;
  if(!$('.v6-home-hero-manage',hero)){const b=document.createElement('button');b.className='v6-home-hero-manage';b.type='button';b.innerHTML='✎ <span>홈 대표사진 관리</span>';hero.appendChild(b)}
  const selected=photos.filter(p=>p.homeHero);if(!selected.length)return;
  const signature=selected.map(p=>p.id).join('|');if(wrap.dataset.v6HomeSig===signature)return;wrap.dataset.v6HomeSig=signature;clearInterval(homeTimer);wrap.innerHTML=selected.slice(0,8).map((p,i)=>`<img src="${esc(p.url)}" alt="" class="${i?'':'is-active'}" style="object-position:${p.homeFocusX??50}% ${p.homeFocusY??50}%">`).join('');let i=0;if(selected.length>1)homeTimer=setInterval(()=>{const imgs=$$('img',wrap);i=(i+1)%imgs.length;imgs.forEach((im,j)=>im.classList.toggle('is-active',j===i))},4200)
}
function goHomeHeroManager(){Router.openView('album');setTimeout(()=>{Router.toast('사진의 ✎ 버튼 → “홈 대표사진에 추가”를 누르면 돼요');const first=$('#view-album .v3-photo-edit');if(first)first.classList.add('v6-pulse-edit')},250)}

async function enhanceMemory(){
  const modal=$('#memoryModal');if(!modal?.classList.contains('is-open'))return;const hit=location.hash.match(/^#\/memory\/([\d-]+)/);if(!hit)return;const date=hit[1],panel=$('#memoryPanel');if(!panel)return;
  const meta=dayMeta[date]||{},title=$('.modal-title',panel);if(title&&meta.title)title.childNodes.length?title.childNodes[0].nodeValue=meta.title:title.textContent=meta.title;
  if(title&&!$('.v6-memory-title-edit',panel)){const e=document.createElement('button');e.className='v6-memory-title-edit';e.type='button';e.dataset.v6EditDay=date;e.textContent='✎';e.title='제목·대표카톡 수정';title.appendChild(e)}
  let rep=$('#v6RepresentativeKakao',panel);if(!rep){rep=document.createElement('section');rep.id='v6RepresentativeKakao';rep.className='v6-representative-kakao';const anchor=$('#kakaoBlock',panel)||$('.section-head',panel);anchor?anchor.before(rep):panel.appendChild(rep)}
  rep.innerHTML='<div class="section-note">대표카톡을 고르는 중…</div>';await FullChat.load();if(!document.body.contains(rep))return;const r=representative(date);rep.innerHTML=`<div class="v6-rep-head"><div><span>TODAY'S KAKAO</span><b>${esc(r.category)}</b></div><button type="button" data-v6-edit-day="${esc(date)}">✎ 대표카톡 수정</button></div>${r.rows.length?`<div class="v6-rep-bubbles">${r.rows.map(x=>`<div class="v6-rep-msg ${String(x.speaker).includes('시현')?'sihyun':'gangwon'}"><small>${esc(x.speaker)}</small><p>${esc(x.text)}</p></div>`).join('')}</div>`:'<div class="empty-frame">이 날은 아직 대표카톡이 없어요.</div>'}`;
}

/* capture actions before Router's delegated click */
document.addEventListener('click',e=>{
  const day=e.target.closest('[data-v6-edit-day]');if(day){e.preventDefault();e.stopImmediatePropagation();openDayEditor(day.dataset.v6EditDay);return}
  const pe=e.target.closest('[data-v6-edit-photo]');if(pe){e.preventDefault();e.stopImmediatePropagation();const p=photos.find(x=>String(x.id)===String(pe.dataset.v6EditPhoto));if(p&&window.AlbumView)AlbumView.openMetaEditor(p);return}
  const clean=e.target.closest('.v6-clean-photo-hit[data-v3-open-photo]');if(clean){e.preventDefault();e.stopImmediatePropagation();const p=photos.find(x=>String(x.id)===String(clean.dataset.v3OpenPhoto));if(p&&window.AlbumView)AlbumView.openLightbox(p.url,p.caption||'',{date:p.date,title:p.title||((window.EVENTS||{})[p.date]?.title||'')});return}
  const memPhoto=e.target.closest('#memPhotoGallery img');if(memPhoto){const p=photos.find(x=>String(x.url||'')===String(memPhoto.src||''));if(p){e.preventDefault();e.stopImmediatePropagation();AlbumView.openMetaEditor(p);return}}
  if(e.target.closest('.v6-home-hero-manage')){e.preventDefault();e.stopImmediatePropagation();goHomeHeroManager();return}
},true);

function queueEnhance(){requestAnimationFrame(()=>{decorateCalendar();cleanAlbumCards();injectPhotoEditor();paintHomeHeroes();enhanceMemory().catch(()=>{})})}
let queued=false;const mo=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;queueEnhance()})});mo.observe(document.body,{childList:true,subtree:true});
window.addEventListener('hashchange',queueEnhance);queueEnhance();
})();
