/* 300 DAYS WITH YOU — V38 SPECIAL CLICK FIX
   One routing layer for every SPECIAL card. No visual redesign here. */
(function(){
'use strict';
if(window.__V38_SPECIAL_CLICK__) return;
window.__V38_SPECIAL_CLICK__=true;

const MAIN_ROUTES=['firsts','places','posters','constellation','words','seasons','food','numbers','photobooth','awards','favorites','liked'];
const RENDERERS={
  firsts:'renderFirsts',places:'renderPlaces',posters:'renderPosters',constellation:'renderConstellation',
  words:'renderWordCloud',seasons:'renderSeasons',food:'renderFood',numbers:'renderStats',photobooth:'renderBooth',
  awards:'renderAwards',favorites:'renderFavorites',liked:'renderLikedDays',funny:'renderFunny',thankyou:'renderThankYou',
  lookback:'renderLookback',search:'renderSearch'
};

function globalFn(name){
  try{return Function('n','try{return (0,eval)(n)}catch(e){return null}')(name)}catch(e){return null}
}
function annotate(){
  const root=document.getElementById('view-specials');
  if(!root) return;
  root.querySelectorAll('.v7-hub-card').forEach((card,i)=>{
    if(!card.dataset.v38View){
      const raw=card.getAttribute('onclick')||'';
      const m=raw.match(/switchView\(\s*['\"]([^'\"]+)['\"]\s*\)/);
      card.dataset.v38View=(m&&m[1])||MAIN_ROUTES[i]||'';
    }
    card.removeAttribute('onclick');
    card.onclick=null;
    card.setAttribute('role','button');
    card.tabIndex=0;
  });
  root.querySelectorAll('.v34-shelf-btn').forEach(card=>{
    card.dataset.v38View=card.dataset.v34||card.dataset.view||card.dataset.v38View||'';
    card.removeAttribute('onclick');
    card.onclick=null;
    card.setAttribute('role','button');
    card.tabIndex=0;
  });
}
function fallbackOpen(view){
  const target=document.getElementById('view-'+view);
  if(!target) return false;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  target.classList.add('active');
  document.querySelectorAll('#mainnav [data-view],#v22BottomTabs [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  const renderer=globalFn(RENDERERS[view]);
  if(typeof renderer==='function'){
    try{ view==='liked' ? renderer(window.v22LikedTab) : renderer(); }catch(e){ console.warn('[V38 renderer]',view,e); }
  }
  try{window.dispatchEvent(new CustomEvent('v26:view',{detail:view}));}catch(e){}
  try{window.scrollTo({top:0,behavior:'auto'});}catch(e){window.scrollTo(0,0)}
  return true;
}
function openView(view){
  if(!view) return false;
  const target=document.getElementById('view-'+view);
  if(!target) return false;
  const sw=globalFn('switchView');
  if(typeof sw==='function'){
    try{sw(view);}catch(e){console.warn('[V38 switchView]',view,e)}
    if(target.classList.contains('active')) return true;
  }
  return fallbackOpen(view);
}
function routeOf(card){
  if(!card) return '';
  if(card.dataset.v38View) return card.dataset.v38View;
  if(card.dataset.v34) return card.dataset.v34;
  if(card.dataset.view) return card.dataset.view;
  const raw=card.getAttribute('onclick')||'';
  const m=raw.match(/switchView\(\s*['\"]([^'\"]+)['\"]\s*\)/);
  return m&&m[1]||'';
}
let lastEl=null,lastAt=0;
function intercept(e){
  const root=document.getElementById('view-specials');
  if(!root||!root.classList.contains('active')) return;
  const card=e.target&&e.target.closest&&e.target.closest('#view-specials .v7-hub-card,#view-specials .v34-shelf-btn');
  if(!card) return;
  annotate();
  const view=routeOf(card);
  if(!view) return;
  const now=Date.now();
  e.preventDefault();
  e.stopPropagation();
  if(e.stopImmediatePropagation)e.stopImmediatePropagation();
  if(lastEl===card&&now-lastAt<550) return;
  lastEl=card;lastAt=now;
  openView(view);
}
function keyIntercept(e){
  if(e.key!=='Enter'&&e.key!==' ') return;
  const root=document.getElementById('view-specials');
  if(!root||!root.classList.contains('active')) return;
  const card=e.target&&e.target.closest&&e.target.closest('#view-specials .v7-hub-card,#view-specials .v34-shelf-btn');
  if(!card) return;
  e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
  annotate();openView(routeOf(card));
}

const style=document.createElement('style');
style.id='v38SpecialClickStyle';
style.textContent=`
#view-specials .v7-hub-card,#view-specials .v34-shelf-btn{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation!important;position:relative!important;z-index:20!important}
#view-specials .v7-hub-card>*,#view-specials .v34-shelf-btn>*{pointer-events:none!important}
#view-specials .v7-hub-grid,#view-specials .v34-shelf-grid{position:relative!important;z-index:10!important}
`;
document.head.appendChild(style);

document.addEventListener('click',intercept,true);
document.addEventListener('pointerup',e=>{if(e.pointerType==='touch'||e.pointerType==='pen')intercept(e)},true);
document.addEventListener('keydown',keyIntercept,true);

const boot=()=>{
  annotate();
  const root=document.getElementById('view-specials');
  if(root&&!root.__v38Observer){
    root.__v38Observer=new MutationObserver(()=>requestAnimationFrame(annotate));
    root.__v38Observer.observe(root,{childList:true,subtree:true});
  }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('v26:view',e=>{if(e.detail==='specials')setTimeout(boot,30)});
})();
