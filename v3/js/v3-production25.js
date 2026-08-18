/* 300 Days With You — production25 final mobile/render pass */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- no build/debug copy in the real app ---------- */
const HIDE_TEXT=[
  '장소끼리 선으로 연결하지 않고, 실제로 우리에게 의미 있던 지점만 남겼어요.',
  '비슷한 기능은 합치고, 앞으로 할 일 · 약속 · 미래 편지만 남겼어요.',
  '앞으로 함께 하고 싶은 일, 지키고 싶은 약속, 미래의 우리에게 남기는 편지.',
  'V1처럼 과거 날짜도 다시 열어 감정·활동·감사·질문을 채울 수 있어요. 기록자는 시현.',
  'V1처럼 과거 날짜도 다시 열어 감정·활동·감사·질문을 채울 수 있어요. 기록자는 강원.'
];
function cleanCopy(){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while((n=walker.nextNode())){
    const t=(n.nodeValue||'').trim();
    if(t==='This day is still being written.') n.nodeValue='아직 남긴 기록이 없어요.';
    if(HIDE_TEXT.some(x=>t===x||t.includes(x))){
      const p=n.parentElement;
      if(p&&p.children.length===0)p.classList.add('v25-hide-copy');else n.nodeValue='';
    }
  }
  const select=$('#v3AlbumSelectToggle');
  if(select&&!/취소/.test(select.textContent||''))select.textContent='여러 장 선택';
}

/* ---------- Album: exactly one visible image per card ---------- */
function normalizeAlbum(){
  const view=$('#view-album');if(!view)return;
  $$('.v3-photo-card',view).forEach(card=>{
    let surfaces=$$('.v10-photo-surface',card);
    if(surfaces.length>1)surfaces.slice(1).forEach(x=>x.remove());
    let surface=surfaces[0];
    const old=$('.v3-photo-imagebtn,.v6-clean-photo-hit',card);
    const oldImg=old&&$('img',old);
    if(!surface&&oldImg&&oldImg.src){
      surface=document.createElement('button');surface.type='button';surface.className='v10-photo-surface';
      const id=card.dataset.photoCard||old.dataset.v3OpenPhoto||'';if(id)surface.dataset.v10Photo=id;
      surface.innerHTML=`<img src="${esc(oldImg.src)}" alt="">`;old.insertAdjacentElement('beforebegin',surface);
    }
    if(surface){
      surface.querySelectorAll(':scope > *:not(img)').forEach(x=>x.remove());
      const im=$('img',surface);if(im){im.style.transform='none';im.style.objectPosition='center';}
    }
  });
  const select=$('#v3AlbumSelectToggle',view);if(select&&!/취소/.test(select.textContent||''))select.textContent='여러 장 선택';
}

/* ---------- prevent same-file duplicates on future uploads ---------- */
let photoRows=[],nameQueue=[],wrappedAdd=false;
function normName(s){return String(s||'').trim().toLowerCase()}
function installPhotoDedupe(){
  if(!window.DB||!DB.addPhoto||wrappedAdd)return;wrappedAdd=true;
  if(DB.onAllPhotos)DB.onAllPhotos(rows=>{photoRows=rows||[]});
  const original=DB.addPhoto.bind(DB);
  DB.addPhoto=async function(data){
    data={...(data||{})};
    if(!data.originalName&&nameQueue.length)data.originalName=nameQueue.shift();
    const nm=normName(data.originalName);
    if(nm){
      const hit=photoRows.find(p=>normName(p.originalName||p.fileName)===nm);
      if(hit){try{Router.toast(`같은 파일명은 한 장만 남겨요 · ${data.originalName}`)}catch(_e){}return hit.id}
    }
    if(data.url){
      const hit=photoRows.find(p=>String(p.url||'')===String(data.url));
      if(hit)return hit.id;
    }
    const id=await original(data);if(id)photoRows.push({id,...data});return id;
  };
  document.addEventListener('change',e=>{
    const input=e.target;if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.closest('#uploadModal'))return;
    const files=Array.from(input.files||[]).filter(f=>/^image\//.test(f.type||''));if(!files.length)return;
    const existing=new Set(photoRows.map(p=>normName(p.originalName||p.fileName)).filter(Boolean));
    const local=new Set(),keep=[];
    files.forEach(f=>{const n=normName(f.name);if(!n||existing.has(n)||local.has(n))return;local.add(n);keep.push(f)});
    nameQueue=keep.map(f=>f.name);
    if(keep.length!==files.length && typeof DataTransfer!=='undefined'){
      try{const dt=new DataTransfer();keep.forEach(f=>dt.items.add(f));input.files=dt.files;Router.toast(`${files.length-keep.length}장의 같은 파일명 사진을 건너뛰었어요`)}catch(_e){}
    }
  },true);
}

/* ---------- Special: suppress injected duplicate photo surfaces ---------- */
function normalizeSpecial(){
  const host=$('#specialDetailHost');if(!host||host.style.display==='none')return;
  $$('[data-action="memory"],.v3-food-card,.poster-flip-front,.v7-memory-photo-card,.v7-season-memory',host).forEach(card=>{
    const native=$$('img',card).find(im=>!im.closest('.v10-special-photo'));
    card.classList.toggle('v25-has-native-media',!!native);
    const imgs=$$('img',card),seen=new Map();
    imgs.forEach(im=>{
      const src=im.currentSrc||im.src||'';if(!src)return;
      if(!seen.has(src)){seen.set(src,im);return}
      const first=seen.get(src);
      const remove=im.closest('.v10-special-photo,.v7-memory-photo,.v7-season-photo')||im.parentElement;
      if(remove&&remove!==first.parentElement)remove.classList.add('v25-duplicate-media');
    });
  });
}

