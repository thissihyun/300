/* 300 DAYS WITH YOU — V37 SPECIALS CLICK FIX + TRAVEL MAGAZINE THEMES
   Canva references used as visual inspiration only:
   - White Collage Travel Book Presentation
   - Red Beige and Black Playful Movie Scrapbook
   - Brown Scrapbook My Favorite Things
   Real photos remain locked source images; this layer only changes framing/layout. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const CSS=String.raw`
/* ---------- SPECIALS: click reliability first ---------- */
body.v35-canva #view-specials .v7-hub-card,
body.v35-canva #view-specials .v34-shelf-btn{
  position:relative!important;z-index:2!important;cursor:pointer!important;touch-action:manipulation!important;
  -webkit-user-select:none!important;user-select:none!important;pointer-events:auto!important;
}
body.v35-canva #view-specials .v7-hub-card>*,
body.v35-canva #view-specials .v34-shelf-btn>*{pointer-events:none!important}
body.v35-canva #view-specials .v7-hub-card:before,
body.v35-canva #view-specials .v7-hub-card:after,
body.v35-canva #view-specials .v34-shelf-btn:before,
body.v35-canva #view-specials .v34-shelf-btn:after{pointer-events:none!important}
body.v35-canva #view-specials .v7-hub-card:active,
body.v35-canva #view-specials .v34-shelf-btn:active{transform:scale(.985)!important}
body.v35-canva #view-specials .v37-special-ticket{
  display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 0 18px;
  padding:10px 12px;background:#28231f;color:#f7efe2;border:1px solid #171411;
  font:700 9px/1.2 'Gaegu',cursive;letter-spacing:.13em;text-transform:uppercase;
}
body.v35-canva #view-specials .v37-special-ticket span:last-child{color:#e3b25d}
body.v35-canva #view-specials .v7-hub-grid{position:relative;z-index:1}
body.v35-canva #view-specials .v7-hub-card:nth-child(3n+1){border-top:6px solid #a74b46!important}
body.v35-canva #view-specials .v7-hub-card:nth-child(3n+2){border-top:6px solid #292521!important}
body.v35-canva #view-specials .v7-hub-card:nth-child(3n){border-top:6px solid #c8a45d!important}

/* ---------- MOVIE SCRAPBOOK: posters / dates we'd live again ---------- */
body.v35-canva #view-posters>.panel{
  background:#292521!important;color:#f8efe2!important;border:1px solid #181512!important;
  border-radius:1px!important;padding:28px!important;box-shadow:0 22px 55px rgba(20,16,13,.18)!important
}
body.v35-canva #view-posters>.panel:before,
body.v35-canva #view-posters>.panel:after{
  content:''!important;display:block!important;position:absolute!important;left:0!important;right:0!important;height:9px!important;
  background:repeating-linear-gradient(90deg,#efe1c9 0 15px,transparent 15px 24px)!important;opacity:.68!important;pointer-events:none!important
}
body.v35-canva #view-posters>.panel:before{top:5px!important}body.v35-canva #view-posters>.panel:after{top:auto!important;bottom:5px!important}
body.v35-canva #view-posters h2{color:#fff8ec!important;font-size:clamp(34px,5vw,58px)!important;line-height:.93!important;margin-top:10px!important}
body.v35-canva #view-posters .desc{color:#d9cbbb!important;max-width:650px!important}
body.v35-canva #view-posters .poster-grid{gap:14px!important}
body.v35-canva #view-posters .poster-card{border-radius:0!important;box-shadow:0 10px 24px rgba(0,0,0,.27)!important}

/* ---------- BROWN FAVORITE THINGS: favorites / liked ---------- */
body.v35-canva #view-favorites>.panel,
body.v35-canva #view-liked>.panel{
  background:#d5c1a4!important;border:1px solid #ad9270!important;border-radius:1px!important;padding:28px!important;
  box-shadow:0 18px 42px rgba(64,48,35,.12)!important
}
body.v35-canva #view-favorites>.panel:before,
body.v35-canva #view-liked>.panel:before{display:none!important}
body.v35-canva #view-favorites h2,
body.v35-canva #view-liked h2{font-size:clamp(34px,5vw,54px)!important;color:#30271f!important;line-height:.95!important}
body.v35-canva #view-favorites .event-item,
body.v35-canva #view-liked .event-item{
  position:relative!important;border-radius:0!important;background:#fff9ed!important;border:1px solid #c6b290!important;
  padding:15px 15px!important;box-shadow:5px 7px 0 rgba(86,65,45,.08)!important;margin-bottom:9px!important
}
body.v35-canva #view-favorites .event-item:nth-child(odd),
body.v35-canva #view-liked .event-item:nth-child(odd){transform:rotate(-.18deg)}
body.v35-canva #view-favorites .event-item:nth-child(even),
body.v35-canva #view-liked .event-item:nth-child(even){transform:rotate(.18deg)}
body.v35-canva #view-favorites .event-item:before,
body.v35-canva #view-liked .event-item:before{content:'';position:absolute;left:28px;top:-6px;width:54px;height:12px;background:rgba(236,220,186,.78);transform:rotate(-2deg);pointer-events:none}

