/* 300 Days With You — production26 restore pass */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let photos=[];
if(window.DB&&DB.onAllPhotos)DB.onAllPhotos(rows=>{photos=rows||[];schedule()});
function photoById(id){return photos.find(p=>String(p.id)===String(id))||null}

/* Diary photo strip — compact on mobile; preserve source image, display only. */
function normalizeDiaryPhotos(){
  const host=$('#view-diary #todayPhotos');if(!host)return;
  $$('.photo-frame',host).forEach(f=>f.classList.add('v26-diary-photo'));
}

/* Album — force exactly one visible DB-backed image per card. */
function normalizeAlbum(){
  const view=$('#view-album');if(!view)return;
  $$('.v3-photo-card[data-photo-card]',view).forEach(card=>{
    const p=photoById(card.dataset.photoCard);if(!p||!p.url)return;
    let btn=$('.v26-album-photo',card);
    if(!btn){
      btn=document.createElement('button');btn.type='button';btn.className='v26-album-photo';btn.dataset.v26Photo=String(p.id);btn.innerHTML='<img alt="">';
      const anchor=$('.v3-photo-flags',card); if(anchor)anchor.insertAdjacentElement('afterend',btn); else card.prepend(btn);
    }
    btn.dataset.v26Photo=String(p.id);const img=$('img',btn);if(img&&img.src!==p.url)img.src=p.url;
    $$('.v10-photo-surface,.v3-photo-imagebtn,.v6-clean-photo-hit',card).forEach(x=>{if(x!==btn)x.style.display='none'});
  });
}

document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-v26-photo]');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();
  const p=photoById(b.dataset.v26Photo);if(!p)return;
  if(window.AlbumView&&AlbumView.openLightbox)AlbumView.openLightbox(p.url,p.caption||'',{date:p.date,title:p.title||p.caption||((window.EVENTS||{})[p.date]?.title)||''});
},true);

/* Special — suppress duplicate copies of the same image in a single memory card. */
function normalizeSpecial(){
  const host=$('#specialDetailHost');if(!host||host.style.display==='none')return;
  $$('[data-action="memory"],.v3-food-card,.poster-flip-front,.v7-memory-photo-card,.v7-season-memory',host).forEach(card=>{
    const imgs=$$('img',card);if(imgs.length<2)return;
    const seen=new Set();let dup=false;
    imgs.forEach(im=>{const s=im.currentSrc||im.src||'';if(!s)return;if(seen.has(s)){dup=true;const wrap=im.closest('.v10-special-photo,.v25-duplicate-media,.v7-memory-photo,.v7-season-photo');if(wrap)wrap.style.display='none';else im.style.display='none'}else seen.add(s)});
    if(dup)card.dataset.v26Dedupe='1';
  });
}

/* OUR NEW YORK — render a fresh marker-only Leaflet map every time the page opens. */
function header(title,sub){return `<button class="btn btn-sm btn-outline" data-action="special-back">← SPECIAL</button><div class="section-head" style="margin-top:14px"><div class="section-title">${esc(title)}</div>${sub?`<div class="section-note">${esc(sub)}</div>`:''}</div>`}
function renderPlaces(host){
  const id='v26NycMap'+Date.now();
  host.innerHTML=header('OUR NEW YORK','A city full of places, somehow becoming full of us.')+`<div class="v26-map-shell"><div id="${id}" class="v26-map"></div></div><div class="section-head" style="margin-top:26px"><div class="section-title" style="font-size:17px">CITIES WE SHARED</div></div><div class="grid grid-3">${(window.CITIES||[]).map(c=>c.date?`<button class="card card-btn hub-card" data-action="memory" data-date="${esc(c.date)}"><div class="t">${c.icon||''} ${esc(c.name)}</div><div class="s">${esc(c.date)}</div></button>`:`<div class="card hub-card"><div class="t">${c.icon||''} ${esc(c.name)}</div></div>`).join('')}</div>`;
  const mapEl=document.getElementById(id);if(!mapEl)return;
  const init=()=>{
    if(!window.L){mapEl.innerHTML='<div class="empty-frame" style="height:100%;display:grid;place-items:center">지도를 불러오는 중이에요.</div>';return}
    try{
      if(mapEl._leaflet_id){try{mapEl._leaflet_id=null}catch(_e){}}
      const map=L.map(mapEl,{scrollWheelZoom:false,zoomControl:true}).setView([40.744,-73.985],12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(map);
      (window.PLACES||[]).forEach(p=>{
        const lat=Number(p.lat),lng=Number(p.lng);if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
        const latest=(p.dates||[]).slice(-1)[0]||'';
        const marker=L.marker([lat,lng]).addTo(map);
        marker.bindPopup(`<div style="font-family:var(--serif);text-align:center"><b>${esc(p.name)}</b><div style="font-size:10px;margin:4px 0">${esc((p.dates||[]).join(' · '))}</div>${latest?`<button class="v26-map-open" data-date="${esc(latest)}" style="border:1px solid #d9cdb0;background:#fffaf0;border-radius:999px;padding:5px 10px">이 날 열기</button>`:''}</div>`);
        marker.on('popupopen',ev=>{const b=ev.popup.getElement()?.querySelector('.v26-map-open');if(b)b.onclick=()=>Router.openMemory(b.dataset.date)});
      });
      [80,240,600].forEach(ms=>setTimeout(()=>{try{map.invalidateSize(true)}catch(_e){}},ms));
    }catch(err){console.warn('[v26 map]',err);mapEl.innerHTML='<div class="empty-frame" style="height:100%;display:grid;place-items:center">지도를 다시 불러와 주세요.</div>'}
  };
  setTimeout(init,40);
}
if(window.Router&&Router.registerSpecial)Router.registerSpecial('places',{render:renderPlaces});

let queued=false;function run(){queued=false;normalizeDiaryPhotos();normalizeAlbum();normalizeSpecial()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
run();
})();
