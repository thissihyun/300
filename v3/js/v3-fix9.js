/* 300 Days With You — release consolidation */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let photos=[];
const photoFor=date=>photos.find(p=>p.date===date&&p.hero)||photos.find(p=>p.date===date)||null;
/* Home-hero rendering (first-screen photo picker/carousel) now lives solely in
   v3-release-final.js's paintHome(), which signature-diffs #heroPhotoWrap before
   touching it. This file used to run a second, independent renderer
   (forceHomePhotos/.v10-home-layer) that appendChild'd its own photo layer next
   to paintHome()'s .v10-home-stage. Both scripts observe the same
   document.body mutations, so each one's DOM write re-triggered the other's
   observer: paintHome() replaces wrap.innerHTML whenever its own signature
   changes, silently destroying this file's .v10-home-layer, while this file's
   appendChild left stale layers behind paintHome()'s rebuilds. The endless
   churn between two competing writers of the same subtree left the browser's
   painted state out of sync with the final computed style (photo geometry and
   opacity looked correct in devtools, but nothing was actually rendered on
   screen). Removed; paintHome() alone owns #heroPhotoWrap now. */
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
/* Must stay absolute (matches v3-userfix.css's #view-home .hero-photo rule):
   .hero-photo fills .hero via inset:0, and an element with position:absolute
   is itself already a valid containing block for its own absolutely-
   positioned children — it never needed to be relative for that. Overriding
   it to relative here (this selector's two ids out-specify that rule) was
   silently collapsing the whole hero photo area to near-zero size, since
   nothing inside it contributes to intrinsic sizing once every child is
   itself position:absolute. */
#view-home #heroPhotoWrap{position:absolute!important;inset:0!important;overflow:hidden!important}
#view-album .v3-feature-grid .v3-photo-card,#view-album .v3-feature-grid .v6-clean-photo-hit,#view-album .v3-feature-grid .v3-photo-imagebtn{background:#e9dfcd!important;overflow:hidden!important;clip-path:none!important;-webkit-mask:none!important;mask:none!important}
#view-album .v3-feature-grid .v6-clean-photo-hit>img,#view-album .v3-feature-grid .v3-photo-imagebtn>img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;background:transparent!important;border:0!important;box-shadow:none!important;clip-path:none!important;-webkit-mask:none!important;mask:none!important}
#view-album .v3-feature-grid .v6-clean-photo-hit::before,#view-album .v3-feature-grid .v6-clean-photo-hit::after,#view-album .v3-feature-grid .v3-photo-imagebtn::before,#view-album .v3-feature-grid .v3-photo-imagebtn::after{display:none!important;content:none!important}
button,.btn,[role="button"],.v6-day-edit-icon,.v6-calendar-photo-hit,.v9-home-choice,.v9-home-hero-manage{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
@media(max-width:760px){button,.btn,.icon-btn,.v6-day-edit-icon,.v9-home-hero-manage{min-height:42px}.v9-home-choice{min-height:0!important}.section-title,.modal-title,.v7-card-copy .t,.v7-season-copy b{word-break:keep-all;overflow-wrap:break-word}.v6-rep-msg{max-width:92%}.v6-rep-msg p{font-size:12px;line-height:1.6}}
`;
document.head.appendChild(style);

let queued=false;function run(){queued=false;cleanProductCopy();ensureOurDaysCells()}
new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true,characterData:true});
window.addEventListener('hashchange',()=>setTimeout(run,50));run();
})();