/* ---------- TRAVEL BOOK: date modal magazine identities ---------- */
body.v35-canva .modal .v37-mag-head{
  position:relative;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:end;
  padding:17px 22px 15px;border-bottom:1px solid var(--v37-line,#cdbda8);overflow:hidden
}
body.v35-canva .modal .v37-mag-kicker{font:700 9px/1.2 'Gaegu',cursive;letter-spacing:.16em;text-transform:uppercase;color:var(--v37-accent,#9a5149)}
body.v35-canva .modal .v37-mag-title{font:italic 600 clamp(25px,5vw,38px)/.96 'Playfair Display',serif;letter-spacing:-.025em;color:var(--v37-ink,#2c2722);margin-top:5px}
body.v35-canva .modal .v37-mag-sub{font:11px/1.5 'Nanum Myeongjo',serif;color:var(--v37-soft,#74695e);margin-top:7px;max-width:440px}
body.v35-canva .modal .v37-mag-stamp{
  min-width:82px;min-height:52px;display:grid;place-items:center;padding:7px;border:2px solid color-mix(in srgb,var(--v37-accent,#9a5149) 55%,transparent);
  color:var(--v37-accent,#9a5149);background:rgba(255,255,255,.5);font:700 8px/1.15 'Gaegu',cursive;letter-spacing:.08em;text-align:center;transform:rotate(-6deg)
}
body.v35-canva .modal.v37-theme-nyc{--v37-accent:#a84e49;--v37-ink:#251f1a;--v37-soft:#6f6255;--v37-line:#cdbda8;background:#f6efe3!important}
body.v35-canva .modal.v37-theme-nyc .v37-mag-head{background:linear-gradient(90deg,#f7efe0 0 70%,#e7d5b8 70%)}
body.v35-canva .modal.v37-theme-nyc.v37-central-park .v37-mag-head{background:linear-gradient(90deg,#f4efe3 0 66%,#d9dfc9 66%)}
body.v35-canva .modal.v37-theme-nyc.v37-central-park .v37-mag-stamp{border-radius:50%;color:#66704e;border-color:#84906d}
body.v35-canva .modal.v37-theme-west{--v37-accent:#c18237;--v37-ink:#263846;--v37-soft:#6b675d;--v37-line:#d4b985;background:#f7ecd6!important}
body.v35-canva .modal.v37-theme-west .v37-mag-head{background:linear-gradient(110deg,#f2c97e 0 38%,#f8f0df 38% 73%,#a9bfd1 73%)}
body.v35-canva .modal.v37-theme-west .v37-mag-stamp{border-radius:50%;transform:rotate(7deg);background:#fff7e9}
body.v35-canva .modal.v37-theme-korea{--v37-accent:#587b98;--v37-ink:#253342;--v37-soft:#657383;--v37-line:#b8c7d1;background:#f2f5f5!important}
body.v35-canva .modal.v37-theme-korea .v37-mag-head{background:linear-gradient(90deg,#eef4f5 0 68%,#d8e4e8 68%)}
body.v35-canva .modal.v37-theme-korea .v37-mag-stamp{border-radius:1px;transform:rotate(-2deg);background:#f9fcfc}
body.v35-canva .modal.v37-theme-long{--v37-accent:#a25256;--v37-ink:#293746;--v37-soft:#697381;--v37-line:#bdc9d3;background:#f3f5f6!important}
body.v35-canva .modal.v37-theme-long .v37-mag-head{background:repeating-linear-gradient(135deg,#f7f8f8 0 12px,#e8eef2 12px 24px)}
body.v35-canva .modal.v37-theme-long .v37-mag-head:after{content:'';position:absolute;left:0;right:0;bottom:0;height:5px;background:repeating-linear-gradient(90deg,#a25256 0 20px,#f5f5f3 20px 40px,#587b98 40px 60px,#f5f5f3 60px 80px)}
body.v35-canva .modal.v37-theme-long .v37-mag-stamp{border-radius:999px;transform:rotate(-5deg);background:#fff}
body.v35-canva .modal.v37-theme-travel{--v37-accent:#8e7356;--v37-ink:#2e2923;--v37-soft:#766b61;--v37-line:#cdbda8;background:#f6efe5!important}
body.v35-canva .modal.v37-theme-travel .v37-mag-head{background:#eee2cf}

/* Keep actual photographs fully visible inside themed modals. */
body.v35-canva .modal[class*="v37-theme-"] img{object-fit:contain!important;background:#eee8df!important}
body.v35-canva .modal[class*="v37-theme-"] .photo-grid img,
body.v35-canva .modal[class*="v37-theme-"] .gallery img{border:8px solid #fff!important;box-shadow:5px 8px 18px rgba(43,34,27,.11)!important}
body.v35-canva .modal.v37-theme-west .photo-grid img,body.v35-canva .modal.v37-theme-west .gallery img{background:#f4e3c5!important}
body.v35-canva .modal.v37-theme-korea .photo-grid img,body.v35-canva .modal.v37-theme-korea .gallery img,
body.v35-canva .modal.v37-theme-long .photo-grid img,body.v35-canva .modal.v37-theme-long .gallery img{background:#e7edf0!important}

@media(max-width:720px){
  body.v35-canva #view-specials .v37-special-ticket{font-size:8px;padding:9px 10px}
  body.v35-canva #view-posters>.panel,body.v35-canva #view-favorites>.panel,body.v35-canva #view-liked>.panel{padding:22px 15px!important}
  body.v35-canva .modal .v37-mag-head{grid-template-columns:1fr;padding:15px 16px 13px;gap:10px}
  body.v35-canva .modal .v37-mag-stamp{justify-self:start;min-width:76px;min-height:38px}
}
`;

function style(){
  if($('#v37SpecialTravelStyle'))return;
  const s=document.createElement('style');s.id='v37SpecialTravelStyle';s.textContent=CSS;document.head.appendChild(s);
}
function safeSwitch(view){
  try{
    const fn=(typeof window.switchView==='function')?window.switchView:(typeof switchView==='function'?switchView:null);
    if(fn)fn(view);
  }catch(e){console.warn('[v37 specials]',e)}
}
function extractView(card){
  if(!card)return null;
  if(card.dataset.v34)return card.dataset.v34;
  if(card.dataset.view)return card.dataset.view;
  const raw=card.getAttribute('onclick')||'';
  const m=raw.match(/switchView\(\s*['"]([^'"]+)['"]\s*\)/);
  return m?m[1]:null;
}
function hardenSpecials(){
  const root=$('#view-specials');if(!root)return;
  if(!root.dataset.v37ClickBound){
    root.dataset.v37ClickBound='1';
    root.addEventListener('click',(e)=>{
      const card=e.target.closest('.v7-hub-card,.v34-shelf-btn');
      if(!card||!root.contains(card))return;
      const view=extractView(card);if(!view)return;
      e.preventDefault();e.stopPropagation();
      safeSwitch(view);
    },true);
    root.addEventListener('keydown',(e)=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      const card=e.target.closest('.v7-hub-card,.v34-shelf-btn');
      if(!card)return;
      const view=extractView(card);if(!view)return;
      e.preventDefault();safeSwitch(view);
    });
  }
  $$('.v7-hub-card,.v34-shelf-btn',root).forEach(card=>{
    card.setAttribute('role','button');
    if(!card.hasAttribute('tabindex'))card.tabIndex=0;
  });
  const panel=$(':scope>.panel',root);
  if(panel&&!$('.v37-special-ticket',panel)){
    const desc=$('.desc',panel);
    const ticket=document.createElement('div');ticket.className='v37-special-ticket';
    ticket.innerHTML='<span>BONUS FEATURES · SELECT A CHAPTER</span><span>SIHYUN × GANGWON</span>';
    (desc||$('h2',panel))?.insertAdjacentElement('afterend',ticket);
  }
}

function themeFor(date,title){
  const t=(title||'').toLowerCase();
  const central=/central park|센트럴/.test(t);
  if(date>='2025-12-21'&&date<='2026-01-01')return {key:'west',central:false,k:'WEST COAST ROAD BOOK',title:'GO WEST, TOGETHER',sub:'LA · VEGAS · GRAND CANYON · YOSEMITE · SF · SAN DIEGO',stamp:'ROAD TRIP\n2025—26'};
  const korea=((date>='2026-01-03'&&date<='2026-01-18')||(date>='2026-03-12'&&date<='2026-03-22'));
  if(korea)return {key:'korea',central:false,k:'KOREA EDITION',title:'BACK HOME, STILL US',sub:'SUWON · SEOUL · KAIST · BUSAN',stamp:'KOREA\nFIELD NOTES'};
  if(date>='2026-01-19')return {key:'long',central:false,k:'LONG DISTANCE ISSUE',title:'SAME US, TWO PLACES',sub:'NEW YORK ↔ KOREA · calls · study with me · everyday love',stamp:'NYC ↔ KOREA'};
  const nyc=/central park|moma|governors|brooklyn|nba|rooftop|ice skating|bryant|rockefeller|jazz|raku|washington|broom|gatsby|new york|nyc|met cloisters|paulson|beacon|palladium/.test(t);
  if(nyc||date<='2025-12-20')return {key:'nyc',central,k:central?'CENTRAL PARK ISSUE':'NEW YORK FIELD NOTES',title:central?'AUTUMN IN CENTRAL PARK':'NEW YORK, WHERE WE STARTED',sub:central?'leaves · long walks · the city turning gold':'downtown · museums · parks · winter lights · our beginning',stamp:central?'CENTRAL\nPARK':'NEW YORK\n2025'};
  return {key:'travel',central:false,k:'TRAVEL BOOK',title:'COLLECTING MOMENTS',sub:'every journey changed something',stamp:'OUR\nTRIP'};
}
function currentModalTitle(modal){
  return ($('.modal-title',modal)?.textContent||$('h2',modal)?.textContent||'').trim();
}
function decorateModal(){
  const modal=$('#modal');if(!modal)return;
  const date=modal.dataset.date||'';
  if(!date)return;
  const title=currentModalTitle(modal);
  const theme=themeFor(date,title);
  ['nyc','west','korea','long','travel'].forEach(k=>modal.classList.remove('v37-theme-'+k));
  modal.classList.toggle('v37-central-park',!!theme.central);
  modal.classList.add('v37-theme-'+theme.key);
  let head=$('.v37-mag-head',modal);
  if(!head){
    head=document.createElement('div');head.className='v37-mag-head';
    modal.insertBefore(head,modal.firstChild);
  }
  head.innerHTML=`<div><div class="v37-mag-kicker">${theme.k}</div><div class="v37-mag-title">${theme.title}</div><div class="v37-mag-sub">${theme.sub}</div></div><div class="v37-mag-stamp">${theme.stamp.replace(/\n/g,'<br>')}</div>`;
}
function observeModal(){
  const modal=$('#modal');if(!modal)return;
  const run=()=>requestAnimationFrame(decorateModal);
  const mo=new MutationObserver(run);
  mo.observe(modal,{childList:true,subtree:true,attributes:true,attributeFilter:['data-date','class']});
  run();
}
function polishExtraViews(){
  const posters=$('#view-posters>.panel');
  if(posters&&!$('.v36-ref-label',posters)){
    const badge=document.createElement('div');badge.className='v36-ref-label';badge.textContent='MOVIE SCRAPBOOK · FEATURE FILMS';
    posters.insertBefore(badge,posters.firstChild);
  }
  ['favorites','liked'].forEach(v=>{
    const p=$(`#view-${v}>.panel`);if(!p||$('.v36-ref-label',p))return;
    const badge=document.createElement('div');badge.className='v36-ref-label';badge.textContent='MY FAVORITE THINGS · SCRAPBOOK';
    p.insertBefore(badge,p.firstChild);
  });
}
function bootView(name){
  if(name==='specials')setTimeout(hardenSpecials,60);
  if(name==='posters'||name==='favorites'||name==='liked')setTimeout(polishExtraViews,60);
}
async function boot(){
  style();
  for(let i=0;i<150;i++){
    if($('#view-specials')&&$('#modal'))break;
    await new Promise(r=>setTimeout(r,60));
  }
  hardenSpecials();polishExtraViews();observeModal();
  window.addEventListener('v26:view',e=>bootView(e.detail));
  // Re-harden after dynamic Special shelf re-renders.
  const root=$('#view-specials');
  if(root)new MutationObserver(()=>hardenSpecials()).observe(root,{childList:true,subtree:true});
}
boot();
})();
