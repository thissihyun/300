/* 300 DAYS WITH YOU — V36 CANVA INTERNAL PAGE REFRESH
   Uses additional saved Canva references as visual inspiration only.
   No real photographs are regenerated or altered; layout and framing only. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const CSS=String.raw`
/* ---------- V36 shared editorial language ---------- */
body.v35-canva .view>.panel{position:relative}
body.v35-canva .v36-ref-label{
  display:inline-flex;align-items:center;gap:7px;margin:0 0 11px;padding:5px 9px;
  background:#f1e5cc;border:1px solid rgba(116,96,73,.22);color:#76624f;
  font:700 9px/1 'Gaegu',cursive;letter-spacing:.14em;text-transform:uppercase;
  transform:rotate(-1.2deg);box-shadow:2px 3px 0 rgba(92,72,51,.06)
}
body.v35-canva .v36-ref-label:before{content:'✦';font-size:8px;color:#a94c49}
body.v35-canva .v36-paper-title{font-family:'Playfair Display',serif!important;font-style:italic!important;letter-spacing:-.025em!important}

/* ---------- ALBUM · Grey Minimalist Magazine + Photo Dump ---------- */
body.v35-canva #view-photoalbum>.panel{
  background:#f5f2ec!important;border:1px solid #cfc6b8!important;padding:28px!important;overflow:visible!important;
  box-shadow:0 22px 50px rgba(39,34,30,.09)!important
}
body.v35-canva #view-photoalbum>.panel:before{display:none!important}
body.v35-canva #view-photoalbum h2{font-size:clamp(34px,5vw,55px)!important;line-height:.93!important;margin:0 0 8px!important;max-width:640px}
body.v35-canva #view-photoalbum .desc{max-width:620px!important;font-family:'Nanum Myeongjo',serif!important;line-height:1.75!important}
body.v35-canva .v15-album-toolbar{
  display:flex!important;gap:7px!important;flex-wrap:wrap!important;margin:20px 0 24px!important;padding:10px!important;
  background:#272522!important;border:0!important;border-radius:0!important
}
body.v35-canva .v15-album-toolbar button{
  min-height:40px!important;border:1px solid rgba(255,255,255,.28)!important;background:transparent!important;color:#f7f0e3!important;
  border-radius:0!important;padding:8px 12px!important;font:700 10px/1 'Gaegu',cursive!important;letter-spacing:.08em!important
}
body.v35-canva .v15-album-toolbar button.active{background:#f4e5c6!important;color:#2b2723!important;border-color:#f4e5c6!important}
body.v35-canva .v15-contact-sheet{gap:16px!important;align-items:start!important}
body.v35-canva .v15-photo-card{
  background:#fff!important;border:1px solid #d4c9b9!important;border-radius:0!important;padding:9px 9px 13px!important;
  box-shadow:5px 8px 18px rgba(37,32,28,.09)!important;transition:.18s ease!important
}
body.v35-canva .v15-photo-card:nth-child(4n+1){transform:rotate(-.65deg)}
body.v35-canva .v15-photo-card:nth-child(4n+2){transform:rotate(.45deg)}
body.v35-canva .v15-photo-card:nth-child(4n+3){transform:translateY(7px) rotate(-.25deg)}
body.v35-canva .v15-photo-card:nth-child(4n){transform:translateY(-4px) rotate(.55deg)}
body.v35-canva .v15-photo-card:hover{transform:translateY(-4px) rotate(0deg)!important;box-shadow:10px 15px 25px rgba(37,32,28,.13)!important}
body.v35-canva .v15-photo-card .thumb{background:#eee9df!important;overflow:hidden!important}
body.v35-canva .v15-photo-card .thumb img{width:100%!important;height:100%!important;object-fit:contain!important;background:#f6f2eb!important}
body.v35-canva .v15-photo-card .date{margin-top:9px!important;font:700 9px/1 'Gaegu',cursive!important;letter-spacing:.08em!important;color:#9a5649!important}
body.v35-canva .v15-photo-card .title{font:italic 600 17px/1.15 'Playfair Display',serif!important;margin-top:4px!important}
body.v35-canva .v15-filmstrip{background:#252321!important;border-radius:0!important;padding:24px 14px!important}
body.v35-canva .v15-film-frame{border-radius:0!important;background:#111!important;padding:8px!important}
body.v35-canva .v15-film-frame img{object-fit:contain!important;background:#111!important}
body.v35-canva .v15-feature-photo{background:#ece5d9!important;border:1px solid #cfc4b5!important;border-radius:0!important;padding:18px!important}
body.v35-canva .v15-feature-photo img{object-fit:contain!important;background:#fff!important;border:8px solid #fff!important}

/* ---------- PLACES · Cream Travel Moodboard + Photo-centric NYC ---------- */
body.v35-canva #view-places>.panel{
  background:#efe8d9!important;border:1px solid #cbbb9f!important;padding:28px!important;overflow:visible!important
}
body.v35-canva #view-places>.panel:before{content:''!important;display:block!important;position:absolute!important;left:42px!important;top:-8px!important;width:76px!important;height:16px!important;background:rgba(194,166,125,.48)!important;transform:rotate(-3deg)!important;border-radius:1px!important}
body.v35-canva #view-places h2{font-size:clamp(38px,6vw,66px)!important;line-height:.9!important;margin:0 0 7px!important}
body.v35-canva #view-places .desc{max-width:700px!important;line-height:1.75!important}
body.v35-canva #nycMapWrap{
  margin:22px 0 26px!important;background:#fff!important;border:10px solid #fff!important;
  box-shadow:10px 14px 28px rgba(55,43,31,.14)!important;transform:rotate(-.35deg);position:relative;z-index:1
}
body.v35-canva #nycMapWrap:after{
  content:'OUR NEW YORK · PLACES WE BECAME US';position:absolute;right:14px;bottom:12px;z-index:1000;
  background:rgba(250,246,236,.88);border:1px solid rgba(120,93,66,.25);padding:5px 8px;
  font:700 9px/1 'Gaegu',cursive;letter-spacing:.08em;color:#765947;pointer-events:none
}
body.v35-canva #view-places .home-grid{gap:10px!important}
body.v35-canva #view-places .city-card{
  min-height:122px!important;border-radius:0!important;background:#f9f4e9!important;border:1px solid #cdbd9f!important;
  box-shadow:3px 5px 0 rgba(126,98,69,.08)!important;position:relative!important;overflow:visible!important
}
body.v35-canva #view-places .city-card:before{content:'VISITED';position:absolute;right:9px;top:9px;border:1px solid rgba(169,76,73,.5);color:#a94c49;padding:3px 5px;font:700 7px/1 'Gaegu',cursive;letter-spacing:.12em;transform:rotate(-6deg)}
body.v35-canva #view-places .city-card .icon{font-size:16px!important;opacity:.75!important}

/* ---------- WORDS · Beige handwritten letter ---------- */
body.v35-canva #view-words>.panel{
  background:
    repeating-linear-gradient(180deg,#fbf7ed 0,#fbf7ed 31px,#d9cfbf 32px)!important;
  border:1px solid #cec1af!important;padding:34px 32px!important;box-shadow:0 16px 42px rgba(54,43,35,.09)!important
}
body.v35-canva #view-words>.panel:before{content:''!important;display:block!important;position:absolute!important;left:64px!important;top:-8px!important;width:86px!important;height:17px!important;background:rgba(213,190,151,.62)!important;transform:rotate(2deg)!important}
body.v35-canva #view-words h2{font-size:clamp(34px,5vw,58px)!important;line-height:.95!important;margin:0 0 9px!important;max-width:790px}
body.v35-canva #view-words .desc{max-width:760px!important;background:rgba(251,247,237,.82)!important;padding:7px 9px!important}
body.v35-canva #wordCloud{display:flex!important;flex-wrap:wrap!important;gap:7px!important;margin:20px 0!important}
body.v35-canva #wordCloud .word-chip,body.v35-canva #wordCloud button{
  border-radius:1px!important;border:1px solid #c9bca8!important;background:#f3e2bd!important;color:#453a31!important;
  padding:7px 10px!important;box-shadow:2px 3px 0 rgba(61,47,36,.06)!important;transform:rotate(-.4deg)
}
body.v35-canva #wordCloud .word-chip:nth-child(3n),body.v35-canva #wordCloud button:nth-child(3n){background:#e8d1cb!important;transform:rotate(.6deg)}
body.v35-canva #wordCloud .word-chip:nth-child(4n),body.v35-canva #wordCloud button:nth-child(4n){background:#dce3d1!important;transform:rotate(-.8deg)}
body.v35-canva #wordResults{background:rgba(255,253,247,.8)!important;padding:12px!important;border-left:3px solid #b45d59!important}

/* ---------- FOOD · restaurant receipt scrapbook ---------- */
body.v35-canva #view-food>.panel{
  background:#ede5d6!important;border:1px solid #cfc0aa!important;padding:28px!important
}
body.v35-canva #view-food>.panel:after{content:'RECEIPT · SIHYUN × GANGWON';position:absolute;right:24px;top:22px;border:1px dashed #9b8570;padding:5px 7px;font:700 8px/1 'Gaegu',cursive;letter-spacing:.1em;color:#816957;transform:rotate(2deg)}
body.v35-canva #view-food h2{max-width:700px!important;font-size:clamp(32px,4.6vw,52px)!important;line-height:.96!important}
body.v35-canva #foodWrap{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:0!important;background:#fffdf7!important;border:1px solid #cbbda9!important;padding:18px!important;box-shadow:7px 9px 0 rgba(100,79,57,.08)!important}
body.v35-canva #foodWrap .home-card{
  border:0!important;border-bottom:1px dashed #d6c9b9!important;border-radius:0!important;background:transparent!important;
  box-shadow:none!important;min-height:104px!important;padding:15px 12px!important
}
body.v35-canva #foodWrap .home-card:nth-last-child(-n+2){border-bottom:0!important}
body.v35-canva #foodWrap .home-card .icon{font-size:18px!important;filter:grayscale(.15)}
body.v35-canva #foodWrap .home-card .title{font-size:17px!important}
body.v35-canva #foodWrap .home-card .sub{font-size:11px!important;letter-spacing:.02em!important}

/* ---------- PHOTOBOOTH · photo dump / contact strip ---------- */
body.v35-canva #view-photobooth>.panel{
  background:#292724!important;color:#f7efe3!important;border:1px solid #1f1d1b!important;padding:28px!important
}
body.v35-canva #view-photobooth>.panel:before,body.v35-canva #view-photobooth>.panel:after{
  content:''!important;position:absolute!important;left:0!important;right:0!important;height:8px!important;
  background:repeating-linear-gradient(90deg,#eee1cb 0 13px,transparent 13px 22px)!important;opacity:.7!important
}
body.v35-canva #view-photobooth>.panel:before{top:5px!important}body.v35-canva #view-photobooth>.panel:after{bottom:5px!important;top:auto!important}
body.v35-canva #view-photobooth h2{color:#fff8ed!important;font-size:clamp(34px,5vw,55px)!important;margin-top:8px!important}
body.v35-canva #view-photobooth .desc{color:#d7ccbd!important}
body.v35-canva #view-photobooth .upload-box{background:#f5ecdd!important;color:#2c2722!important;border:0!important;border-radius:0!important;box-shadow:4px 5px 0 rgba(255,255,255,.06)!important}
body.v35-canva #boothGallery{margin-top:22px!important}
body.v35-canva #boothGallery img{object-fit:contain!important;background:#111!important;border:7px solid #f8f2e8!important;box-shadow:0 8px 18px rgba(0,0,0,.28)!important}

/* ---------- SEASONS · family memories / zine ---------- */
body.v35-canva #view-seasons>.panel{background:#f5efe3!important;border:1px solid #d0c2ad!important;padding:28px!important}
body.v35-canva #view-seasons h2{font-size:clamp(33px,5vw,56px)!important;line-height:.94!important}
body.v35-canva #view-seasons .chapter-block{background:#fffaf1!important;border:1px solid #d8cab5!important;padding:17px!important;margin:14px 0!important;box-shadow:4px 6px 0 rgba(123,96,70,.06)!important}
body.v35-canva #view-seasons .chapter-block:nth-child(even){transform:rotate(.25deg)}
body.v35-canva #view-seasons .chapter-block:nth-child(odd){transform:rotate(-.2deg)}
body.v35-canva #view-seasons .event-item{border-radius:0!important;background:transparent!important;border:0!important;border-top:1px dashed #d8cab5!important;padding:10px 2px!important}

/* ---------- DATE MODAL · beige journal page ---------- */
body.v35-canva .modal{
  background:#f8f2e7!important;border:1px solid #cdbda7!important;border-radius:2px!important;
  box-shadow:0 24px 70px rgba(34,28,23,.25)!important
}
body.v35-canva .modal:before{content:'';position:absolute;left:42px;top:-8px;width:82px;height:17px;background:rgba(205,181,143,.64);transform:rotate(-2deg);z-index:4;pointer-events:none}
body.v35-canva .modal .v36-modal-file{display:inline-flex;margin:2px 0 10px;padding:4px 8px;border:1px solid rgba(150,118,87,.32);background:#f0e3cb;font:700 8px/1 'Gaegu',cursive;letter-spacing:.13em;color:#805e45;transform:rotate(-1deg)}
body.v35-canva .modal img{max-width:100%;object-fit:contain!important;background:#ece4d7}
body.v35-canva .modal .photo-grid img,body.v35-canva .modal .gallery img{border:7px solid #fff!important;box-shadow:4px 7px 15px rgba(48,38,29,.1)!important}
body.v35-canva .modal .msg{border-radius:8px!important}

/* ---------- CALENDAR · travel notebook restraint ---------- */
body.v35-canva #view-calendar>.panel{background:#f8f3e9!important;border:1px solid #d2c3ac!important;padding:26px!important}
body.v35-canva #view-calendar>.panel:before{display:none!important}
body.v35-canva #view-calendar h2{font-size:clamp(32px,4.5vw,48px)!important;margin-bottom:4px!important}
body.v35-canva #view-calendar .calendar-wrap{background:#fffaf2!important;border:1px solid #d8ccb9!important;padding:14px!important;box-shadow:5px 7px 0 rgba(113,87,62,.06)!important}
body.v35-canva #view-calendar .day{border-radius:1px!important}
body.v35-canva #view-calendar .day.has-photo .day-thumb{object-fit:contain!important;background:#eee7da!important;opacity:.88!important}

/* ---------- Mobile: keep scrapbook variety, remove risky rotations ---------- */
@media(max-width:760px){
 body.v35-canva #view-photoalbum>.panel,body.v35-canva #view-places>.panel,body.v35-canva #view-words>.panel,
 body.v35-canva #view-food>.panel,body.v35-canva #view-photobooth>.panel,body.v35-canva #view-seasons>.panel,
 body.v35-canva #view-calendar>.panel{padding:19px 14px!important}
 body.v35-canva .v15-photo-card,body.v35-canva .v15-photo-card:nth-child(n),body.v35-canva #nycMapWrap,
 body.v35-canva #view-seasons .chapter-block:nth-child(n){transform:none!important}
 body.v35-canva #foodWrap{grid-template-columns:1fr!important;padding:12px!important}
 body.v35-canva #foodWrap .home-card{border-bottom:1px dashed #d6c9b9!important}
 body.v35-canva #foodWrap .home-card:last-child{border-bottom:0!important}
 body.v35-canva #nycMapWrap{border-width:6px!important;margin-left:0!important;margin-right:0!important}
 body.v35-canva #nycMapWrap:after{display:none!important}
 body.v35-canva #view-words>.panel{background:repeating-linear-gradient(180deg,#fbf7ed 0,#fbf7ed 29px,#ddd3c3 30px)!important}
 body.v35-canva .v15-album-toolbar{overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none!important}
 body.v35-canva .v15-album-toolbar button{white-space:nowrap!important;min-width:max-content!important}
}
@media(prefers-reduced-motion:reduce){body.v35-canva .v15-photo-card{transition:none!important}}
`;

function injectStyle(){
 if($('#v36CanvaStyle'))return;
 const s=document.createElement('style');s.id='v36CanvaStyle';s.textContent=CSS;document.head.appendChild(s);
}

const LABELS={
 photoalbum:'EDITORIAL CONTACT SHEET',
 places:'TRAVEL MOODBOARD · NEW YORK',
 words:'A LETTER MADE OF OUR WORDS',
 food:'RECEIPT FROM OUR TABLE',
 photobooth:'FILM STRIP ARCHIVE',
 seasons:'YEAR IN REVIEW · SEASONS',
 calendar:'OUR TRAVEL NOTEBOOK'
};
function addLabel(view){
 const panel=$(`#view-${view}>.panel`);if(!panel||$('.v36-ref-label',panel))return;
 const label=document.createElement('div');label.className='v36-ref-label';label.textContent=LABELS[view]||'OUR ARCHIVE';
 panel.insertBefore(label,panel.firstChild);
 const h=panel.querySelector('h2');if(h)h.classList.add('v36-paper-title');
}
function decorateViews(){Object.keys(LABELS).forEach(addLabel)}

function decorateModal(){
 const modal=$('.modal');if(!modal)return;
 if(!$('.v36-modal-file',modal)){
  const head=$('.modal-head',modal)||modal.firstElementChild;
  const tag=document.createElement('div');tag.className='v36-modal-file';
  const d=modal.dataset?.date||'';tag.textContent=d?`MEMORY FILE · ${d}`:'MEMORY FILE · SIHYUN × GANGWON';
  if(head&&head.parentNode===modal)modal.insertBefore(tag,head);else modal.insertBefore(tag,modal.firstChild);
 }
}

function observeModal(){
 const overlay=$('#overlay');if(!overlay)return;
 const mo=new MutationObserver(()=>{if(overlay.classList.contains('open')||getComputedStyle(overlay).display!=='none')setTimeout(decorateModal,20)});
 mo.observe(overlay,{attributes:true,childList:true,subtree:true});
 document.addEventListener('click',e=>{if(e.target.closest('.day,.event-item,.firsts-item,.poster-card,[data-date]'))setTimeout(decorateModal,120)});
}

function onView(name){
 if(LABELS[name])setTimeout(()=>addLabel(name),40);
}

async function boot(){
 for(let i=0;i<160;i++){
  if(document.body&&typeof window.switchView==='function')break;
  await new Promise(r=>setTimeout(r,75));
 }
 document.body?.classList.add('v36-canva-internal');
 injectStyle();decorateViews();observeModal();
 window.addEventListener('v26:view',e=>onView(e.detail));
 const old=window.switchView;
 if(typeof old==='function'&&!old.__v36wrapped){
  const wrapped=function(name){const out=old.apply(this,arguments);onView(name);return out};
  wrapped.__v36wrapped=true;window.switchView=wrapped;
 }
}
boot();
})();