/* 300 Days With You — release consolidation */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let photos=[],homeTimer=null;
const photoFor=date=>photos.find(p=>p.date===date&&p.hero)||photos.find(p=>p.date===date)||null;

/* Keep first-screen selections authoritative even when the base Home view refreshes. */
function selectedHome(){return photos.filter(p=>p.homeHero).sort((a,b)=>(a.date||'').localeCompare(b.date||'')).slice(0,8)}
function forceHomePhotos(){
  const wrap=$('#view-home #heroPhotoWrap');if(!wrap)return;
  const list=selectedHome();
  if(!list.length){const old=$('.v10-home-layer',wrap);if(old)old.remove();return;}
  const sig=list.map(p=>`${p.id}:${p.url}`).join('|');let layer=$('.v10-home-layer',wrap);
  if(layer&&layer.dataset.sig===sig)return;
  clearInterval(homeTimer);
  if(layer)layer.remove();
  layer=document.createElement('div');layer.className='v10-home-layer';layer.dataset.sig=sig;
  layer.innerHTML=list.map((p,i)=>`<img src="${String(p.url||'').replace(/"/g,'&quot;')}" alt="" class="${i?'':'is-active'}" style="object-position:${p.homeFocusX??50}% ${p.homeFocusY??50}%">`).join('')+(list.length>1?`<div class="v10-home-dots">${list.map((_,i)=>`<i class="${i?'':'is-active'}"></i>`).join('')}</div>`:'');
  wrap.appendChild(layer);
  if(list.length>1){let i=0;homeTimer=setInterval(()=>{if(!layer.isConnected){clearInterval(homeTimer);return}const imgs=$$('img',layer),dots=$$('i',layer);i=(i+1)%imgs.length;imgs.forEach((im,j)=>im.classList.toggle('is-active',j===i));dots.forEach((d,j)=>d.classList.toggle('is-active',j===i))},4200)}
}
if(window.DB&&DB.onAllPhotos)DB.onAllPhotos(rows=>{photos=rows||[];requestAnimationFrame(run)});

/* Give every calendar day a canonical date. Photo-only days used to miss data-date. */
function ensureOurDaysCells(){
  const view=$('#view-ourdays');if(!view||!view.classList.contains('is-active'))return;
  const label=$('#monthLabel',view)?.textContent||'';
  const names={January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};
  const m=label.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i);if(!m)return;
  const key=Object.keys(names).find(x=>x.toLowerCase()===m[1].toLowerCase()),month=names[key],year=Number(m[2]);
  $$('.cal-cell:not(.is-empty)',view).forEach(cell=>{
    const day=Number($('.cal-num',cell)?.textContent);if(!day)return;
    const date=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    cell.dataset.date=date;cell.dataset.v6Date=date;cell.dataset.action='memory';
    if(!$('.v6-day-edit-icon',cell)){const e=document.createElement('span');e.className='v6-day-edit-icon';e.dataset.v6EditDay=date;e.textContent='✎';e.title='이 날 제목·대표카톡 수정';cell.appendChild(e)}else $('.v6-day-edit-icon',cell).dataset.v6EditDay=date;
    const p=photoFor(date);
    if(p){cell.classList.add('has-photo');cell.style.backgroundImage=`url("${String(p.url||'').replace(/"/g,'&quot;')}")`;cell.style.backgroundPosition=`${p.focusX==null?50:p.focusX}% ${p.focusY==null?50:p.focusY}%`;
      let hit=$('.v6-calendar-photo-hit',cell);if(!hit){hit=document.createElement('span');hit.className='v6-calendar-photo-hit';hit.innerHTML='<i>▣</i><b>사진 수정</b>';hit.title='사진 설명·달력 위치 수정';cell.appendChild(hit)}hit.dataset.v6EditPhoto=p.id;
    }
  });
}

