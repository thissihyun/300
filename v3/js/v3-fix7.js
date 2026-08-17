/* 300 Days With You — production photo sync + storage fallback + release copy */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let photos=[];
const photoFor=date=>photos.find(p=>p.date===date&&p.hero)||photos.find(p=>p.date===date)||null;
const pos=p=>`${p&&p.focusX!=null?Number(p.focusX):50}% ${p&&p.focusY!=null?Number(p.focusY):50}%`;
const subHeader=(title,sub)=>`<button class="btn btn-sm btn-outline" data-action="special-back">← SPECIAL</button><div class="section-head v7-special-head" style="margin-top:14px"><div class="section-title">${esc(title)}</div>${sub?`<div class="section-note">${esc(sub)}</div>`:''}</div>`;

/* --- SPECIAL: every date card reads the same shared Album photo docs. --- */
function firstsView(host){
  let off=null;
  const draw=()=>{
    if(!host.isConnected)return;
    host.innerHTML=subHeader('OUR FIRSTS','처음이라서 더 오래 남은 장면들.')+`<div class="v7-first-grid">${(window.FIRSTS||[]).map(([date,label])=>{
      const p=photoFor(date);
      return `<button class="card card-btn v7-memory-photo-card" data-action="memory" data-date="${esc(date)}">
        <div class="v7-memory-photo">${p?`<img src="${esc(p.url)}" alt="" style="object-position:${pos(p)}">`:`<div class="v7-photo-placeholder">사진이 있는 날에는 대표사진이 여기에 보여요.</div>`}</div>
        <div class="v7-card-copy"><div class="t">${esc(label)}</div><div class="s">${esc(date)}</div></div>
      </button>`;
    }).join('')}</div>`;
  };
  draw();
  off=DB.onAllPhotos(rows=>{photos=rows||[];draw()});
  const t=setInterval(()=>{if(!host.isConnected){clearInterval(t);try{off&&off()}catch(e){}}},1200);
}
function seasonsView(host){
  let off=null;
  const entries=Object.entries(window.EVENTS||{}).sort((a,b)=>a[0].localeCompare(b[0]));
  const draw=()=>{
    if(!host.isConnected)return;
    host.innerHTML=subHeader('THE SEASONS WE SHARED','계절마다 달랐던 우리를 사진과 함께 다시 봐요.')+`<div class="v7-season-stack">${(window.SEASONS||[]).map(s=>{
      const matches=entries.filter(([d])=>s.months.includes(parseInt(d.split('-')[1],10))).slice(0,8);
      return `<section class="v7-season-block"><div class="v7-season-heading"><div><span>${s.icon||''}</span><b>${esc(s.label||'')}</b></div><p>${esc(s.quote||'')}</p></div><div class="v7-season-grid">${matches.map(([date,ev])=>{
        const p=photoFor(date);
        return `<button class="v7-season-memory" data-action="memory" data-date="${esc(date)}"><div class="v7-season-photo">${p?`<img src="${esc(p.url)}" alt="" style="object-position:${pos(p)}">`:`<div class="v7-photo-placeholder compact">${date.slice(5)}</div>`}</div><div class="v7-season-copy"><b>${esc(ev.title||'Our day')}</b><span>${esc(date)}</span></div></button>`;
      }).join('')||'<div class="empty-frame">기록 없음</div>'}</div></section>`;
    }).join('')}</div>`;
  };
  draw();
  off=DB.onAllPhotos(rows=>{photos=rows||[];draw()});
  const t=setInterval(()=>{if(!host.isConnected){clearInterval(t);try{off&&off()}catch(e){}}},1200);
}
if(window.Router&&window.DB){
  Router.registerSpecial('firsts',{render:firstsView});
  Router.registerSpecial('seasons',{render:seasonsView});
}

/* Other date-based SPECIAL cards receive a representative thumbnail without changing their feature logic. */
function syncOtherSpecialPhotos(){
  const host=$('#specialDetailHost');if(!host||host.style.display==='none')return;
  $$('.poster-flip[data-poster-date]',host).forEach(card=>{
    const p=photoFor(card.dataset.posterDate),frame=$('.poster-flip-front .empty-frame,.poster-flip-front .v7-special-inline-photo',card);if(!p||!frame)return;
    frame.className='v7-special-inline-photo';frame.innerHTML=`<img src="${esc(p.url)}" alt="" style="object-position:${pos(p)}">`;
  });
  $$('.hub-card.card-btn[data-action="memory"][data-date]',host).forEach(card=>{
    if(card.classList.contains('v7-memory-photo-card')||card.querySelector('.v7-special-inline-photo'))return;
    const p=photoFor(card.dataset.date);if(!p)return;
    const old=card.querySelector('.empty-frame');
    if(old){old.className='v7-special-inline-photo';old.innerHTML=`<img src="${esc(p.url)}" alt="" style="object-position:${pos(p)}">`;return;}
    const media=document.createElement('div');media.className='v7-special-inline-photo';media.innerHTML=`<img src="${esc(p.url)}" alt="" style="object-position:${pos(p)}">`;card.prepend(media);
  });
  $$('.v3-food-card[data-action="memory"][data-date]',host).forEach(card=>{
    if(card.querySelector('.v7-food-photo'))return;const p=photoFor(card.dataset.date);if(!p)return;
    const media=document.createElement('div');media.className='v7-food-photo';media.innerHTML=`<img src="${esc(p.url)}" alt="" style="object-position:${pos(p)}">`;card.prepend(media);
  });
}