/* ---------- OUR NEW YORK: real Leaflet map, marker-only ---------- */
function specialHeader(title,sub=''){
  return `<button class="btn btn-sm btn-outline" data-action="special-back">← SPECIAL</button><div class="section-head" style="margin-top:14px"><div class="section-title">${esc(title)}</div>${sub?`<div class="section-note">${esc(sub)}</div>`:''}</div>`;
}
if(window.Router&&Router.registerSpecial){
  Router.registerSpecial('places',{render(host){
    const id='v25NycMap'+Date.now();
    host.innerHTML=specialHeader('OUR NEW YORK','A city full of places, somehow becoming full of us.')+`<div class="card v25-map-card"><div class="v25-map" id="${id}"></div><div class="v25-map-fallback" id="${id}Fallback" style="display:none"></div></div><div class="section-head" style="margin-top:26px"><div class="section-title" style="font-size:17px">CITIES WE SHARED</div></div><div class="grid grid-3">${(window.CITIES||[]).map(c=>c.date?`<button class="card card-btn hub-card" data-action="memory" data-date="${esc(c.date)}"><div class="t">${c.icon||''} ${esc(c.name)}</div><div class="s">${esc(c.date)}</div></button>`:`<div class="card hub-card"><div class="t">${c.icon||''} ${esc(c.name)}</div></div>`).join('')}</div>`;
    const mapEl=document.getElementById(id),fallback=document.getElementById(id+'Fallback');
    const showFallback=()=>{if(!fallback)return;fallback.style.display='grid';fallback.innerHTML=(window.PLACES||[]).map(p=>{const d=(p.dates||[]).slice(-1)[0]||'';return `<button class="card card-btn" data-action="memory" data-date="${esc(d)}"><b>${esc(p.name)}</b><span class="section-note">${esc((p.dates||[]).join(' · '))}</span></button>`}).join('')};
    requestAnimationFrame(()=>{
      if(!window.L||!mapEl){showFallback();return}
      try{
        const map=L.map(mapEl,{scrollWheelZoom:false,zoomControl:true,attributionControl:true}).setView([40.744,-73.985],12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(map);
        (window.PLACES||[]).forEach(p=>{
          if(!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng)))return;
          const latest=(p.dates||[]).slice(-1)[0]||'';
          const m=L.marker([Number(p.lat),Number(p.lng)]).addTo(map).bindPopup(`<div style="font-family:var(--serif);text-align:center"><b>${esc(p.name)}</b><div style="font-size:10px;margin:4px 0">${esc((p.dates||[]).join(' · '))}</div>${latest?`<button class="v25-map-open" data-date="${esc(latest)}" style="border:1px solid #d9cdb0;background:#fffaf0;border-radius:999px;padding:5px 10px">이 날 열기</button>`:''}</div>`);
          m.on('popupopen',ev=>{const b=ev.popup.getElement()?.querySelector('.v25-map-open');if(b)b.onclick=()=>Router.openMemory(b.dataset.date)});
        });
        setTimeout(()=>map.invalidateSize(),120);
      }catch(err){console.warn('[OUR NEW YORK map]',err);mapEl.style.display='none';showFallback()}
    });
  }});

  /* WORDS THAT BECAME OURS — one real Kakao message per row, never duplicated. */
  Router.registerSpecial('words',{render(host){
    const words=window.WORDS||['사랑해','보고싶어','아가','여보','결혼','평생','고마워','행복'];
    host.innerHTML=specialHeader('WORDS THAT BECAME OURS')+`<div class="v25-word-head">${words.map(w=>`<button class="chip" data-v25-word="${esc(w)}">${esc(w)} <span>${Number(window.BASELINE_STATS?.words?.[w]||0).toLocaleString()}</span></button>`).join('')}</div><div id="v25WordDetail"></div>`;
    let active=words[0]||'';
    const draw=async()=>{
      if(window.FullChat){try{await FullChat.load()}catch(_e){}}
      if(!host.isConnected)return;
      const all=window.FullChat&&FullChat.ready?FullChat.allMessages():[];
      const rows=all.filter(m=>String(m.text||'').includes(active)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      const detail=$('#v25WordDetail',host);if(!detail)return;
      const page=Number(detail.dataset.page||'1'),limit=100,shown=rows.slice(0,page*limit);
      detail.innerHTML=`<div class="v25-word-summary">“${esc(active)}” · ${rows.length.toLocaleString()}개의 실제 카톡</div><div class="v25-word-list">${shown.map(r=>`<button class="v25-word-row" data-action="memory" data-date="${esc(r.date)}"><span class="v25-word-date">${esc(String(r.date||'').slice(5))}</span><span class="v25-word-copy"><small>${esc(r.speaker||'')}</small><p>${esc(r.text||'')}</p></span></button>`).join('')||'<div class="empty-frame">아직 이 단어가 들어간 카톡이 없어요.</div>'}</div>${shown.length<rows.length?'<button class="btn btn-sm btn-outline v25-word-more" id="v25WordMore">더 보기</button>':''}`;
      const more=$('#v25WordMore',detail);if(more)more.onclick=()=>{detail.dataset.page=String(page+1);draw()};
    };
    $$('[data-v25-word]',host).forEach(b=>b.onclick=()=>{active=b.dataset.v25Word;$$('[data-v25-word]',host).forEach(x=>x.classList.toggle('is-selected',x===b));const d=$('#v25WordDetail',host);if(d)d.dataset.page='1';draw()});
    const first=$('[data-v25-word]',host);if(first)first.classList.add('is-selected');draw();
  }});
}

/* ---------- Run after every view redraw without creating DOM loops ---------- */
let queued=false;
function run(){queued=false;cleanCopy();normalizeAlbum();normalizeSpecial()}
new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true});
installPhotoDedupe();run();
})();