/* No implementation/version copy is allowed in the shipped UI. */
function cleanProductCopy(){
  $$('.v3-home-stamp').forEach(x=>x.remove());
  $$('.v3-day-editor .section-note').forEach(x=>{if(/V1처럼 과거 날짜도|기록자는\s*(시현|강원)/.test(x.textContent||''))x.remove()});
  const ed=$('.v3-day-editor h3');if(ed&&ed.textContent.trim()==='Edit this day')ed.textContent='OUR DAY';
  const future=$('#view-future .v1-future-head p');if(future&&/비슷한 기능은 합치고/.test(future.textContent||''))future.textContent='앞으로 함께 하고 싶은 일, 지키고 싶은 약속, 미래의 우리에게 남기는 편지.';
  $$('.v3-auto-activity b').forEach(x=>{if(/연대기 기록 기반 자동 분류/.test(x.textContent||''))x.textContent='추천 활동'});
  const toolbar=$('#view-album #modeToolbar');if(toolbar)toolbar.setAttribute('aria-label','Photo album views');
  /* Earlier scrapbook map connected every pin. Keep pins only. */
  $$('.v3-scrap-map svg path').forEach(p=>{const stroke=(p.getAttribute('stroke')||'').toLowerCase(),dash=p.getAttribute('stroke-dasharray');if(stroke==='#a5372c'||dash)p.remove()});
  const preview=$('#v3KakaoPreview');if(preview&&/저장이 완료되지 않았어요/.test(preview.textContent||'')&&/이 기기 카톡\s*✓/.test(preview.textContent||''))preview.innerHTML='<b>이 기기에는 최신 카톡이 저장됐어요 ✓</b><br>공유 동기화만 다시 시도해 주세요.';
}

/* Final photo-surface + mobile interaction rules. These only affect viewports, never source files. */
const style=document.createElement('style');style.textContent=`
#view-home #heroPhotoWrap{position:relative!important;overflow:hidden!important}
.v10-home-layer{position:absolute;inset:0;z-index:8;background:#eee5d6;overflow:hidden;border-radius:inherit}
.v10-home-layer>img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;display:block;opacity:0;transition:opacity .65s ease;background:#eee5d6;border:0!important;box-shadow:none!important;clip-path:none!important;-webkit-mask:none!important;mask:none!important}
.v10-home-layer>img.is-active{opacity:1}
.v10-home-dots{position:absolute;left:50%;bottom:9px;transform:translateX(-50%);display:flex;gap:5px;z-index:3}.v10-home-dots i{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.5);box-shadow:0 0 0 1px rgba(0,0,0,.15)}.v10-home-dots i.is-active{background:#fff}
#view-album .v3-feature-grid .v3-photo-card,#view-album .v3-feature-grid .v6-clean-photo-hit,#view-album .v3-feature-grid .v3-photo-imagebtn{background:#e9dfcd!important;overflow:hidden!important;clip-path:none!important;-webkit-mask:none!important;mask:none!important}
#view-album .v3-feature-grid .v6-clean-photo-hit>img,#view-album .v3-feature-grid .v3-photo-imagebtn>img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;background:transparent!important;border:0!important;box-shadow:none!important;clip-path:none!important;-webkit-mask:none!important;mask:none!important}
#view-album .v3-feature-grid .v6-clean-photo-hit::before,#view-album .v3-feature-grid .v6-clean-photo-hit::after,#view-album .v3-feature-grid .v3-photo-imagebtn::before,#view-album .v3-feature-grid .v3-photo-imagebtn::after{display:none!important;content:none!important}
button,.btn,[role="button"],.v6-day-edit-icon,.v6-calendar-photo-hit,.v9-home-choice,.v9-home-hero-manage{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
@media(max-width:760px){button,.btn,.icon-btn,.v6-day-edit-icon,.v9-home-hero-manage{min-height:42px}.v9-home-choice{min-height:0!important}.section-title,.modal-title,.v7-card-copy .t,.v7-season-copy b{word-break:keep-all;overflow-wrap:break-word}.v6-rep-msg{max-width:92%}.v6-rep-msg p{font-size:12px;line-height:1.6}}
`;
document.head.appendChild(style);

let queued=false;function run(){queued=false;cleanProductCopy();ensureOurDaysCells();forceHomePhotos()}
new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true,characterData:true});
window.addEventListener('hashchange',()=>setTimeout(run,50));run();
})();
