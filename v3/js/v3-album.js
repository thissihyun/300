/* ================================================================
   V3 PHOTO ALBUM — V1 + V2 complete merge
   V2 remains the data/storage engine. Real photos are never redrawn,
   cropped into new images, face-edited, or generatively extended.
   Display uses object-fit:contain; upload only downsizes for Firestore.
   ================================================================ */
(function(){
  'use strict';

  const fallbackEsc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const esc = s => window.escapeHtml ? window.escapeHtml(s) : fallbackEsc(s);
  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => Array.from(r.querySelectorAll(s));
  const localToday = () => {
    if(typeof window.todayISO === 'function') return window.todayISO();
    const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  };
  const me = () => { try{return Identity.displayName(Identity.current())}catch(e){return ''} };
  const eventFor = date => (window.EVENTS||{})[date] || {};

  let photoCache = [];
  let albumUnsub = null;
  let mode = 'day';
  let filmIndex = 0;
  let randomId = null;
  const filters = {search:'', type:'', mood:'', month:''};

  // Keep a lightweight global photo cache so Memory Detail can open the uploader
  // before the Album view has ever been visited.
  if(window.DB && DB.onAllPhotos){
    DB.onAllPhotos(rows=>{ photoCache = rows || []; });
  }

  function photoTypes(){ return window.PHOTO_TYPES || ['셀카','커플사진','인물','풍경','음식','티켓/물건','스크린샷','네컷']; }
  function photoMoods(){ return window.PHOTO_MOODS || ['설렘','다정함','웃김','평범한 일상','여행','뉴욕 감성','따뜻함','겨울','여름','밤','노을','기념일','보고싶은 순간','최애']; }

  function fileToDataURL(file, maxDim=1600, quality=.82){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=reject;
      reader.onload=()=>{
        const img=new Image();
        img.onerror=()=>reject(new Error('image-decode-failed'));
        img.onload=()=>{
          let w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
          if(w>maxDim || h>maxDim){
            const scale=maxDim/Math.max(w,h); w=Math.round(w*scale); h=Math.round(h*scale);
          }
          const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
          const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
          resolve(canvas.toDataURL('image/jpeg',quality));
        };
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Navigation: restore V1's explicit ALBUM entrance ---------- */
  function installAlbumNavigation(){
    const top=$('.top-nav');
    if(top && !top.querySelector('[data-nav="album"]')){
      const btn=document.createElement('button');
      btn.dataset.action='view'; btn.dataset.target='album'; btn.dataset.nav='album'; btn.textContent='ALBUM';
      const after=top.querySelector('[data-nav="ourdays"]');
      if(after) after.insertAdjacentElement('afterend',btn); else top.appendChild(btn);
    }
    const bottom=$('.bottom-nav-inner');
    if(bottom && !bottom.querySelector('[data-nav="album"]')){
      const btn=document.createElement('button');
      btn.dataset.action='view'; btn.dataset.target='album'; btn.dataset.nav='album';
      btn.innerHTML='<span class="ic">▤</span>Album';
      const after=bottom.querySelector('[data-nav="ourdays"]');
      if(after) after.insertAdjacentElement('afterend',btn); else bottom.appendChild(btn);
    }
  }
  installAlbumNavigation();

  // Home gets a direct album entrance as well, but we add it around V2 rather than
  // changing Home's own module.
  const home=$('#view-home');
  if(home){
    const mo=new MutationObserver(()=>{
      const actions=$('.hero-actions',home);
      if(actions && !actions.querySelector('[data-target="album"]')){
        const btn=document.createElement('button');
        btn.className='btn btn-outline'; btn.dataset.action='view'; btn.dataset.target='album';
        btn.textContent='OPEN PHOTO ALBUM →'; actions.appendChild(btn);
      }
    });
    mo.observe(home,{childList:true,subtree:true});
  }

  /* ---------- Upload: V2 multi-photo flow, accessible from Album too ---------- */
  function openUploader(defaultDate){
    const panel=$('#uploadPanel'); if(!panel) return;
    panel.innerHTML=`
      <div class="modal-top"><button class="icon-btn" data-action="close-modal">✕</button></div>
      <div class="v3-album-modal-k">REAL PHOTO UPLOAD</div>
      <h2 class="modal-title" style="font-size:24px;">ADD PHOTOS</h2>
      <div class="section-note">원본 인물/구도는 건드리지 않고 저장 용량을 위해 크기만 축소해요. 얼굴·배경·내용은 재생성하지 않습니다.</div>
      <label class="section-note v3-album-field-label">저장할 날짜</label>
      <input class="field" type="date" id="v3UploadDate" value="${esc(defaultDate||localToday())}">
      <label class="section-note v3-album-field-label">사진 선택 · 여러 장 가능</label>
      <input class="v3-file-input" type="file" id="v3UploadFiles" accept="image/*" multiple>
      <div id="v3UploadProgress" class="section-note" style="margin-top:9px;"></div>
      <div id="v3UploadPreview" class="v3-upload-preview"></div>
      <div class="v3-album-modal-actions"><button class="btn" id="v3UploadSave">사진 저장</button></div>`;

    let pending=[];
    $('#v3UploadFiles',panel).addEventListener('change',async e=>{
      const files=Array.from(e.target.files||[]), progress=$('#v3UploadProgress',panel), preview=$('#v3UploadPreview',panel);
      pending=[]; preview.innerHTML='';
      for(let i=0;i<files.length;i++){
        progress.textContent=`처리 중 ${i+1} / ${files.length} · ${files[i].name}`;
        try{
          const dataUrl=await fileToDataURL(files[i]);
          pending.push({dataUrl,name:files[i].name});
          const item=document.createElement('div'); item.className='v3-upload-tile';
          item.innerHTML=`<img src="${dataUrl}" alt=""><div>${esc(files[i].name)}</div>`; preview.appendChild(item);
        }catch(err){
          const fail=document.createElement('div'); fail.className='v3-upload-fail'; fail.textContent=`읽지 못한 사진: ${files[i].name}`; preview.appendChild(fail);
        }
      }
      progress.textContent=`${pending.length} PHOTOS ready`;
    });

    $('#v3UploadSave',panel).addEventListener('click',async()=>{
      if(!pending.length){ Router.toast('사진을 먼저 선택해주세요'); return; }
      const date=$('#v3UploadDate',panel).value||localToday();
      const existing=photoCache.filter(p=>p.date===date);
      let hasHero=existing.some(p=>p.hero);
      const save=$('#v3UploadSave',panel); save.disabled=true; save.textContent='저장 중…';
      try{
        for(const p of pending){
          const hero=!hasHero;
          await DB.addPhoto({date,url:p.dataUrl,hero,bookPick:false,place:'',food:'',type:'',moods:[],caption:'',author:me()});
          if(hero) hasHero=true;
        }
        await DB.logActivity('photo',date,me(),`${pending.length}장 추가`);
        Router.toast(`${pending.length}장의 사진을 추가했어요`);
        $('#uploadModal').classList.remove('is-open'); document.body.classList.remove('modal-open');
      }catch(err){
        console.warn('[V3 Album upload]',err); Router.toast('사진 저장 중 문제가 생겼어요');
        save.disabled=false; save.textContent='사진 저장';
      }
    });
    $('#uploadModal').classList.add('is-open'); document.body.classList.add('modal-open');
  }

  /* ---------- Metadata editor: V1 tags + V2 HERO / BOOK PICK ---------- */
  function openMetaEditor(photo){
    const panel=$('#uploadPanel'); if(!panel||!photo) return;
    const moods=new Set(photo.moods||[]); let type=photo.type||'';
    let focusX = photo.focusX!=null ? photo.focusX : 50;
    let focusY = photo.focusY!=null ? photo.focusY : 50;
    let focusZoom = photo.focusZoom!=null ? photo.focusZoom : 100;
    panel.innerHTML=`
      <div class="modal-top"><button class="icon-btn" data-action="close-modal">✕</button></div>
      <div class="v3-album-modal-k">ABOUT THIS PHOTO · ${esc(photo.date||'')}</div>
      <div class="v3-meta-layout">
        <div class="v3-meta-preview" id="v3MetaPreview"><img src="${esc(photo.url)}" alt="업로드한 실제 사진"></div>
        <div>
          <label class="section-note v3-album-field-label">장소</label>
          <input class="field" id="v3MetaPlace" value="${esc(photo.place||'')}" placeholder="예: MoMA">
          <label class="section-note v3-album-field-label">음식 / 메뉴</label>
          <input class="field" id="v3MetaFood" value="${esc(photo.food||'')}" placeholder="예: Raku udon">
          <label class="section-note v3-album-field-label">한 줄 캡션</label>
          <input class="field" id="v3MetaCaption" value="${esc(photo.caption||'')}" placeholder="이 사진을 기억하는 한 줄">
        </div>
      </div>
      <label class="section-note v3-album-field-label">사진 종류</label>
      <div class="v3-chip-grid" id="v3MetaTypes">${photoTypes().map(t=>`<button type="button" class="chip ${type===t?'is-selected':''}" data-v3-type="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <label class="section-note v3-album-field-label">느낌</label>
      <div class="v3-chip-grid" id="v3MetaMoods">${photoMoods().map(m=>`<button type="button" class="chip ${moods.has(m)?'is-selected':''}" data-v3-mood="${esc(m)}">${esc(m)}</button>`).join('')}</div>

      <div class="v3-focus-editor">
        <label class="section-note v3-album-field-label">달력 대표사진 위치 조정</label>
        <div class="section-note" style="margin-bottom:8px;">달력·OUR FIRSTS·계절·Special 카드의 정사각형 칸에서 이 사진이 어떻게 잘려 보일지 조정해요. 사진 원본은 그대로 저장돼요.</div>
        <div class="v3-focus-layout">
          <div class="v3-focus-preview-frame"><div class="v3-focus-preview" id="v3FocusPreview"><img src="${esc(photo.url)}" alt=""></div></div>
          <div class="v3-focus-controls">
            <label class="v3-focus-label">좌우 <span id="v3FocusXVal">${focusX}</span></label>
            <input type="range" id="v3FocusX" min="0" max="100" value="${focusX}">
            <label class="v3-focus-label">상하 <span id="v3FocusYVal">${focusY}</span></label>
            <input type="range" id="v3FocusY" min="0" max="100" value="${focusY}">
            <label class="v3-focus-label">확대 <span id="v3FocusZoomVal">${focusZoom}%</span></label>
            <input type="range" id="v3FocusZoom" min="100" max="250" value="${focusZoom}">
            <button class="btn btn-sm btn-outline" id="v3FocusSave">달력 대표사진 프레임 저장</button>
          </div>
        </div>
      </div>

      <div class="v3-album-modal-actions v3-album-modal-actions-wrap">
        <button class="btn btn-sm" id="v3MetaSave">정보 저장</button>
        <button class="btn btn-sm btn-outline" id="v3MetaHero">${photo.hero?'★ HERO · 현재 대표':'★ HERO로 설정'}</button>
        <button class="btn btn-sm btn-outline" id="v3MetaBook">${photo.bookPick?'B BOOK PICK 해제':'B BOOK PICK'}</button>
        <button class="btn btn-sm v3-danger-btn" id="v3MetaDelete">사진 삭제</button>
      </div>`;

    function paintFocusPreview(){
      const img=$('#v3FocusPreview img',panel); if(!img)return;
      img.style.objectFit='cover';
      img.style.objectPosition=`${focusX}% ${focusY}%`;
      img.style.transform=`scale(${focusZoom/100})`;
    }
    paintFocusPreview();
    $('#v3FocusX',panel).addEventListener('input',e=>{focusX=+e.target.value;$('#v3FocusXVal',panel).textContent=focusX;paintFocusPreview();});
    $('#v3FocusY',panel).addEventListener('input',e=>{focusY=+e.target.value;$('#v3FocusYVal',panel).textContent=focusY;paintFocusPreview();});
    $('#v3FocusZoom',panel).addEventListener('input',e=>{focusZoom=+e.target.value;$('#v3FocusZoomVal',panel).textContent=focusZoom+'%';paintFocusPreview();});
    $('#v3FocusSave',panel).addEventListener('click',async()=>{
      await DB.updatePhoto(photo.id,{focusX,focusY,focusZoom});
      Router.toast('달력 대표사진 프레임을 저장했어요');
    });

    $$('[data-v3-type]',panel).forEach(btn=>btn.addEventListener('click',()=>{
      type=btn.dataset.v3Type; $$('[data-v3-type]',panel).forEach(b=>b.classList.toggle('is-selected',b===btn));
    }));
    $$('[data-v3-mood]',panel).forEach(btn=>btn.addEventListener('click',()=>{
      const m=btn.dataset.v3Mood; if(moods.has(m)){moods.delete(m);btn.classList.remove('is-selected')}else{moods.add(m);btn.classList.add('is-selected')}
    }));
    $('#v3MetaSave',panel).addEventListener('click',async()=>{
      await DB.updatePhoto(photo.id,{place:$('#v3MetaPlace',panel).value.trim(),food:$('#v3MetaFood',panel).value.trim(),caption:$('#v3MetaCaption',panel).value.trim(),type,moods:[...moods]});
      Router.toast('사진 정보를 저장했어요'); $('#uploadModal').classList.remove('is-open'); document.body.classList.remove('modal-open');
    });
    $('#v3MetaHero',panel).addEventListener('click',async()=>{
      const sameDay=photoCache.filter(p=>p.date===photo.date);
      await Promise.all(sameDay.map(p=>DB.updatePhoto(p.id,{hero:p.id===photo.id})));
      Router.toast('이 날의 대표사진으로 설정했어요'); $('#uploadModal').classList.remove('is-open'); document.body.classList.remove('modal-open');
    });
    $('#v3MetaBook',panel).addEventListener('click',async()=>{
      await DB.updatePhoto(photo.id,{bookPick:!photo.bookPick});
      Router.toast(photo.bookPick?'BOOK PICK을 해제했어요':'포토북 후보로 저장했어요'); $('#uploadModal').classList.remove('is-open'); document.body.classList.remove('modal-open');
    });
    $('#v3MetaDelete',panel).addEventListener('click',async()=>{
      if(!confirm('이 사진을 웹 아카이브에서 삭제할까요?')) return;
      const sameDay=photoCache.filter(p=>p.date===photo.date&&p.id!==photo.id);
      await DB.deletePhoto(photo.id);
      if(photo.hero && sameDay.length && !sameDay.some(p=>p.hero)) await DB.updatePhoto(sameDay[0].id,{hero:true});
      Router.toast('사진을 삭제했어요'); $('#uploadModal').classList.remove('is-open'); document.body.classList.remove('modal-open');
    });
    $('#uploadModal').classList.add('is-open'); document.body.classList.add('modal-open');
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(url,caption,meta){
    const modal=$('#lightboxModal'), img=$('#lightboxImg'); if(!modal||!img)return;
    img.src=url||'';
    let info=$('#v3LightboxMeta',modal);
    if(!info){ info=document.createElement('div'); info.id='v3LightboxMeta'; info.className='v3-lightbox-meta'; img.insertAdjacentElement('afterend',info); }
    const bits=[];
    if(meta?.date) bits.push(meta.date);
    if(meta?.title) bits.push(meta.title);
    if(caption) bits.push(caption);
    info.innerHTML=bits.length?bits.map((x,i)=>i===bits.length-1&&caption?`<div class="v3-lightbox-caption">${esc(x)}</div>`:`<span>${esc(x)}</span>`).join(' · '):'';
    modal.classList.add('is-open'); document.body.classList.add('modal-open');
  }
  function closeLightbox(){
    const modal=$('#lightboxModal'), img=$('#lightboxImg'); if(modal)modal.classList.remove('is-open'); if(img)img.src='';
    const info=$('#v3LightboxMeta'); if(info)info.innerHTML=''; document.body.classList.remove('modal-open');
  }
  function openLightboxPhoto(p){ openLightbox(p.url,p.caption||'',{date:p.date,title:eventFor(p.date).title||''}); }

  /* ---------- Album rendering ---------- */
  function sortPhotos(list,desc=true){
    return [...list].sort((a,b)=>{
      const ad=a.date||'', bd=b.date||''; if(ad===bd) return String(a.id||'').localeCompare(String(b.id||''));
      return desc ? bd.localeCompare(ad) : ad.localeCompare(bd);
    });
  }
  function filteredPhotos(){
    let list=[...photoCache];
    if(filters.search){
      const q=filters.search.toLowerCase();
      list=list.filter(p=>{
        const ev=eventFor(p.date);
        return [p.date,ev.title,ev.story,p.place,p.food,p.type,p.caption,...(p.moods||[])].filter(Boolean).join(' ').toLowerCase().includes(q);
      });
    }
    if(filters.type) list=list.filter(p=>p.type===filters.type);
    if(filters.mood) list=list.filter(p=>(p.moods||[]).includes(filters.mood));
    if(filters.month) list=list.filter(p=>(p.date||'').slice(0,7)===filters.month);
    return sortPhotos(list,true);
  }
  function tagsFor(p){ return [p.place,p.food,p.type,...(p.moods||[])].filter(Boolean); }

  function card(p,opts={}){
    const ev=eventFor(p.date), tags=tagsFor(p).slice(0,4);
    return `<article class="v3-photo-card ${opts.compact?'is-compact':''}" data-photo-card="${esc(p.id)}">
      <div class="v3-photo-flags">${p.hero?'<span class="v3-photo-flag hero">HERO</span>':''}${p.bookPick?'<span class="v3-photo-flag book">BOOK PICK</span>':''}</div>
      <button class="v3-photo-imagebtn" type="button" data-v3-open-photo="${esc(p.id)}"><img src="${esc(p.url)}" alt="${esc(p.caption||ev.title||'우리 사진')}" loading="lazy"></button>
      <button class="v3-photo-edit" type="button" data-v3-edit-photo="${esc(p.id)}" aria-label="사진 정보 수정">✎</button>
      ${opts.compact?'':`<div class="v3-photo-copy"><div class="v3-photo-date">${esc(p.date||'')}</div><div class="v3-photo-title">${esc(ev.title||'Our photo')}</div>${p.caption?`<div class="v3-photo-caption">${esc(p.caption)}</div>`:''}${tags.length?`<div class="v3-photo-tags">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}</div>`}
    </article>`;
  }

  function bindPhotoActions(host){
    $$('[data-v3-open-photo]',host).forEach(btn=>btn.addEventListener('click',()=>{const p=photoCache.find(x=>String(x.id)===btn.dataset.v3OpenPhoto);if(p)openLightboxPhoto(p)}));
    $$('[data-v3-edit-photo]',host).forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const p=photoCache.find(x=>String(x.id)===btn.dataset.v3EditPhoto);if(p)openMetaEditor(p)}));
  }

  function empty(host,text='아직 앨범에 사진이 없어요.'){ host.innerHTML=`<div class="empty-frame">${esc(text)}</div>`; }

  function renderByDay(host,list){
    if(!list.length)return empty(host);
    const groups={}; list.forEach(p=>(groups[p.date]=groups[p.date]||[]).push(p));
    host.innerHTML=Object.keys(groups).sort((a,b)=>b.localeCompare(a)).map(date=>`
      <section class="v3-album-group"><div class="v3-album-group-head"><button class="v3-album-date-link" data-action="memory" data-date="${esc(date)}">${esc(date)} · ${esc(eventFor(date).title||'')}</button><span>${groups[date].length} photos</span></div><div class="v3-photo-grid">${groups[date].map(p=>card(p)).join('')}</div></section>`).join('');
    bindPhotoActions(host);
  }

  function renderMonthly(host,list){
    if(!list.length)return empty(host);
    const groups={}; list.forEach(p=>{const m=(p.date||'').slice(0,7)||'기타';(groups[m]=groups[m]||[]).push(p)});
    const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
    host.innerHTML=Object.keys(groups).sort((a,b)=>b.localeCompare(a)).map(m=>{
      const [y,mm]=m.split('-'); const label=mm?`${MN[Number(mm)-1]} ${y}`:m;
      return `<section class="v3-album-group"><div class="v3-album-month-head"><h3>${esc(label)}</h3><span>${groups[m].length} photos</span></div><div class="v3-photo-grid">${groups[m].map(p=>card(p)).join('')}</div></section>`;
    }).join(''); bindPhotoActions(host);
  }

  function renderContact(host,list){
    if(!list.length)return empty(host);
    host.innerHTML=`<div class="v3-contact-sheet">${list.map(p=>`<button type="button" class="v3-contact-tile" data-v3-open-photo="${esc(p.id)}"><img src="${esc(p.url)}" alt="" loading="lazy"><span>${esc((p.date||'').slice(5))}</span>${p.hero?'<i>★</i>':''}</button>`).join('')}</div>`; bindPhotoActions(host);
  }

  function renderFilmStrip(host,list){
    if(!list.length)return empty(host);
    const chronological=sortPhotos(list,false);
    host.innerHTML=`<div class="v3-filmstrip-note">V1 FILM STRIP · 옆으로 넘겨서 시간순으로 봐요.</div><div class="v3-filmstrip">${chronological.map(p=>`<button type="button" class="v3-film-frame" data-v3-open-photo="${esc(p.id)}"><div class="v3-film-image"><img src="${esc(p.url)}" alt="" loading="lazy"></div><div class="v3-film-label">${esc(p.date)} · ${esc(eventFor(p.date).title||'')}</div></button>`).join('')}</div>`; bindPhotoActions(host);
  }

  function renderFilmViewer(host,list){
    if(!list.length)return empty(host);
    const chronological=sortPhotos(list,false); if(filmIndex>=chronological.length)filmIndex=0; if(filmIndex<0)filmIndex=chronological.length-1;
    const p=chronological[filmIndex], ev=eventFor(p.date);
    host.innerHTML=`<div class="v3-film-viewer"><div class="v3-film-viewer-frame"><img src="${esc(p.url)}" alt=""></div><div class="v3-film-viewer-copy"><div class="v3-album-k">V2 FILM VIEWER · ${filmIndex+1} / ${chronological.length}</div><h3>${esc(ev.title||p.date)}</h3><div class="section-note">${esc(p.date)}</div>${p.caption?`<p>${esc(p.caption)}</p>`:''}<div class="v3-film-viewer-actions"><button class="btn btn-sm btn-outline" id="v3FilmPrev">◀ PREV</button><button class="btn btn-sm" id="v3FilmOpen">사진 크게</button><button class="btn btn-sm btn-outline" id="v3FilmNext">NEXT ▶</button><button class="btn btn-sm btn-outline" data-action="memory" data-date="${esc(p.date)}">이 날 열기</button></div></div></div>`;
    $('#v3FilmPrev',host).addEventListener('click',()=>{filmIndex=(filmIndex-1+chronological.length)%chronological.length;renderFilmViewer(host,list)});
    $('#v3FilmNext',host).addEventListener('click',()=>{filmIndex=(filmIndex+1)%chronological.length;renderFilmViewer(host,list)});
    $('#v3FilmOpen',host).addEventListener('click',()=>openLightboxPhoto(p));
  }

  function renderPlaces(host,list){
    const tagged=list.filter(p=>p.place); if(!tagged.length)return empty(host,'장소 태그가 달린 사진이 아직 없어요. ✎에서 장소를 남겨보세요.');
    const groups={}; tagged.forEach(p=>(groups[p.place]=groups[p.place]||[]).push(p));
    host.innerHTML=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0])).map(([place,ps])=>`<section class="v3-album-group"><div class="v3-album-month-head"><h3>${esc(place)}</h3><span>${ps.length} photos</span></div><div class="v3-photo-grid">${ps.map(p=>card(p)).join('')}</div></section>`).join(''); bindPhotoActions(host);
  }

  function renderHero(host,list){
    const heroes=list.filter(p=>p.hero); if(!heroes.length)return empty(host,'아직 HERO로 지정한 사진이 없어요. ✎에서 대표사진을 지정할 수 있어요.');
    host.innerHTML=`<div class="v3-feature-grid">${heroes.map(p=>card(p)).join('')}</div>`; bindPhotoActions(host);
  }

  function renderBookPicks(host,list){
    const picks=list.filter(p=>p.bookPick); if(!picks.length)return empty(host,'아직 BOOK PICK으로 저장한 사진이 없어요.');
    host.innerHTML=`<div class="v3-feature-intro"><div class="v3-album-k">V2 · PHOTOBOOK CURATION</div><h3>BOOK PICKS</h3><p>실제 포토북에 넣고 싶은 사진만 따로 모아두는 곳.</p></div><div class="v3-feature-grid">${picks.map(p=>card(p)).join('')}</div>`; bindPhotoActions(host);
  }

  function renderRandom(host,list){
    if(!list.length)return empty(host);
    let p=list.find(x=>String(x.id)===String(randomId));
    if(!p){p=list[Math.floor(Math.random()*list.length)];randomId=p.id}
    const ev=eventFor(p.date);
    host.innerHTML=`<div class="v3-random-memory"><div class="v3-random-photo"><img src="${esc(p.url)}" alt=""></div><div class="v3-random-copy"><div class="v3-album-k">TODAY'S RANDOM MEMORY · ${esc(p.date)}</div><h3>${esc(ev.title||'Our memory')}</h3><p>${esc(p.caption||ev.story||'')}</p><div class="v3-random-actions"><button class="btn btn-sm" id="v3RandomAgain">🎲 다른 사진</button><button class="btn btn-sm btn-outline" id="v3RandomOpen">사진 크게</button><button class="btn btn-sm btn-outline" data-action="memory" data-date="${esc(p.date)}">OPEN THIS MEMORY →</button></div></div></div>`;
    $('#v3RandomAgain',host).addEventListener('click',()=>{randomId=null;renderRandom(host,list)}); $('#v3RandomOpen',host).addEventListener('click',()=>openLightboxPhoto(p));
  }

  function renderPhotobooth(host,list){
    const shots=list.filter(p=>p.type==='네컷'); if(!shots.length)return empty(host,'사진 종류를 “네컷”으로 태그하면 여기 자동으로 모여요.');
    host.innerHTML=`<div class="v3-feature-intro"><div class="v3-album-k">PHOTOBOOTH ARCHIVE</div><h3>네컷만 모아보기</h3></div><div class="v3-photo-grid v3-photobooth-grid">${shots.map(p=>card(p)).join('')}</div>`; bindPhotoActions(host);
  }

  function updateMonthOptions(container){
    const sel=$('#v3AlbumMonth',container); if(!sel)return;
    const months=[...new Set(photoCache.map(p=>(p.date||'').slice(0,7)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
    const current=filters.month;
    sel.innerHTML='<option value="">월 · 전체</option>'+months.map(m=>`<option value="${esc(m)}" ${m===current?'selected':''}>${esc(m)}</option>`).join('');
  }

  function draw(container){
    const host=$('#v3AlbumHost',container); if(!host)return;
    const list=filteredPhotos();
    const count=$('#v3AlbumCount',container); if(count)count.textContent=`${list.length.toLocaleString()} / ${photoCache.length.toLocaleString()} PHOTOS`;
    $$('[data-v3-album-mode]',container).forEach(b=>b.classList.toggle('is-active',b.dataset.v3AlbumMode===mode));
    if(mode==='day')renderByDay(host,list);
    else if(mode==='monthly')renderMonthly(host,list);
    else if(mode==='contact')renderContact(host,list);
    else if(mode==='filmstrip')renderFilmStrip(host,list);
    else if(mode==='filmviewer')renderFilmViewer(host,list);
    else if(mode==='places')renderPlaces(host,list);
    else if(mode==='hero')renderHero(host,list);
    else if(mode==='bookpicks')renderBookPicks(host,list);
    else if(mode==='random')renderRandom(host,list);
    else if(mode==='photobooth')renderPhotobooth(host,list);
  }

  function render(container){
    if(albumUnsub){try{albumUnsub()}catch(e){} albumUnsub=null;}
    container.innerHTML=`
      <div class="v3-album-hero">
        <div><div class="v3-album-k">V1 + V2 · COMPLETE PHOTO ARCHIVE</div><h1>OUR PHOTO ALBUM</h1><p>날짜에 흩어진 실제 사진을 한 권처럼. 원본 사진은 그대로 두고, 보기 방식과 기록만 더합니다.</p></div>
        <div class="v3-album-hero-actions"><button class="btn" id="v3AlbumAdd">＋ ADD PHOTOS</button><span id="v3AlbumCount">0 PHOTOS</span></div>
      </div>
      <div class="v3-album-filterbar">
        <input class="field" id="v3AlbumSearch" placeholder="날짜 · 장소 · 음식 · 느낌 · 캡션 검색" value="${esc(filters.search)}">
        <select class="field" id="v3AlbumType"><option value="">사진 종류 · 전체</option>${photoTypes().map(t=>`<option value="${esc(t)}" ${filters.type===t?'selected':''}>${esc(t)}</option>`).join('')}</select>
        <select class="field" id="v3AlbumMood"><option value="">느낌 · 전체</option>${photoMoods().map(m=>`<option value="${esc(m)}" ${filters.mood===m?'selected':''}>${esc(m)}</option>`).join('')}</select>
        <select class="field" id="v3AlbumMonth"><option value="">월 · 전체</option></select>
        <button class="btn btn-sm btn-outline" id="v3AlbumClear">필터 초기화</button>
      </div>
      <div class="v3-album-toolbar" id="v3AlbumToolbar">
        <button data-v3-album-mode="day">BY DAY</button>
        <button data-v3-album-mode="monthly">MONTHLY</button>
        <button data-v3-album-mode="contact">CONTACT SHEET</button>
        <button data-v3-album-mode="filmstrip">FILM STRIP · V1</button>
        <button data-v3-album-mode="filmviewer">FILM VIEWER · V2</button>
        <button data-v3-album-mode="places">PLACES</button>
        <button data-v3-album-mode="hero">★ HERO</button>
        <button data-v3-album-mode="bookpicks">BOOK PICKS</button>
        <button data-v3-album-mode="photobooth">네컷</button>
        <button data-v3-album-mode="random">🎲 RANDOM</button>
      </div>
      <div id="v3AlbumHost"><div class="empty-frame">사진을 모으는 중…</div></div>`;

    $('#v3AlbumAdd',container).addEventListener('click',()=>openUploader(localToday()));
    $('#v3AlbumSearch',container).addEventListener('input',e=>{filters.search=e.target.value.trim();draw(container)});
    $('#v3AlbumType',container).addEventListener('change',e=>{filters.type=e.target.value;draw(container)});
    $('#v3AlbumMood',container).addEventListener('change',e=>{filters.mood=e.target.value;draw(container)});
    $('#v3AlbumMonth',container).addEventListener('change',e=>{filters.month=e.target.value;draw(container)});
    $('#v3AlbumClear',container).addEventListener('click',()=>{filters.search='';filters.type='';filters.mood='';filters.month='';render(container)});
    $$('[data-v3-album-mode]',container).forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.v3AlbumMode;filmIndex=0;randomId=null;draw(container)}));

    albumUnsub=DB.onAllPhotos(rows=>{
      photoCache=rows||[]; updateMonthOptions(container); draw(container);
    });
  }

  // Replace only the Album view/API. Every other V2 view remains untouched.
  if(window.Router) Router.registerView('album',{render});
  window.AlbumView={openUploader,openLightbox,closeLightbox,openMetaEditor};
})();
