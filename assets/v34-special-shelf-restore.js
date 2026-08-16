/* 300 DAYS WITH YOU — V34 SPECIAL EXTRAS ONLY */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
/* Keep only features that are NOT already represented in the main Special grid. */
const ITEMS=[
 ['photobooth','▥','Photobooth Archive','인생네컷과 포토부스 기록'],
 ['favorites','♡','Our Favorites','저장해둔 기억'],
 ['liked','♥','Days We Both Loved','둘이 함께 좋아한 날'],
 ['funny','☺','Funny & Inside Jokes','웃긴 순간과 둘만의 말'],
 ['thankyou','✦','300 Days of 고마워','과거 카톡 속 고마움'],
 ['lookback','↗','Before / Came True','말했던 미래와 실제가 된 날'],
 ['search','⌕','Search Our Story','날짜·장소·카톡 검색']
];
const CSS=`
#view-specials .v27-shelf{display:none!important}
.v34-shelf{margin-top:24px;padding-top:20px;border-top:1px solid var(--line)}
.v34-shelf-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:12px}
.v34-shelf-head .k{font:700 10px/1 'Gaegu',sans-serif;letter-spacing:.13em;color:var(--rose-deep)}
.v34-shelf-head h3{font:italic 600 27px/1.08 'Playfair Display',serif;margin:5px 0 0;color:var(--ink)}
.v34-shelf-head p{font:12px/1.55 'Nanum Myeongjo',serif;color:var(--ink-soft);margin:0;max-width:430px}
.v34-shelf-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.v34-shelf-btn{min-height:94px;border:1px solid var(--line);border-radius:15px;background:#fffdf8;padding:12px;text-align:left;color:var(--ink);cursor:pointer;transition:.18s ease}
.v34-shelf-btn:hover{transform:translateY(-2px);border-color:#bb8584;box-shadow:0 9px 20px rgba(54,43,35,.07)}
.v34-shelf-btn .ico{display:block;font-size:18px;margin-bottom:8px}
.v34-shelf-btn b{display:block;font:italic 600 16px/1.1 'Playfair Display',serif}
.v34-shelf-btn span:last-child{display:block;margin-top:5px;font:11px/1.4 'Nanum Myeongjo',serif;color:var(--ink-soft)}
@media(max-width:900px){.v34-shelf-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:720px){.v34-shelf{margin-top:18px;padding-top:16px}.v34-shelf-head{display:block}.v34-shelf-head p{margin-top:6px;font-size:11.5px}.v34-shelf-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.v34-shelf-btn{min-height:96px;padding:11px}.v34-shelf-btn b{font-size:15px}.v34-shelf-btn span:last-child{font-size:10.5px}}
`;
function style(){if($('#v34ShelfStyle'))return;const s=document.createElement('style');s.id='v34ShelfStyle';s.textContent=CSS;document.head.appendChild(s)}
function render(){
 const panel=$('#view-specials>.panel'); if(!panel)return;
 $('.v34-shelf',panel)?.remove();
 const shelf=document.createElement('section'); shelf.className='v34-shelf';
 shelf.innerHTML=`<div class="v34-shelf-head"><div><div class="k">MORE TO EXPLORE</div><h3>More of us.</h3></div><p>메인 Special과 겹치지 않는 추가 기록들만 모아뒀어요.</p></div><div class="v34-shelf-grid">${ITEMS.map(x=>`<button class="v34-shelf-btn" data-v34="${x[0]}"><span class="ico">${x[1]}</span><b>${x[2]}</b><span>${x[3]}</span></button>`).join('')}</div>`;
 panel.appendChild(shelf);
 $$('[data-v34]',shelf).forEach(b=>b.onclick=()=>{try{switchView(b.dataset.v34)}catch(e){}});
}
function loadV36(){
 if($('#v36CanvaInternalScript'))return;
 const s=document.createElement('script');
 s.id='v36CanvaInternalScript';
 s.src='assets/v36-canva-internal-pages.js?build=20260816-2204';
 s.defer=true;
 document.head.appendChild(s);
}
function loadV35(){
 const old=$('#v35CanvaRefreshScript');
 if(old){loadV36();return;}
 const s=document.createElement('script');
 s.id='v35CanvaRefreshScript';
 s.src='assets/v35-canva-refresh.js?build=20260816-2129';
 s.defer=true;
 s.onload=loadV36;
 s.onerror=loadV36;
 document.head.appendChild(s);
}
async function boot(){for(let i=0;i<180;i++){if(typeof window.V26!=='undefined'&&typeof window.switchView==='function')break;await new Promise(r=>setTimeout(r,100))}style();render();loadV35();window.addEventListener('v26:view',e=>{if(e.detail==='specials')setTimeout(render,150)});}
boot();
})();