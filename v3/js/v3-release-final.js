/* 300 Days With You — V3 production consolidation */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pad=n=>String(n).padStart(2,'0');
const me=()=>{try{return Identity.displayName(Identity.current())}catch(_e){return''}};
const localToday=()=>typeof todayISO==='function'?todayISO():(()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`})();
let photos=[],dayMeta={};
let homeTimer=null;
let kakaoToken=0;
if(window.DB&&DB.onAllPhotos)DB.onAllPhotos(rows=>{photos=rows||[];schedule()});
if(window.DB&&DB.onAllDayMeta)DB.onAllDayMeta(rows=>{dayMeta={};(rows||[]).forEach(r=>dayMeta[r.date||r.id]=r);schedule()});

function photoFor(date){return photos.find(p=>p.date===date&&p.hero)||photos.find(p=>p.date===date)||null}
function photoTitle(p){return p?.title||p?.caption||((window.EVENTS||{})[p?.date]?.title)||p?.date||'우리 사진'}
function focus(p){return {x:Number.isFinite(Number(p?.focusX))?Number(p.focusX):50,y:Number.isFinite(Number(p?.focusY))?Number(p.focusY):50,z:Number.isFinite(Number(p?.focusZoom))?clamp(Number(p.focusZoom),1,2.5):1}}

/* ---------- shipped copy: no version/implementation notes ---------- */
function cleanCopy(){
  $$('.v3-home-stamp').forEach(n=>n.remove());
  $$('.v3-day-editor .section-note').forEach(n=>{if(/V1처럼 과거 날짜도|기록자는\s*(시현|강원)/.test(n.textContent||''))n.remove()});
  const editHead=$('.v3-day-editor h3'); if(editHead&&/Edit this day/i.test(editHead.textContent||'')) editHead.textContent='OUR DAY';
  const future=$('#view-future .v1-future-head p'); if(future&&/비슷한 기능은 합치고/.test(future.textContent||'')) future.textContent='앞으로 함께 하고 싶은 일, 지키고 싶은 약속, 미래의 우리에게 남기는 편지.';
  const albumK=$('#view-album .v3-album-k'); if(albumK&&/V1|V2|COMPLETE/i.test(albumK.textContent||'')) albumK.textContent='OUR PHOTO ARCHIVE';
  const albumHeroText=$('#view-album .v3-album-hero p'); if(albumHeroText&&/원본 사진은 그대로/.test(albumHeroText.textContent||'')) albumHeroText.textContent='우리 사진을 날짜와 장소, 기억으로 모아보는 앨범.';
  const sync=$('#v3KakaoPreview');
  if(sync&&/저장이 완료되지 않았어요/.test(sync.textContent||'')&&/이 기기 카톡\s*✓/.test(sync.textContent||'')) sync.innerHTML='<b>이 기기에는 최신 카톡이 저장됐어요 ✓</b><br>공유 통계는 연결되면 자동으로 다시 맞춰집니다.';
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n;
  const repl=[
    ['V3 · V2 engine, V1 memories restored',''],
    ['V1 + V2 · COMPLETE PHOTO ARCHIVE','OUR PHOTO ARCHIVE'],
    ['V1 · OUR SMALL PROMISES','OUR SMALL PROMISES'],
    ['V2 QUICK NAVIGATION','QUICK NAVIGATION'],
    ['V2 · PHOTOBOOK CURATION','PHOTOBOOK CURATION'],
    ['FILM STRIP · V1','FILM STRIP'],
    ['FILM VIEWER · V2','FILM VIEWER'],
    ['비슷한 기능은 합치고, 앞으로 할 일 · 약속 · 미래 편지만 남겼어요.','앞으로 함께 하고 싶은 일, 지키고 싶은 약속, 미래의 우리에게 남기는 편지.']
  ];
  while((n=walker.nextNode())){let t=n.nodeValue||'',u=t;repl.forEach(([a,b])=>{u=u.split(a).join(b)});if(u!==t)n.nodeValue=u}
}

/* ---------- Album: keep only useful views, clear photo surfaces, friendly naming ---------- */
function polishAlbum(){
  const view=$('#view-album'); if(!view)return;
  const toolbar=$('#v3AlbumToolbar',view);
  if(toolbar){
    const keep=new Set(['day','monthly','places','hero','bookpicks','photobooth']);
    $$('[data-v3-album-mode]',toolbar).forEach(b=>{
      const m=b.dataset.v3AlbumMode; b.style.display=keep.has(m)?'':'none';
      if(m==='hero')b.textContent='★ 대표사진';
      if(m==='bookpicks')b.textContent='포토북 후보';
      if(m==='photobooth')b.textContent='네컷';
    });
  }
  $$('.v3-photo-card',view).forEach(card=>{
    const p=photos.find(x=>String(x.id)===String(card.dataset.photoCard)); if(!p)return;
    const old=card.querySelector('.v6-clean-photo-hit,.v3-photo-imagebtn');
    let surf=card.querySelector('.v10-photo-surface');
    if(!surf){
      surf=document.createElement('button');surf.type='button';surf.className='v10-photo-surface';surf.dataset.v10Photo=String(p.id);surf.innerHTML='<img alt="">';
      if(old)old.insertAdjacentElement('beforebegin',surf); else card.prepend(surf);
    }
    surf.dataset.v10Photo=String(p.id);const im=$('img',surf),f=focus(p);im.src=p.url;im.style.objectPosition=`${f.x}% ${f.y}%`;im.style.transform=`scale(${f.z})`;im.style.transformOrigin=`${f.x}% ${f.y}%`;
    if(old)old.style.display='none';
    const title=$('.v3-photo-title',card);if(title){title.textContent=photoTitle(p);title.style.display=''}
    $$('.v3-photo-flag.hero',card).forEach(x=>{if(x.textContent!=='대표')x.textContent='대표'});
    $$('.v3-photo-flag.book',card).forEach(x=>{if(x.textContent!=='포토북 후보')x.textContent='포토북 후보'});
  });
  const heroEmpty=$('#v3AlbumHost .empty-frame',view);if(heroEmpty&&/HERO/.test(heroEmpty.textContent||''))heroEmpty.textContent='아직 대표사진으로 지정한 사진이 없어요. 사진의 ✎ 버튼에서 지정할 수 있어요.';
  const bookHead=$('#v3AlbumHost .v3-feature-intro h3',view);if(bookHead&&/BOOK PICKS/i.test(bookHead.textContent||'')&&bookHead.textContent!=='포토북 후보')bookHead.textContent='포토북 후보';
  const bookDesc=$('#v3AlbumHost .v3-feature-intro p',view);if(bookDesc&&/포토북/.test(bookDesc.textContent||'')&&bookDesc.textContent!=='나중에 인쇄 포토북에 넣고 싶은 사진만 따로 모아두는 곳.')bookDesc.textContent='나중에 인쇄 포토북에 넣고 싶은 사진만 따로 모아두는 곳.';
}

document.addEventListener('click',e=>{
  const surf=e.target.closest?.('[data-v10-photo]'); if(surf){
    e.preventDefault();e.stopImmediatePropagation();const p=photos.find(x=>String(x.id)===String(surf.dataset.v10Photo));if(p&&window.AlbumView)AlbumView.openLightbox(p.url,p.caption||'',{date:p.date,title:photoTitle(p)});return;
  }
},true);

/* ---------- Photo metadata editor: title, representative, photobook pick, calendar square crop ---------- */
function enhancePhotoEditor(){
  const panel=$('#uploadPanel'); if(!panel||!panel.closest('#uploadModal.is-open'))return;
  const img=$('.v3-meta-preview img',panel); if(!img)return;
  const p=photos.find(x=>String(x.url||'')===String(img.src||'')); if(!p)return;
  const titleInput=$('#v3MetaTitle',panel); if(titleInput){const lab=titleInput.previousElementSibling;if(lab&&lab.classList.contains('v3-album-field-label'))lab.textContent='사진 제목'}
  const heroBtn=$('#v3MetaHero',panel); if(heroBtn)heroBtn.textContent=p.hero?'★ 대표사진 · 현재':'★ 대표사진으로 설정';
  const bookBtn=$('#v3MetaBook',panel); if(bookBtn){bookBtn.textContent=p.bookPick?'포토북 후보 해제':'포토북 후보로 저장';bookBtn.title='나중에 인쇄 포토북에 넣고 싶은 사진으로 표시'}
  $('#v6FocusEditor',panel)?.remove();
  if($('#v10FocusEditor',panel))return;
  let f=focus(p);
  const box=document.createElement('section');box.id='v10FocusEditor';box.className='v10-focus-editor';
  box.innerHTML=`<div class="v10-focus-head"><div><b>달력 대표사진 프레임</b><span>카톡 프로필 사진처럼, 네모 칸 안에서 사진을 직접 끌어서 위치를 맞춰요. 원본 사진은 바뀌지 않아요.</span></div><button type="button" class="btn btn-sm btn-outline" id="v10FocusReset">초기화</button></div><div class="v10-focus-preview" id="v10FocusPreview"><img src="${esc(p.url)}" alt="" draggable="false"></div><label class="v10-focus-zoom"><span>확대</span><input type="range" min="100" max="250" step="5" value="${Math.round(f.z*100)}" id="v10FocusZ"></label><div class="v10-focus-actions"><button type="button" class="btn btn-sm btn-outline" id="v10HomeHero">${p.homeHero?'첫 화면 사진에서 빼기':'첫 화면 사진에 추가'}</button><button type="button" class="btn btn-sm" id="v10FocusSave">달력 프레임 저장</button></div>`;
  const actions=$('.v3-album-modal-actions',panel);actions?actions.before(box):panel.appendChild(box);
  const z=$('#v10FocusZ',box),prev=$('#v10FocusPreview',box),pim=$('img',prev);
  const draw=()=>{pim.style.objectPosition=`${f.x}% ${f.y}%`;pim.style.transform=`scale(${f.z})`;pim.style.transformOrigin=`${f.x}% ${f.y}%`};
  z.oninput=()=>{f={...f,z:Number(z.value)/100};draw()};
  let dragging=false,startX=0,startY=0,startFx=50,startFy=50,moved=false,pid=null;
  prev.addEventListener('pointerdown',e=>{
    dragging=true;moved=false;pid=e.pointerId;startX=e.clientX;startY=e.clientY;startFx=f.x;startFy=f.y;
    prev.classList.add('is-dragging');try{prev.setPointerCapture(pid)}catch(_e){}
  });
  prev.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const r=prev.getBoundingClientRect();
    const dxPct=(e.clientX-startX)/r.width*100,dyPct=(e.clientY-startY)/r.height*100;
    if(Math.abs(dxPct)>.4||Math.abs(dyPct)>.4)moved=true;
    f={...f,x:clamp(startFx-dxPct/f.z,0,100),y:clamp(startFy-dyPct/f.z,0,100)};
    draw();
  });
  const endDrag=()=>{if(!dragging)return;dragging=false;prev.classList.remove('is-dragging');try{pid!=null&&prev.releasePointerCapture(pid)}catch(_e){}};
  prev.addEventListener('pointerup',endDrag);prev.addEventListener('pointercancel',endDrag);prev.addEventListener('lostpointercapture',endDrag);
  $('#v10FocusReset',box).onclick=()=>{f={x:50,y:50,z:1};z.value=100;draw()};
  $('#v10FocusSave',box).onclick=async()=>{await DB.updatePhoto(p.id,{focusX:f.x,focusY:f.y,focusZoom:f.z});Router.toast('달력 대표사진 프레임을 저장했어요')};
  $('#v10HomeHero',box).onclick=async e=>{const next=!p.homeHero;await DB.updatePhoto(p.id,{homeHero:next});p.homeHero=next;e.currentTarget.textContent=next?'첫 화면 사진에서 빼기':'첫 화면 사진에 추가';Router.toast(next?'첫 화면 사진에 추가했어요':'첫 화면 사진에서 뺐어요');paintHome()};
  draw();
}

/* ---------- Home representative photos: explicit shared selection ---------- */
function selectedHome(){return photos.filter(p=>p.homeHero).sort((a,b)=>(a.date||'').localeCompare(b.date||'')).slice(0,8)}
function paintHome(){
  const view=$('#view-home');if(!view||!view.classList.contains('is-active'))return;
  const hero=$('.hero',view),wrap=$('#heroPhotoWrap',view);if(!hero||!wrap)return;
  $$('.v6-home-hero-manage,.v9-home-hero-manage',hero).forEach(b=>b.style.display='none');
  let manage=$('#v10HomeManage',hero);if(!manage){manage=document.createElement('button');manage.id='v10HomeManage';manage.type='button';manage.className='v10-home-manage';manage.textContent='✎ 첫 화면 사진';manage.onclick=e=>{e.preventDefault();e.stopPropagation();openHomeManager()};hero.appendChild(manage)}
  const list=selectedHome();clearInterval(homeTimer);
  if(!list.length){wrap.innerHTML='<button type="button" class="v10-home-empty" id="v10HomeEmpty"><span>＋</span><b>첫 화면 사진 추가</b><small>앨범 사진에서 고르거나 새 사진을 올려요.</small></button>';$('#v10HomeEmpty',wrap).onclick=e=>{e.preventDefault();e.stopPropagation();openHomeManager()};return}
  const sig=list.map(p=>`${p.id}:${p.url}:${p.focusX}:${p.focusY}:${p.focusZoom}`).join('|');
  if(!$('.v10-home-stage',wrap)||wrap.dataset.v10Sig!==sig){
    wrap.dataset.v10Sig=sig;wrap.innerHTML=`<div class="v10-home-stage">${list.map((p,i)=>{const f=focus(p);return `<div class="v10-home-slide ${i?'':'is-active'}"><img src="${esc(p.url)}" alt="" style="object-position:${f.x}% ${f.y}%;transform:scale(${f.z});transform-origin:${f.x}% ${f.y}%"></div>`}).join('')}${list.length>1?`<div class="v10-home-dots">${list.map((_,i)=>`<i class="${i?'':'is-active'}"></i>`).join('')}</div>`:''}</div>`;
  }
  if(list.length>1){let i=0;homeTimer=setInterval(()=>{const st=$('.v10-home-stage',wrap);if(!st){clearInterval(homeTimer);return}const slides=$$('.v10-home-slide',st),dots=$$('.v10-home-dots i',st);i=(i+1)%slides.length;slides.forEach((im,j)=>im.classList.toggle('is-active',j===i));dots.forEach((d,j)=>d.classList.toggle('is-active',j===i))},4200)}
}
function imageData(file,max=1500,q=.82){return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onerror=reject;fr.onload=()=>{const im=new Image();im.onerror=reject;im.onload=()=>{let w=im.naturalWidth,h=im.naturalHeight;if(Math.max(w,h)>max){const s=max/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s)}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);let quality=q,u=c.toDataURL('image/jpeg',quality);while(u.length>450000&&quality>.46){quality-=.08;u=c.toDataURL('image/jpeg',quality)}resolve(u)};im.src=fr.result};fr.readAsDataURL(file)})}
function openHomeManager(){
  const panel=$('#uploadPanel');if(!panel)return;
  const sorted=()=>[...photos].sort((a,b)=>(Number(!!b.homeHero)-Number(!!a.homeHero))||((b.date||'').localeCompare(a.date||'')));
  panel.innerHTML=`<div class="modal-top"><button class="icon-btn" data-action="close-modal">✕</button></div><div class="v3-album-modal-k">HOME PHOTO</div><h2 class="modal-title">첫 화면 사진</h2><p class="v10-home-help">홈 첫 화면에 사용할 사진을 직접 선택해요. 최대 8장까지 고를 수 있고, 선택은 같은 링크에서 공유됩니다.</p><div class="v10-home-upload"><input class="field" type="date" id="v10HomeDate" value="${localToday()}"><label class="btn">＋ 새 사진<input type="file" id="v10HomeFile" accept="image/*" multiple hidden></label><span id="v10HomeStatus"></span></div><div class="v10-home-filter"><input class="field" type="date" id="v10HomeFilter"><button class="btn btn-sm btn-outline" type="button" id="v10HomeAll">전체 보기</button></div><div id="v10HomeGrid" class="v10-home-grid"></div><div class="v3-album-modal-actions"><button class="btn" id="v10HomeDone">완료</button></div>`;
  const grid=$('#v10HomeGrid',panel),status=$('#v10HomeStatus',panel);
  function draw(){const d=$('#v10HomeFilter',panel).value;const list=(d?sorted().filter(p=>p.date===d):sorted());grid.innerHTML=list.length?list.map(p=>`<button type="button" class="v10-home-choice ${p.homeHero?'is-selected':''}" data-v10-home-choice="${esc(p.id)}"><div><img src="${esc(p.url)}" alt=""></div><b>${esc(photoTitle(p))}</b><span>${esc(p.date||'')}</span><i>${p.homeHero?'✓ 사용 중':'선택'}</i></button>`).join(''):'<div class="empty-frame">이 조건의 사진이 없어요.</div>'}
  grid.onclick=async e=>{const b=e.target.closest('[data-v10-home-choice]');if(!b)return;const p=photos.find(x=>String(x.id)===String(b.dataset.v10HomeChoice));if(!p)return;const next=!p.homeHero;if(next&&selectedHome().length>=8){Router.toast('첫 화면 사진은 최대 8장까지 고를 수 있어요');return}p.homeHero=next;draw();paintHome();try{await DB.updatePhoto(p.id,{homeHero:next});status.textContent=next?'첫 화면에 추가했어요 ✓':'첫 화면에서 뺐어요'}catch(err){p.homeHero=!next;draw();paintHome();status.textContent='저장에 실패했어요. 다시 눌러주세요.'}};
  $('#v10HomeFilter',panel).onchange=draw;$('#v10HomeAll',panel).onclick=()=>{$('#v10HomeFilter',panel).value='';draw()};
  $('#v10HomeFile',panel).onchange=async e=>{const files=Array.from(e.target.files||[]).filter(f=>f.type.startsWith('image/')),date=$('#v10HomeDate',panel).value||localToday();e.target.value='';let ok=0;for(let i=0;i<files.length;i++){if(selectedHome().length>=8)break;status.textContent=`추가 중 ${i+1} / ${files.length}`;try{const url=await imageData(files[i]),hero=!photos.some(x=>x.date===date&&x.hero);const id=await DB.addPhoto({date,url,hero,homeHero:true,bookPick:false,place:'',food:'',type:'',moods:[],title:'',caption:'',author:me(),originalName:files[i].name,dateSource:'직접 선택'});if(id)photos.push({id,date,url,hero,homeHero:true,bookPick:false,title:'',caption:'',author:me()});ok++}catch(err){console.warn('[home photo]',err)}}status.textContent=ok?`${ok}장 추가했어요 ✓`:'추가된 사진이 없어요.';draw();paintHome()};
  $('#v10HomeDone',panel).onclick=()=>{$('#uploadModal').classList.remove('is-open');document.body.classList.remove('modal-open')};draw();$('#uploadModal').classList.add('is-open');document.body.classList.add('modal-open');
}

/* ---------- Our Days: one clear click target; square preview is view-only ---------- */
function dateFromCell(cell){
  if(cell.dataset.date)return cell.dataset.date;if(cell.dataset.v6Date)return cell.dataset.v6Date;const n=Number($('.cal-num',cell)?.textContent);if(!n)return'';
  const label=$('#view-ourdays #monthLabel')?.textContent||'';const months={January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};const m=label.match(/([A-Za-z]+)\s+(20\d{2})/);if(!m||!months[m[1]])return'';return `${m[2]}-${pad(months[m[1]])}-${pad(n)}`;
}
function patchCalendar(){
  const view=$('#view-ourdays');if(!view||!view.classList.contains('is-active'))return;
  $$('.cal-cell:not(.is-empty)',view).forEach(cell=>{
    const date=dateFromCell(cell);if(!date)return;cell.dataset.date=date;cell.dataset.action='memory';cell.dataset.v6Date=date;
    $$('.v6-day-edit-icon,.v6-calendar-photo-hit',cell).forEach(n=>n.remove());
    const p=photoFor(date),meta=dayMeta[date]||{},ev=(window.EVENTS||{})[date]||{};
    if(meta.title){let t=$('.cal-title',cell);if(!t){t=document.createElement('div');t.className='cal-title';cell.appendChild(t)}t.textContent=meta.title}else if(ev.title&&$('.cal-title',cell))$('.cal-title',cell).textContent=ev.title;
    cell.style.backgroundImage='none';
    let media=$('.v10-cal-media',cell);
    cell.classList.toggle('has-photo',!!p);
    if(p){const f=focus(p);if(!media){media=document.createElement('div');media.className='v10-cal-media';media.innerHTML='<img alt="">';cell.prepend(media)}const im=$('img',media);im.src=p.url;im.style.objectPosition=`${f.x}% ${f.y}%`;im.style.transform=`scale(${f.z})`;im.style.transformOrigin=`${f.x}% ${f.y}%`;}
    else if(media)media.remove();
    if(date==='2025-12-20'||date==='2025-12-08'){
      let b=$('.v10-birthday',cell);if(!b){b=document.createElement('span');b.className='v10-birthday';b.textContent='🎂';cell.appendChild(b)}
    }
  });
}

/* ---------- V1-like Kakao block: no emotion/category label, 3 preview + up to 20 ---------- */
const SYS=/^(사진(?: \d+장)?|동영상|이모티콘|파일:|카카오톡 프로필)$/;
function chatRows(date){let rows=[];try{rows=FullChat.messagesForDate(date)||[]}catch(_e){}return rows.map((m,i)=>({...m,_i:i})).filter(m=>m.text&&!SYS.test(String(m.text).trim())&&!/^https?:\/\//.test(String(m.text).trim())&&!/원을 (보냈어요|받았어요)/.test(String(m.text)))}
const CORE_WORDS=/사랑해|보고싶어|아가|여보|결혼|평생|고마워|행복/;
function twentyFor(date){
  const rows=chatRows(date);if(rows.length<=20)return rows;
  const meta=dayMeta[date]||{},saved=Array.isArray(meta.repChat)?meta.repChat:[];
  let center=-1;
  const idxs=saved.map(x=>Number(x.index)).filter(Number.isFinite);if(idxs.length){const avg=idxs.reduce((a,b)=>a+b,0)/idxs.length;let dist=1e9;rows.forEach((r,i)=>{const d=Math.abs(r._i-avg);if(d<dist){dist=d;center=i}})}
  if(center<0){const ev=(window.EVENTS||{})[date]||{},anchors=(ev.kakao||[]).map(x=>x[1]).filter(Boolean);outer:for(const a of anchors){for(let i=0;i<rows.length;i++){if(rows[i].text===a||rows[i].text.includes(a)||a.includes(rows[i].text)){center=i;break outer}}}}
  if(center<0)center=Math.floor(rows.length*.55);
  let start=Math.max(0,center-7);if(start+20>rows.length)start=Math.max(0,rows.length-20);
  const windowRows=rows.slice(start,start+20);
  // 사랑해/보고싶어/아가/여보/결혼/평생/고마워/행복 matter too much to leave out just
  // because they fall outside the usual 20-message window centered on the day's
  // saved/curated highlight — always keep every message with one of these words,
  // merged back into chronological order alongside the normal window.
  const core=rows.filter(r=>CORE_WORDS.test(r.text||''));
  if(!core.length)return windowRows;
  const inWindow=new Set(windowRows.map(r=>r._i)),extra=core.filter(r=>!inWindow.has(r._i));
  if(!extra.length)return windowRows;
  return windowRows.concat(extra).sort((a,b)=>a._i-b._i);
}
async function paintKakao(){
  const modal=$('#memoryModal');if(!modal?.classList.contains('is-open'))return;const m=location.hash.match(/^#\/memory\/(\d{4}-\d{2}-\d{2})/);if(!m)return;const date=m[1],panel=$('#memoryPanel');if(!panel)return;
  $('#v6RepresentativeKakao',panel)?.setAttribute('hidden','');const old=$('#kakaoBlock',panel);if(old)old.style.display='none';
  const token=++kakaoToken;try{await FullChat.load()}catch(_e){}if(token!==kakaoToken||!panel.isConnected)return;const rows=twentyFor(date);
  let box=$('#v10Kakao',panel);if(!box){box=document.createElement('section');box.id='v10Kakao';box.className='v10-kakao';const anchor=old||$('.section-head',panel);anchor?anchor.insertAdjacentElement('beforebegin',box):panel.appendChild(box)}
  if(!rows.length){box.innerHTML='';box.style.display='none';return}box.style.display='';
  const sig=date+'|'+rows.map(r=>`${r._i}:${r.speaker}:${r.text}`).join('|');if(box.dataset.sig===sig)return;box.dataset.sig=sig;
  box.innerHTML=`<div class="v10-kakao-label">우리 카톡</div><div class="v10-kakao-box">${rows.map((r,i)=>`<div class="v10-chat-row ${String(r.speaker||'').includes('시현')?'sihyun':'gangwon'} ${i>=3?'is-more':''}"><div class="v10-chat-bubble"><small>${String(r.speaker||'').includes('시현')?'시현':String(r.speaker||'').includes('강원')?'강원':esc(r.speaker||'')}</small><p>${esc(r.text||'')}</p></div></div>`).join('')}</div>${rows.length>3?`<button type="button" class="v10-kakao-more" data-v10-kakao-more>${`카톡 더보기 (${rows.length}개)`}</button>`:''}`;
}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-v10-kakao-more]');if(!b)return;e.preventDefault();const box=b.closest('.v10-kakao'),open=box.classList.toggle('is-open');b.textContent=open?'카톡 접기':`카톡 더보기 (${$$('.v10-chat-row',box).length}개)`},true);
function simplifyDayEditor(){
  const panel=$('#uploadPanel');if(!panel||!$('#v6DayTitle',panel))return;
  const sel=$('#v6RepCat',panel);if(sel){sel.style.display='none';sel.setAttribute('aria-hidden','true')}
  const head=$('.v6-rep-editor-head span',panel);if(head&&head.textContent!=='실제 카톡 원문에서 최대 20개까지 고를 수 있어요.')head.textContent='실제 카톡 원문에서 최대 20개까지 고를 수 있어요.';
  const auto=$('.v6-auto-preview>span',panel);if(auto&&auto.textContent!=='자동 추천 · 최대 20개')auto.textContent='자동 추천 · 최대 20개';
}

/* ---------- Memory photos click to the same metadata editor as Album ---------- */
document.addEventListener('click',e=>{
  const img=e.target.closest?.('#memPhotoGallery img');if(!img)return;const p=photos.find(x=>String(x.url||'')===String(img.src||''));if(p&&window.AlbumView){e.preventDefault();e.stopImmediatePropagation();AlbumView.openMetaEditor(p)}
},true);

/* ---------- SPECIAL: always read representative photos from the Album ---------- */
/* Special-page cards without a photo used to just fall back to a plain
   placeholder. If the day has real Kakao chat, show a representative line
   from it instead — prefers a message with one of the CORE_WORDS, else the
   day's middle message. */
let fullChatReady=false;
function ensureFullChatForSpecial(){
  if(fullChatReady||!window.FullChat)return;
  if(FullChat.ready){fullChatReady=true;return}
  FullChat.load().then(()=>{fullChatReady=true;schedule()}).catch(()=>{});
}
function repChatFor(date){
  if(!fullChatReady)return null;
  const rows=chatRows(date);if(!rows.length)return null;
  return rows.find(r=>CORE_WORDS.test(r.text||''))||rows[Math.floor(rows.length/2)];
}
function kakaoFallbackHTML(date){
  const m=repChatFor(date);if(!m)return'';
  const who=String(m.speaker||'').includes('시현')?'시현':String(m.speaker||'').includes('강원')?'강원':esc(m.speaker||'');
  return `<div class="v10-special-kakao-fallback"><i>카톡</i><p><b>${esc(who)}</b> ${esc(m.text||'')}</p></div>`;
}
function syncSpecial(){
  const host=$('#specialDetailHost');if(!host||host.style.display==='none')return;
  ensureFullChatForSpecial();
  $$('.v7-memory-photo-card[data-date],.v7-season-memory[data-date]',host).forEach(card=>{
    const date=card.dataset.date,p=photoFor(date),frame=$('.v7-memory-photo,.v7-season-photo',card);if(!frame)return;
    if(p){let im=$('img',frame);if(!im){frame.innerHTML='<img alt="">';im=$('img',frame)}const f=focus(p);im.src=p.url;im.style.objectPosition=`${f.x}% ${f.y}%`;im.style.transform=`scale(${f.z})`;im.style.transformOrigin=`${f.x}% ${f.y}%`}
    else if(!$('img',frame)){const html=kakaoFallbackHTML(date);if(html&&frame.dataset.v10Kakao!==date){frame.dataset.v10Kakao=date;frame.innerHTML=html}}
  });
  $$('[data-action="memory"][data-date]',host).forEach(card=>{
    if(card.matches('.v7-memory-photo-card,.v7-season-memory'))return;const date=card.dataset.date,p=photoFor(date);
    if(p){let media=$('.v10-special-photo',card);if(!media){media=document.createElement('div');media.className='v10-special-photo';media.innerHTML='<img alt="">';card.prepend(media)}const f=focus(p),im=$('img',media);im.src=p.url;im.style.objectPosition=`${f.x}% ${f.y}%`;im.style.transform=`scale(${f.z})`;im.style.transformOrigin=`${f.x}% ${f.y}%`;return}
    if($('.v10-special-photo',card))return;
    const html=kakaoFallbackHTML(date);if(!html||card.dataset.v10Kakao===date)return;card.dataset.v10Kakao=date;
    const media=document.createElement('div');media.className='v10-special-photo v10-special-kakao-only';media.innerHTML=html;card.prepend(media);
  });
  $$('.v7-season-block',host).forEach((b,i)=>{b.classList.remove('is-autumn','is-winter','is-spring','is-summer');b.classList.add(['is-autumn','is-winter','is-spring','is-summer'][i%4])});
}

/* ---------- responsive and no-bars CSS ---------- */
const style=document.createElement('style');style.id='v10FinalCss';style.textContent=`
.v6-calendar-photo-hit,.v6-day-edit-icon{display:none!important}
#v6RepresentativeKakao[hidden]{display:none!important}
.v10-photo-surface{position:relative!important;display:block!important;width:100%!important;aspect-ratio:4/5!important;padding:0!important;margin:0!important;border:0!important;border-radius:6px!important;overflow:hidden!important;background:#e9dfcd!important;appearance:none!important;-webkit-appearance:none!important;box-shadow:none!important;clip-path:none!important;-webkit-mask:none!important;mask:none!important;cursor:zoom-in!important}
.v10-photo-surface::before,.v10-photo-surface::after{display:none!important;content:none!important}.v10-photo-surface>img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;background:transparent!important;border:0!important;box-shadow:none!important;clip-path:none!important;-webkit-mask:none!important;mask:none!important}
/* polishAlbum() inserts .v10-photo-surface right before the old
   .v6-clean-photo-hit/.v3-photo-imagebtn and sets old.style.display='none',
   but v3-fix4.css/v3-fix6.css force those old elements display:block!important
   — inline styles never beat !important CSS, so the old photo box stayed
   visible as a second, separately-flowed block below the new one, doubling
   every album card's height with the same photo twice. This rule (appended
   to <head> at runtime, so it wins ties with those earlier !important rules
   by cascade order) hides the old box for good. */
.v10-photo-surface+.v3-photo-imagebtn,.v10-photo-surface+.v6-clean-photo-hit{display:none!important}
.v10-home-manage{position:absolute;right:14px;top:14px;z-index:30;border:1px solid rgba(255,255,255,.72);background:rgba(28,23,18,.7);color:#fff;border-radius:999px;padding:9px 12px;font-family:var(--hand);font-size:10px;backdrop-filter:blur(6px);cursor:pointer}.v10-home-empty{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;border:0;background:#e9dfcd;color:var(--ink);cursor:pointer}.v10-home-empty span{font-size:30px}.v10-home-empty b{font-family:var(--serif);font-size:18px}.v10-home-empty small{font-size:10px;color:var(--ink-soft)}
.v10-home-stage{position:absolute;inset:0;overflow:hidden;background:#e9dfcd}.v10-home-slide{position:absolute;inset:0;opacity:0;transition:opacity .6s ease;overflow:hidden}.v10-home-slide.is-active{opacity:1}.v10-home-slide>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
/* v3-userfix.css's older carousel rule blanket-hides every img inside
   .hero-photo (opacity:0!important) and only exempts img.is-active — but
   this stage puts .is-active on the wrapping .v10-home-slide div, not the
   img itself, so every real home photo stayed invisible. Out-specificity
   the old rule instead of touching it, since other code still depends on
   its base behavior for the pre-v10 fallback carousel. */
#view-home .hero-photo .v10-home-stage .v10-home-slide img{opacity:1!important}
#view-home .hero-photo .v10-home-stage .v10-home-slide:not(.is-active) img{opacity:0!important}.v10-home-dots{position:absolute;left:50%;bottom:9px;transform:translateX(-50%);display:flex;gap:5px;z-index:3}.v10-home-dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.48);box-shadow:0 0 0 1px rgba(0,0,0,.15)}.v10-home-dots i.is-active{background:#fff}
.v10-home-help{font-size:12px;line-height:1.65;color:var(--ink-soft);word-break:keep-all}.v10-home-upload{display:grid;grid-template-columns:minmax(140px,180px) auto 1fr;gap:8px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:13px;background:#fffaf0}.v10-home-filter{display:flex;gap:8px;margin:12px 0}.v10-home-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;max-height:55vh;overflow:auto}.v10-home-choice{position:relative;display:block;text-align:left;padding:6px;border:1px solid var(--line);border-radius:11px;background:#fffdf8;color:var(--ink);overflow:hidden}.v10-home-choice.is-selected{border:2px solid var(--red);padding:5px}.v10-home-choice>div{aspect-ratio:1;overflow:hidden;border-radius:7px;background:#e9dfcd}.v10-home-choice img{width:100%;height:100%;object-fit:cover;display:block}.v10-home-choice>b{display:block;margin:7px 3px 0;font-family:var(--serif);font-size:12px;line-height:1.25;word-break:keep-all}.v10-home-choice>span{display:block;margin:3px;font-size:8px;color:var(--kraft)}.v10-home-choice>i{position:absolute;right:10px;top:10px;background:rgba(255,253,248,.94);border-radius:999px;padding:4px 6px;font-style:normal;font-size:8px;color:var(--red)}
#view-ourdays .cal-cell{position:relative!important;overflow:hidden!important;touch-action:manipulation}
/* .cal-cell keeps its own padding:5px 3px (v3-userfix.css) for the day
   number/title, but the photo itself should bleed edge-to-edge instead of
   sitting inset inside that padding — negative inset matching the cell's
   padding pulls .v10-cal-media out to the cell's true border edge.
   v3.css's .cal-cell.has-photo>*{position:relative;z-index:1} (written for
   plain text/badge children) outspecifies a bare .v10-cal-media rule and was
   silently turning this back into a normal-flow, inset-inside-the-padding
   box — .cal-cell.has-photo>.v10-cal-media matches it three classes deep to
   win. */
.cal-cell.has-photo>.v10-cal-media{position:absolute!important;inset:-5px -3px!important;z-index:0!important}
.v10-cal-media{position:absolute;inset:-5px -3px;z-index:0;overflow:hidden;pointer-events:none;background:#e9dfcd}.v10-cal-media img{width:100%;height:100%;object-fit:cover;display:block}.cal-cell .cal-num,.cal-cell .cal-title,.cal-cell .cal-badge,.cal-cell .cal-chat-badge,.cal-cell .cal-mood-dots,.v10-birthday{position:relative;z-index:3}.v10-birthday{position:absolute!important;right:4px;top:4px;font-size:18px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.2));pointer-events:none}.cal-cell[data-date="2025-12-20"] .cal-badge,.cal-cell[data-date="2025-12-08"] .cal-badge{display:none!important}
@media(max-width:560px){.v10-cal-media,.cal-cell.has-photo>.v10-cal-media{inset:-3px -1px!important}}
.v10-focus-editor{margin:16px 0;padding:14px;border:1px solid var(--line);border-radius:14px;background:#fffaf0}.v10-focus-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.v10-focus-head b{font-family:var(--serif);font-size:16px}.v10-focus-head span{display:block;margin-top:3px;font-size:9px;line-height:1.5;color:var(--ink-soft);word-break:keep-all}
.v10-focus-preview{position:relative;width:min(340px,100%);aspect-ratio:1;margin:12px auto;overflow:hidden;border-radius:12px;box-shadow:0 0 0 3px #fffaf0,0 0 0 4px var(--line),0 10px 26px rgba(35,31,22,.18);background:#e9dfcd;touch-action:none;cursor:grab;-webkit-user-select:none;user-select:none}
.v10-focus-preview.is-dragging{cursor:grabbing}
.v10-focus-preview img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
.v10-focus-zoom{display:flex;align-items:center;gap:10px;max-width:340px;margin:0 auto;font-size:10px;color:var(--ink-soft)}.v10-focus-zoom input{flex:1}
.v10-focus-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.v10-kakao{margin:20px 0}.v10-kakao-label{font-family:var(--hand);font-size:12px;font-weight:700;margin:0 0 9px;color:var(--ink)}.v10-kakao-box{min-height:145px;border:1px solid var(--line);border-radius:12px;background:#fffaf0;padding:14px 12px;display:flex;flex-direction:column;gap:7px}.v10-chat-row{display:flex}.v10-chat-row.gangwon{justify-content:flex-start}.v10-chat-row.sihyun{justify-content:flex-end}.v10-chat-row.is-more{display:none}.v10-kakao.is-open .v10-chat-row.is-more{display:flex}.v10-chat-bubble{max-width:76%;border:1px solid #d8c8aa;border-radius:10px;padding:8px 10px;background:#fff;box-shadow:0 2px 5px rgba(35,31,22,.03)}.v10-chat-row.sihyun .v10-chat-bubble{background:#f5d867;border-color:#ead48a}.v10-chat-bubble small{display:block;font-family:var(--hand);font-size:8px;margin-bottom:3px;color:#665944}.v10-chat-bubble p{margin:0;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:keep-all}.v10-kakao-more{margin-top:0;border:1px solid var(--line);border-radius:999px;background:#fffaf0;padding:7px 13px;color:var(--ink);font-family:var(--hand);font-weight:700;font-size:10px;cursor:pointer}
.v10-special-photo{height:130px;margin:-2px -2px 10px;overflow:hidden;border-radius:9px;background:#e9dfcd}.v10-special-photo img,.v7-memory-photo img,.v7-season-photo img{width:100%;height:100%;object-fit:cover;display:block}.v7-season-photo{overflow:hidden}
.v10-special-kakao-fallback{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:14px;background:linear-gradient(145deg,#fffaf0,#f3e9d2);color:var(--ink)}
.v10-special-kakao-fallback i{align-self:flex-start;font-style:normal;font-family:var(--hand);font-size:9px;letter-spacing:.1em;color:var(--kraft);border:1px solid rgba(180,151,92,.4);border-radius:999px;padding:2px 8px}
.v10-special-kakao-fallback p{margin:0;font-size:11px;line-height:1.55;word-break:keep-all;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.v10-special-kakao-fallback p b{font-family:var(--hand);color:var(--red);margin-right:4px}
.v10-special-kakao-only{cursor:pointer}.v7-season-block.is-autumn{background:linear-gradient(145deg,#fffaf0,#f0e0c5);border-color:#d6b47f}.v7-season-block.is-winter{background:linear-gradient(145deg,#fbfcfd,#e8edf2);border-color:#b9c6d1}.v7-season-block.is-spring{background:linear-gradient(145deg,#fffaf7,#f2e2e5);border-color:#d9b9c0}.v7-season-block.is-summer{background:linear-gradient(145deg,#fffdf4,#eaf0df);border-color:#becaa8}
.section-title,.modal-title,.v3-photo-title,.v7-card-copy .t,.v7-season-copy b,.v10-home-choice>b{word-break:keep-all!important;overflow-wrap:break-word!important}.btn,button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
@media(max-width:760px){.v10-home-manage{right:9px;top:9px;min-height:42px}.v10-home-upload{grid-template-columns:1fr}.v10-home-grid{grid-template-columns:repeat(2,minmax(0,1fr));max-height:50vh}.v10-focus-actions{display:grid;grid-template-columns:1fr}.v10-focus-actions .btn{width:100%}.v10-kakao-box{padding:12px 9px}.v10-chat-bubble{max-width:88%}.v10-chat-bubble p{font-size:12px}.cal-cell .cal-title{font-size:clamp(7px,2.3vw,9px)!important;line-height:1.12!important}.v10-birthday{font-size:17px}}
@media(max-width:480px){main{padding-left:10px!important;padding-right:10px!important}.v3-photo-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.v10-home-choice>b{font-size:11px}.v10-kakao-label{font-size:13px}.v10-chat-bubble{max-width:90%}.v10-chat-bubble p{font-size:12px}.v7-first-grid{grid-template-columns:1fr!important}.v7-season-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.modal-panel{width:min(96vw,720px)!important;padding-left:13px!important;padding-right:13px!important}.top-nav button,.future-tabs button,.v1-future-tabs button{white-space:nowrap!important}}
@media(max-width:360px){.v10-home-grid{grid-template-columns:1fr 1fr;gap:6px}.v3-photo-grid{grid-template-columns:1fr!important}.v7-season-grid{grid-template-columns:1fr!important}.v10-chat-bubble{max-width:94%}.bottom-nav button{font-size:8px!important;min-width:0!important}}
`;
document.head.appendChild(style);

let queued=false;function run(){queued=false;cleanCopy();polishAlbum();enhancePhotoEditor();paintHome();patchCalendar();simplifyDayEditor();syncSpecial();paintKakao()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
window.addEventListener('hashchange',()=>setTimeout(schedule,40));
window.addEventListener('load',schedule);schedule();
})();
