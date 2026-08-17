/* 300 Days With You — final interaction polish */
(function(){
'use strict';
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function bindTrack(track){
  if(track.dataset.v11Drag==='1')return;track.dataset.v11Drag='1';
  let down=false,startX=0,startScroll=0,moved=false,pid=null;
  track.classList.add('v11-grab-track');
  track.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'||e.button!==0)return;
    down=true;moved=false;pid=e.pointerId;startX=e.clientX;startScroll=track.scrollLeft;track.classList.add('is-grabbing');
    try{track.setPointerCapture(pid)}catch(_e){}
  });
  track.addEventListener('pointermove',e=>{
    if(!down||e.pointerId!==pid)return;const dx=e.clientX-startX;if(Math.abs(dx)>5)moved=true;if(moved){e.preventDefault();track.scrollLeft=startScroll-dx}
  });
  const end=e=>{if(!down)return;down=false;track.classList.remove('is-grabbing');try{pid!=null&&track.releasePointerCapture(pid)}catch(_e){}pid=null;setTimeout(()=>{moved=false},0)};
  track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);track.addEventListener('lostpointercapture',()=>{down=false;track.classList.remove('is-grabbing')});
  track.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopImmediatePropagation()}},true);
  track.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&track.scrollWidth>track.clientWidth){e.preventDefault();track.scrollLeft+=e.deltaY}},{passive:false});
}
function run(){$$('.v1-film-track').forEach(bindTrack)}
const style=document.createElement('style');style.textContent=`
.v11-grab-track{cursor:grab;user-select:none;-webkit-user-select:none;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}.v11-grab-track.is-grabbing{cursor:grabbing;scroll-snap-type:none!important}.v11-grab-track img{pointer-events:none;-webkit-user-drag:none}
.v1-promise-sheet .v3-seed-cloud button{font-size:13px!important;line-height:1.45!important;padding:8px 11px!important;white-space:normal!important;word-break:keep-all!important}.v1-promise-sheet .v3-bucket-row .copy{font-size:14px!important;line-height:1.55!important;word-break:keep-all!important}.v1-promise-sheet h2{font-size:clamp(28px,5vw,36px)!important}
@media(max-width:600px){.v1-promise-sheet .v3-seed-cloud button{font-size:12px!important}.v1-promise-sheet .v3-bucket-row .copy{font-size:13px!important}.v1-film-track{touch-action:pan-x pan-y}}
`;document.head.appendChild(style);
let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;run()})}).observe(document.body,{childList:true,subtree:true});run();
})();
