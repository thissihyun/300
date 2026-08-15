/* 300 DAYS WITH YOU — V28 CLICK HOTFIX */
(function(){
'use strict';
const FIX_DATE=d=>d==='2026-08-18'?'2026-08-19':d;
const sleep=n=>new Promise(r=>setTimeout(r,n));
const CSS=`
.v26-map-svg,.v26-const-svg,.v26-sky:before{pointer-events:none!important}
.v26-landmark,.v26-star,.v26-season-links button{pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important;-webkit-tap-highlight-color:rgba(178,92,97,.18)}
.v26-landmark{z-index:30!important}.v26-star{z-index:30!important}
.v28-fallback{position:fixed;inset:0;z-index:9999;background:rgba(28,24,20,.58);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:14px}
.v28-fallback-card{width:min(620px,100%);max-height:82vh;overflow:auto;background:#fffdf8;border:1px solid #d9cbb3;border-radius:24px 24px 18px 18px;padding:19px;box-shadow:0 30px 80px rgba(0,0,0,.3);animation:v28up .25s ease}
.v28-fallback-card .k{font:700 9px 'Gaegu',sans-serif;letter-spacing:.13em;color:#a4565c}.v28-fallback-card h3{font:italic 600 28px/1.08 'Playfair Display',serif;margin:7px 0}.v28-fallback-card p{font:11px/1.65 'Nanum Myeongjo',serif;color:#6e6255;white-space:pre-wrap}.v28-fallback-card button{min-height:42px;border:0;border-radius:12px;background:#332d27;color:#fff;padding:0 14px;font:700 10px 'Gaegu',sans-serif;margin-top:10px}@keyframes v28up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
`;
const style=document.createElement('style');style.id='v28ClickStyle';style.textContent=CSS;document.head.appendChild(style);
function globalValue(expr){try{return Function('return ('+expr+')')()}catch(e){return undefined}}
function eventInfo(date){try{return Function('d','return (typeof EVENTS!=="undefined"&&EVENTS[d])?EVENTS[d]:null')(date)}catch(e){return null}}
function pinList(){try{return Function('return typeof NYC_PINS!=="undefined"?NYC_PINS:[]')()||[]}catch(e){return[]}}
function annotate(){
  const pins=pinList();
  document.querySelectorAll('.v26-landmark').forEach((b,i)=>{const p=pins[i];if(p&&p.dates&&p.dates[0])b.dataset.v28Date=FIX_DATE(p.dates[0])});
  document.querySelectorAll('.v26-star[data-d],.v26-season-links [data-d]').forEach(b=>{b.dataset.v28Date=FIX_DATE(b.dataset.d)});
}
function closeFallback(){document.getElementById('v28Fallback')?.remove()}
function fallback(date){
  closeFallback();
  const ev=eventInfo(date),el=document.createElement('div');el.id='v28Fallback';el.className='v28-fallback';
  const title=ev?.title||'OUR MEMORY',story=ev?.story||'이 날짜의 기록을 열고 있어요.';
  el.innerHTML=`<div class="v28-fallback-card"><div class="k">${date} · OUR MEMORY</div><h3>${esc(title)}</h3><p>${esc(story)}</p><button type="button" id="v28Retry">OUR DAYS에서 보기 →</button></div>`;
  document.body.appendChild(el);el.addEventListener('click',e=>{if(e.target===el)closeFallback()});
  el.querySelector('#v28Retry').onclick=()=>{closeFallback();try{const fn=globalValue('switchView');if(typeof fn==='function')fn('calendar')}catch(e){}};
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function callOpen(date){
  date=FIX_DATE(date);if(!date)return false;
  const overlay=document.getElementById('overlay');
  try{
    let fn=window.openModal;
    if(typeof fn!=='function')fn=globalValue('openModal');
    if(typeof fn==='function')await Promise.race([Promise.resolve().then(()=>fn(date)),sleep(650)]);
  }catch(e){console.warn('[V28 openModal]',e)}
  await sleep(80);
  if(overlay?.classList.contains('open'))return true;
  try{
    const sheet=globalValue('v22OpenMemorySheet');
    if(typeof sheet==='function')await Promise.race([Promise.resolve().then(()=>sheet(date)),sleep(350)]);
  }catch(e){}
  await sleep(70);
  if(overlay?.classList.contains('open')||document.querySelector('.v22-memory-sheet.open,.v22-sheet.open,[data-date="'+date+'"].open'))return true;
  fallback(date);return false;
}
let lastAt=0,lastEl=null;
function targetDate(hit){return FIX_DATE(hit?.dataset?.v28Date||hit?.dataset?.d||'')}
function intercept(e){
  const hit=e.target?.closest?.('.v26-landmark,.v26-star[data-d],.v26-season-links [data-d]');
  if(!hit)return;
  annotate();const date=targetDate(hit);if(!date)return;
  const now=Date.now();if(lastEl===hit&&now-lastAt<500){e.preventDefault();e.stopPropagation();return}
  lastAt=now;lastEl=hit;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
  hit.animate?.([{opacity:.7},{opacity:1}],{duration:160});
  callOpen(date);
}
document.addEventListener('click',intercept,true);
document.addEventListener('pointerup',e=>{if(e.pointerType==='touch'||e.pointerType==='pen')intercept(e)},true);
const mo=new MutationObserver(()=>annotate());mo.observe(document.documentElement,{childList:true,subtree:true});
(async()=>{for(let i=0;i<240;i++){annotate();if(typeof globalValue('openModal')==='function')break;await sleep(100)}annotate();window.V28OpenMemory=callOpen})();
})();