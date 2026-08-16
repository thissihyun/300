/* 300 DAYS WITH YOU — V40 MEMORY SUBCARD CLICK FIX
   Handles date/memory cards inside OUR STORY, OUR FIRSTS and other archive pages.
   Visual design and stored data remain untouched. */
(function(){
'use strict';
if(window.__V40_MEMORY_CARD_CLICK__) return;
window.__V40_MEMORY_CARD_CLICK__=true;

const SELECTOR=[
  '.event-item','.firsts-item','.poster-card','.award-card','.v7-story-link',
  '.v15-photo-card','.result-item','.quote-card','.day:not(.empty)',
  '.v26-star[data-d]','.v26-season-links [data-d]','.v26-landmark',
  '[data-v28-date]','[data-v39-date]'
].join(',');

function globalValue(name){
  try{ if(typeof window[name] !== 'undefined') return window[name]; }catch(e){}
  try{ return (0,eval)(name); }catch(e){ return undefined; }
}
function validDate(s){
  const m=String(s||'').match(/20\d{2}-\d{2}-\d{2}/);
  return m ? m[0] : '';
}
function dateFrom(el){
  if(!el) return '';
  const ds=el.dataset||{};
  for(const k of ['date','d','v40Date','v28Date','v39Date','v35Date','v35Month']){
    const d=validDate(ds[k]); if(d) return d;
  }
  const raw=el.getAttribute?.('onclick')||'';
  let m=raw.match(/openModal\(\s*['\"](20\d{2}-\d{2}-\d{2})['\"]\s*\)/);
  if(m) return m[1];
  const inner=el.querySelector?.('[data-date],[data-d]');
  if(inner){
    const d=validDate(inner.dataset?.date||inner.dataset?.d); if(d) return d;
  }
  const txt=validDate(el.textContent); if(txt) return txt;
  return '';
}
function eventFor(date){
  try{
    const E=globalValue('EVENTS');
    return E && E[date] ? E[date] : null;
  }catch(e){ return null; }
}
function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function emergencyOpen(date){
  const overlay=document.getElementById('overlay');
  const modal=document.getElementById('modal');
  if(!overlay||!modal) return false;
  const ev=eventFor(date)||{};
  modal.dataset.date=date;
  modal.innerHTML=`<div class="modal-head"><button class="modal-close" type="button" data-v40-close>×</button><div class="modal-chapter">OUR MEMORY · ${esc(date)}</div><h2 class="modal-title">${esc(ev.title||'OUR MEMORY')}</h2></div><div class="modal-body"><div class="story">${esc(ev.story||'이 날짜의 기록입니다.')}</div></div>`;
  overlay.classList.add('open');
  modal.querySelector('[data-v40-close]')?.addEventListener('click',()=>overlay.classList.remove('open'));
  return true;
}
async function openMemory(date){
  if(!date) return false;
  const overlay=document.getElementById('overlay');
  const fn=globalValue('openModal');
  if(typeof fn==='function'){
    try{ await Promise.resolve(fn(date)); }catch(e){ console.warn('[V40 openModal]',date,e); }
    if(overlay?.classList.contains('open')) return true;
  }
  if(date!=='2026-08-18' && typeof window.V28OpenMemory==='function'){
    try{ await Promise.resolve(window.V28OpenMemory(date)); }catch(e){}
    if(overlay?.classList.contains('open')||document.querySelector('.v28-fallback')) return true;
  }
  return emergencyOpen(date);
}

let lastEl=null,lastAt=0;
function processEvent(e){
  if(e.button!==undefined && e.button>0) return false;
  const t=e.target;
  if(!t?.closest) return false;
  if(t.closest('#overlay,#v16TagModal,#v8Inbox,#v14MemorySearch')) return false;
  if(t.closest('button,input,textarea,select,a,[contenteditable="true"]')) return false;
  const card=t.closest(SELECTOR);
  if(!card) return false;
  const active=card.closest('.view');
  if(active && !active.classList.contains('active')) return false;
  const date=dateFrom(card);
  if(!date) return false;
  const now=Date.now();
  e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
  if(lastEl===card && now-lastAt<520) return true;
  lastEl=card;lastAt=now;
  card.animate?.([{transform:'scale(.985)'},{transform:'scale(1)'}],{duration:140});
  openMemory(date);
  return true;
}

const style=document.createElement('style');
style.id='v40MemoryClickStyle';
style.textContent=`
.event-item,.firsts-item,.poster-card,.award-card,.v7-story-link,.v15-photo-card,.result-item,.quote-card,.day:not(.empty){pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important;position:relative!important}
.event-item:before,.event-item:after,.firsts-item:before,.firsts-item:after,.poster-card:before,.poster-card:after,.award-card:before,.award-card:after,.v7-story-link:before,.v7-story-link:after{pointer-events:none!important}
`;
document.head.appendChild(style);

/* Desktop/mouse: pointerdown is early enough to beat later capture bridges.
   Touch/pen: pointerup avoids opening while the user is only trying to scroll. */
document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.pointerType!=='pen')processEvent(e)},true);
document.addEventListener('pointerup',e=>{if(e.pointerType==='touch'||e.pointerType==='pen')processEvent(e)},true);
document.addEventListener('click',e=>{if(!e.detail)processEvent(e)},true);
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ') return;
  const card=e.target?.closest?.(SELECTOR); if(!card) return;
  const date=dateFrom(card); if(!date) return;
  e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
  openMemory(date);
},true);

function annotate(){
  document.querySelectorAll(SELECTOR).forEach(el=>{
    const d=dateFrom(el);
    if(d){ el.dataset.v40Date=d; if(!el.hasAttribute('tabindex')) el.tabIndex=0; if(!el.hasAttribute('role')) el.setAttribute('role','button'); }
  });
}
const mo=new MutationObserver(()=>requestAnimationFrame(annotate));
if(document.body) mo.observe(document.body,{childList:true,subtree:true});
else document.addEventListener('DOMContentLoaded',()=>mo.observe(document.body,{childList:true,subtree:true}),{once:true});
annotate();
window.addEventListener('v26:view',()=>setTimeout(annotate,40));
})();