/* HERO album thumbnails are viewport crops only; source images remain untouched. */
function syncHeroThumbs(){
  $$('#view-album .v3-feature-grid .v3-photo-card').forEach(card=>{
    const id=card.dataset.photoCard,p=photos.find(x=>String(x.id)===String(id)),img=card.querySelector('.v6-clean-photo-hit>img,.v3-photo-imagebtn>img');
    if(img){img.style.setProperty('object-fit','cover','important');img.style.setProperty('object-position',pos(p),'important');}
  });
}

/* --- KAKAO stats: local fallback means a failed shared summary never looks like lost work. --- */
const STATS_KEY='days300_kakao_stats_v7';
function readStats(){try{return JSON.parse(localStorage.getItem(STATS_KEY)||'null')}catch(e){return null}}
function writeStats(data){try{localStorage.setItem(STATS_KEY,JSON.stringify(data));window.V7_LOCAL_KAKAO_STATS=data}catch(e){}}
if(window.DB&&!DB.__v7StatsFallback){
  DB.__v7StatsFallback=true;
  const setBase=DB.setKakaoStats&&DB.setKakaoStats.bind(DB),onBase=DB.onKakaoStats&&DB.onKakaoStats.bind(DB);
  DB.setKakaoStats=async data=>{
    writeStats(data);
    if(!setBase)return {shared:false};
    try{await setBase(data);window.V7_KAKAO_STATS_SHARED=true;return {shared:true}}catch(err){window.V7_KAKAO_STATS_SHARED=false;window.V7_KAKAO_STATS_ERROR=err;console.warn('[Kakao stats shared sync]',err);return {shared:false}}
  };
  DB.onKakaoStats=cb=>{
    const local=readStats();if(local)queueMicrotask(()=>cb(local));
    if(!onBase)return()=>{};
    return onBase(remote=>cb(remote||readStats()));
  };
  window.V7_LOCAL_KAKAO_STATS=readStats();
}

/* --- Release copy: remove implementation notes from user-facing screens. --- */
function cleanReleaseCopy(){
  const future=$('#view-future .v1-future-head p');
  if(future)future.textContent='앞으로 함께 하고 싶은 일, 지키고 싶은 약속, 미래의 우리에게 남기는 편지.';
  const detail=$('#specialDetailHost');
  if(detail&&$('.section-title',detail)?.textContent.trim()==='KAKAO IMPORT'){
    const note=$('.section-head .section-note',detail);if(note)note.textContent='최신 카카오톡 내보내기 파일로 우리의 대화 아카이브를 업데이트해요.';
    const how=$('.v3-kakao-how',detail);if(how)how.innerHTML='<b>대화 업데이트</b><span>카카오톡에서 내보낸 .txt 파일을 선택하면 기존 기록을 유지하면서 최신 대화를 반영해요.</span>';
    const preview=$('#v3KakaoPreview',detail),save=$('#v3KakaoSave',detail);
    if(preview&&/저장이 완료되지 않았어요|통계 저장 완료/.test(preview.textContent||'')){
      const local=readStats();
      if(local){
        preview.innerHTML=`<b>저장 완료 ✓</b><br>${Number(local.total||0).toLocaleString()}개 메시지의 최신 통계가 반영됐어요.${window.V7_KAKAO_STATS_SHARED===false?'<span class="v7-sync-note"> 공유 동기화는 연결 가능한 경우 다시 시도할 수 있어요.</span>':''}`;
        if(save&&!save.disabled)save.textContent='공유 동기화';
      }
    }
  }
  document.querySelectorAll('.section-note,.v3-streak-help,.v3-more-archive span').forEach(el=>{
    const t=(el.textContent||'').trim();
    if(t==='비슷한 기능은 합치고, 앞으로 할 일 · 약속 · 미래 편지만 남겼어요.')el.textContent='앞으로 함께 하고 싶은 일, 지키고 싶은 약속, 미래의 우리에게 남기는 편지.';
  });
}

let queued=false;
function refresh(){queued=false;syncOtherSpecialPhotos();syncHeroThumbs();cleanReleaseCopy()}
function queue(){if(queued)return;queued=true;requestAnimationFrame(refresh)}
if(window.DB&&DB.onAllPhotos)DB.onAllPhotos(rows=>{photos=rows||[];queue()});
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});
queue();
})();
