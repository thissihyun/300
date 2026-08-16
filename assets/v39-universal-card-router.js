/* 300 DAYS WITH YOU — V39 UNIVERSAL CARD ROUTER
   Fixes HOME / OUR STORY / OUR FIRSTS / SPECIALS navigation in one place.
   Visual design and photo data are untouched. */
(function(){
'use strict';
if(window.__V39_UNIVERSAL_ROUTER__) return;
window.__V39_UNIVERSAL_ROUTER__=true;

const RENDERERS={
  calendar:'renderCalendar',timeline:'renderChapters',firsts:'renderFirsts',words:'renderWordCloud',
  favorites:'renderFavorites',liked:'renderLikedDays',numbers:'renderStats',places:'renderPlaces',
  constellation:'renderConstellation',seasons:'renderSeasons',food:'renderFood',posters:'renderPosters',
  photobooth:'renderBooth',funny:'renderFunny',thankyou:'renderThankYou',awards:'renderAwards',
  lookback:'renderLookback',future:'renderFuture',photoalbum:'v15RenderAlbum'
};

function g(name){
  try{ if(typeof window[name]==='function') return window[name]; }catch(e){}
  try{ return (0,eval)(name); }catch(e){ return null; }
}
function renderFor(view){
  const fn=g(RENDERERS[view]);
  if(typeof fn!=='function') return;
  try{
    if(view==='liked') fn(window.v22LikedTab);
    else fn();
  }catch(e){ console.warn('[V39 render]',view,e); }
}
function directView(view){
  const target=document.getElementById('view-'+view);
  if(!target) return false;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  target.classList.add('active');
  document.querySelectorAll('#mainnav [data-view],#v22BottomTabs [data-view]').forEach(b=>{
    b.classList.toggle('active',b.dataset.view===view);
  });
  renderFor(view);
  try{ window.dispatchEvent(new CustomEvent('v26:view',{detail:view})); }catch(e){}
  try{ window.scrollTo({top:0,behavior:'auto'}); }catch(e){ try{window.scrollTo(0,0)}catch(_){} }
  return true;
}
function openView(view){
  if(!view || !document.getElementById('view-'+view)) return false;
  const sw=g('switchView');
  if(typeof sw==='function'){
    try{ sw(view); }catch(e){ console.warn('[V39 switchView]',view,e); }
    if(document.getElementById('view-'+view)?.classList.contains('active')) return true;
  }
  return directView(view);
}
function openDate(date){
  if(!date) return false;
  const fn=g('openModal');
  if(typeof fn==='function'){
    try{ fn(date); return true; }catch(e){ console.warn('[V39 openModal]',date,e); }
  }
  if(typeof window.V28OpenMemory==='function'){
    try{ window.V28OpenMemory(date); return true; }catch(e){}
  }
  return false;
}
function inlineRoute(el){
  const raw=el?.getAttribute?.('onclick')||'';
  let m=raw.match(/switchView\(\s*['\"]([^'\"]+)['\"]\s*\)/);
  if(m) return {type:'view',value:m[1]};
  m=raw.match(/openModal\(\s*['\"]([^'\"]+)['\"]\s*\)/);
  if(m) return {type:'date',value:m[1]};
  return null;
}
function routeFor(el){
  if(!el) return null;
  if(el.matches('#mainnav [data-view],#v22BottomTabs [data-view]')) return {type:'view',value:el.dataset.view};
  if(el.dataset.v39View) return {type:'view',value:el.dataset.v39View};
  if(el.dataset.v34) return {type:'view',value:el.dataset.v34};
  if(el.dataset.view && (el.classList.contains('home-card')||el.classList.contains('v7-hub-card'))) return {type:'view',value:el.dataset.view};
  if(el.dataset.v35Date) return {type:'date',value:el.dataset.v35Date};
  if(el.dataset.v35Month) return {type:'date',value:el.dataset.v35Month};
  return inlineRoute(el);
}
function annotate(){
  document.querySelectorAll('#view-home .home-card[onclick*="switchView"],#view-specials .v7-hub-card[onclick*="switchView"]').forEach(el=>{
    const r=inlineRoute(el); if(r?.type==='view') el.dataset.v39View=r.value;
  });
  document.querySelectorAll('#view-specials .v34-shelf-btn').forEach(el=>{ if(el.dataset.v34) el.dataset.v39View=el.dataset.v34; });
  document.querySelectorAll('#view-home .home-card,#view-specials .v7-hub-card,#view-specials .v34-shelf-btn').forEach(el=>{
    if(routeFor(el)){ el.setAttribute('role','button'); if(!el.hasAttribute('tabindex')) el.tabIndex=0; }
  });
}

const SELECTOR=[
  '#mainnav [data-view]','#v22BottomTabs [data-view]',
  '#view-home .home-card','#view-specials .v7-hub-card','#view-specials .v34-shelf-btn',
  '#view-home .v7-hero-actions button','.v35-movie-card[data-v35-date]','.v35-month-card[data-v35-month]'
].join(',');

let lastEl=null,lastAt=0;
function activate(el,e){
  const route=routeFor(el); if(!route) return false;
  const now=Date.now();
  if(lastEl===el && now-lastAt<420) return true;
  lastEl=el;lastAt=now;
  if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); }
  if(route.type==='view') return openView(route.value);
  if(route.type==='date') return openDate(route.value);
  return false;
}
function hit(e){
  if(e.defaultPrevented && e.type==='pointerdown') return null;
  if(e.button!==undefined && e.button>0) return null;
  const t=e.target;
  if(!t?.closest) return null;
  const el=t.closest(SELECTOR);
  if(!el) return null;
  if(el.id==='v22MoreTabBtn') return null;
  return el;
}
function onPointerDown(e){ const el=hit(e); if(el) activate(el,e); }
function onClick(e){ const el=hit(e); if(el) activate(el,e); }
function onKey(e){
  if(e.key!=='Enter'&&e.key!==' ') return;
  const el=e.target?.closest?.(SELECTOR); if(el) activate(el,e);
}

const st=document.createElement('style');
st.id='v39UniversalRouterStyle';
st.textContent=`
.panel:before,.panel:after,.home-card:before,.home-card:after,.v7-hub-card:before,.v7-hub-card:after,.v35-movie-card:before,.v35-movie-card:after,.v35-month-card:before,.v35-month-card:after{pointer-events:none!important}
#mainnav [data-view],#v22BottomTabs [data-view],#view-home .home-card,#view-specials .v7-hub-card,#view-specials .v34-shelf-btn,#view-home .v7-hero-actions button,.v35-movie-card[data-v35-date],.v35-month-card[data-v35-month]{pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important;position:relative!important;z-index:60!important}
#view-home .home-card>*,#view-specials .v7-hub-card>*,#view-specials .v34-shelf-btn>*,.v35-movie-card>*,.v35-month-card>*{pointer-events:none!important}
`;
document.head.appendChild(st);

document.addEventListener('pointerdown',onPointerDown,true);
document.addEventListener('click',onClick,true);
document.addEventListener('keydown',onKey,true);

function boot(){
  annotate();
  if(!document.documentElement.__v39Observer){
    const mo=new MutationObserver(()=>requestAnimationFrame(annotate));
    mo.observe(document.body||document.documentElement,{childList:true,subtree:true});
    document.documentElement.__v39Observer=mo;
  }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
window.addEventListener('v26:view',()=>setTimeout(annotate,20));
})();
