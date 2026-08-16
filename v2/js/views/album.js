/* ================================================================
   PHOTO ALBUM — by day / places / book picks / contact sheet
   + multi-photo upload + metadata editor + lightbox
   Photos are never redrawn/altered. We only downscale for Firestore's
   1MB/doc limit (no Storage/Blaze on this project) — same framing,
   same content, smaller file.
   ================================================================ */
(function(){
  let unsub = [];
  function clearSub(){ unsub.forEach(f=>f&&f()); unsub=[]; }
  let mode = 'day';
  let allPhotos = [];

  function fileToDataURL(file, maxDim, quality){
    return new Promise((resolve, reject)=>{
      const img = new Image();
      const reader = new FileReader();
      reader.onload = ()=>{ img.onload = ()=>{
        let {width:w, height:h} = img;
        if(w > maxDim || h > maxDim){
          const scale = maxDim / Math.max(w,h);
          w = Math.round(w*scale); h = Math.round(h*scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      }; img.onerror = reject; img.src = reader.result; };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ---------- UPLOAD (Section 30) ---------- */
  function openUploader(defaultDate){
    const panel = document.getElementById('uploadPanel');
    panel.innerHTML = `
      <div class="modal-top"><button class="icon-btn" data-action="close-modal">✕</button></div>
      <h2 class="modal-title" style="font-size:22px;">ADD PHOTOS</h2>
      <div class="section-note">Save this day as it looked.</div>
      <div style="margin-top:14px;">
        <label class="section-note">저장할 날짜</label>
        <input class="field" type="date" id="uploadDate" value="${defaultDate||todayISO()}">
      </div>
      <div style="margin-top:12px;">
        <input type="file" id="uploadFiles" accept="image/*" multiple>
      </div>
      <div id="uploadProgress" class="section-note" style="margin-top:8px;"></div>
      <div id="uploadPreview" class="grid grid-3" style="margin-top:12px;"></div>
      <div style="margin-top:14px;"><button class="btn" id="uploadSaveBtn">사진 저장</button></div>
    `;
    let pending = [];
    panel.querySelector('#uploadFiles').addEventListener('change', async (e)=>{
      const files = Array.from(e.target.files || []);
      const progress = panel.querySelector('#uploadProgress');
      const preview = panel.querySelector('#uploadPreview');
      pending = [];
      preview.innerHTML = '';
      for(let i=0;i<files.length;i++){
        progress.textContent = `처리 중 ${i+1} / ${files.length} · ${files[i].name}`;
        const dataUrl = await fileToDataURL(files[i], 1600, 0.82);
        pending.push({dataUrl, place:'', food:'', type:'', moods:[], caption:''});
        const tile = document.createElement('div');
        tile.className = 'photo-frame';
        tile.innerHTML = `<img src="${dataUrl}">`;
        preview.appendChild(tile);
      }
      progress.textContent = `${files.length} PHOTOS ready`;
    });
    panel.querySelector('#uploadSaveBtn').addEventListener('click', async ()=>{
      if(!pending.length){ Router.toast('사진을 먼저 선택해주세요'); return; }
      const date = panel.querySelector('#uploadDate').value || todayISO();
      const existing = allPhotos.filter(p=>p.date===date);
      let firstHeroSet = existing.some(p=>p.hero);
      for(const p of pending){
        const isHero = !firstHeroSet;
        await DB.addPhoto({date, url:p.dataUrl, hero:isHero, bookPick:false, place:'', food:'', type:'', moods:[], caption:'', author:Identity.displayName(Identity.current())});
        firstHeroSet = true;
      }
      await DB.logActivity('photo', date, Identity.displayName(Identity.current()), `${pending.length}장 추가`);
      Router.toast('사진을 추가했어요');
      document.getElementById('uploadModal').classList.remove('is-open');
      document.body.classList.remove('modal-open');
    });
    document.getElementById('uploadModal').classList.add('is-open');
    document.body.classList.add('modal-open');
  }

  /* ---------- METADATA EDIT (Section 31) ---------- */
  function openMetaEditor(photo){
    const panel = document.getElementById('uploadPanel');
    panel.innerHTML = `
      <div class="modal-top"><button class="icon-btn" data-action="close-modal">✕</button></div>
      <h2 class="modal-title" style="font-size:20px;">About this photo</h2>
      <div class="photo-frame" style="max-width:220px; margin-bottom:12px;"><img src="${photo.url}"></div>
      <label class="section-note">장소</label>
      <input class="field" id="metaPlace" value="${escapeHtml(photo.place||'')}" placeholder="예: MoMA">
      <label class="section-note" style="display:block; margin-top:10px;">음식 / 메뉴</label>
      <input class="field" id="metaFood" value="${escapeHtml(photo.food||'')}" placeholder="예: Raku udon">
      <label class="section-note" style="display:block; margin-top:10px;">사진 종류</label>
      <div class="mood-grid" id="metaType">${window.PHOTO_TYPES.map(t=>`<button class="chip ${photo.type===t?'is-selected':''}" data-type="${t}">${t}</button>`).join('')}</div>
      <label class="section-note" style="display:block; margin-top:10px;">느낌</label>
      <div class="mood-grid" id="metaMoods">${window.PHOTO_MOODS.map(m=>`<button class="chip ${(photo.moods||[]).includes(m)?'is-selected':''}" data-mood-tag="${m}">${m}</button>`).join('')}</div>
      <label class="section-note" style="display:block; margin-top:10px;">한 줄 캡션</label>
      <input class="field" id="metaCaption" value="${escapeHtml(photo.caption||'')}">
      <div style="margin-top:14px; display:flex; gap:8px;">
        <button class="btn btn-sm" id="metaSaveBtn">저장</button>
        <button class="btn btn-sm btn-outline" id="metaHeroBtn">★ HERO로 설정</button>
        <button class="btn btn-sm btn-outline" id="metaBookBtn">${photo.bookPick?'B BOOK PICK 해제':'B BOOK PICK'}</button>
      </div>
    `;
    let type = photo.type || '';
    const moods = new Set(photo.moods || []);
    panel.querySelectorAll('#metaType [data-type]').forEach(b=>b.addEventListener('click', ()=>{
      type = b.dataset.type;
      panel.querySelectorAll('#metaType [data-type]').forEach(x=>x.classList.toggle('is-selected', x===b));
    }));
    panel.querySelectorAll('#metaMoods [data-mood-tag]').forEach(b=>b.addEventListener('click', ()=>{
      const m = b.dataset.moodTag;
      if(moods.has(m)){ moods.delete(m); b.classList.remove('is-selected'); } else { moods.add(m); b.classList.add('is-selected'); }
    }));
    panel.querySelector('#metaSaveBtn').addEventListener('click', async ()=>{
      await DB.updatePhoto(photo.id, {
        place: panel.querySelector('#metaPlace').value.trim(),
        food: panel.querySelector('#metaFood').value.trim(),
        type, moods:[...moods],
        caption: panel.querySelector('#metaCaption').value.trim(),
      });
      Router.toast('사진 정보를 저장했어요');
      document.getElementById('uploadModal').classList.remove('is-open');
      document.body.classList.remove('modal-open');
    });
    panel.querySelector('#metaHeroBtn').addEventListener('click', async ()=>{
      const sameDay = allPhotos.filter(p=>p.date===photo.date);
      await Promise.all(sameDay.map(p=> DB.updatePhoto(p.id, {hero: p.id===photo.id})));
      Router.toast('대표 사진으로 설정했어요');
    });
    panel.querySelector('#metaBookBtn').addEventListener('click', async ()=>{
      await DB.updatePhoto(photo.id, {bookPick: !photo.bookPick});
      Router.toast(photo.bookPick ? '북픽 해제' : '포토북 후보로 저장했어요');
      document.getElementById('uploadModal').classList.remove('is-open');
      document.body.classList.remove('modal-open');
    });
    document.getElementById('uploadModal').classList.add('is-open');
    document.body.classList.add('modal-open');
  }

  /* ---------- LIGHTBOX (Section 42) ---------- */
  function openLightbox(url, caption){
    document.getElementById('lightboxImg').src = url;
    document.getElementById('lightboxModal').classList.add('is-open');
    document.body.classList.add('modal-open');
  }
  function closeLightbox(){
    document.getElementById('lightboxModal').classList.remove('is-open');
    document.getElementById('lightboxImg').src = '';
    document.body.classList.remove('modal-open');
  }

  /* ---------- ALBUM VIEWS ---------- */
  function tile(p){
    return `<div class="photo-frame">
      ${p.hero?'<div class="hero-flag">HERO</div>':''}
      <img src="${p.url}" data-action="photo" data-url="${p.url}">
      <button class="icon-btn" style="position:absolute; bottom:4px; right:4px; width:28px; height:28px; font-size:11px;" data-tag-id="${p.id}">✎</button>
    </div>`;
  }

  function renderByDay(host){
    if(!allPhotos.length){ host.innerHTML = '<div class="empty-frame">아직 앨범에 사진이 없어요.</div>'; return; }
    const byDate = {};
    allPhotos.forEach(p=>{ (byDate[p.date]=byDate[p.date]||[]).push(p); });
    const dates = Object.keys(byDate).sort((a,b)=>a<b?1:-1);
    host.innerHTML = dates.map(date=>`
      <div class="section">
        <div class="section-head"><div class="eyebrow" style="cursor:pointer;" data-action="memory" data-date="${date}">${date} · ${escapeHtml((window.EVENTS[date]||{}).title||'')}</div></div>
        <div class="grid grid-4">${byDate[date].map(tile).join('')}</div>
      </div>`).join('');
  }
  function renderPlaces(host){
    const withPlace = allPhotos.filter(p=>p.place);
    if(!withPlace.length){ host.innerHTML = '<div class="empty-frame">장소 태그가 달린 사진이 아직 없어요. 사진의 ✎ 버튼으로 장소를 남겨보세요.</div>'; return; }
    const byPlace = {};
    withPlace.forEach(p=>{ (byPlace[p.place]=byPlace[p.place]||[]).push(p); });
    host.innerHTML = Object.entries(byPlace).map(([place,ps])=>`
      <div class="section"><div class="eyebrow">${escapeHtml(place)}</div><div class="grid grid-4">${ps.map(tile).join('')}</div></div>
    `).join('');
  }
  function renderBookPicks(host){
    const picks = allPhotos.filter(p=>p.bookPick);
    if(!picks.length){ host.innerHTML = '<div class="empty-frame">아직 포토북 후보가 없어요.</div>'; return; }
    host.innerHTML = `<div class="grid grid-4">${picks.map(tile).join('')}</div>`;
  }
  function renderContact(host){
    if(!allPhotos.length){ host.innerHTML = '<div class="empty-frame">아직 앨범에 사진이 없어요.</div>'; return; }
    const sorted = [...allPhotos].sort((a,b)=>a.date<b.date?-1:1);
    host.innerHTML = `<div class="contact-sheet">${sorted.map(p=>`<div class="contact-tile"><img src="${p.url}" data-action="photo" data-url="${p.url}"></div>`).join('')}</div>`;
  }

  function draw(host, searchTerm, typeFilter){
    let list = allPhotos;
    if(searchTerm){
      const q = searchTerm.toLowerCase();
      list = list.filter(p=>{
        const ev = window.EVENTS[p.date] || {};
        return [p.date, ev.title, p.place, p.food, p.caption, ...(p.moods||[])].join(' ').toLowerCase().includes(q);
      });
    }
    if(typeFilter) list = list.filter(p=>p.type===typeFilter);
    const prevAll = allPhotos; allPhotos = list;
    if(mode==='day') renderByDay(host);
    else if(mode==='places') renderPlaces(host);
    else if(mode==='bookpicks') renderBookPicks(host);
    else renderContact(host);
    allPhotos = prevAll;
    host.querySelectorAll('[data-tag-id]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const p = allPhotos.find(x=>x.id===btn.dataset.tagId);
        if(p) openMetaEditor(p);
      });
    });
  }

  function render(container){
    clearSub();
    container.innerHTML = `
      <div class="section-head">
        <div class="section-title">OUR PHOTO ALBUM</div>
        <div class="section-note">A book that keeps growing.</div>
      </div>
      <input class="field" id="albumSearch" placeholder="날짜 · 장소 · 음식 · 느낌 · 캡션 검색" style="margin-bottom:12px;">
      <div class="album-toolbar" id="modeToolbar">
        <button data-mode="day" class="is-active">BY DAY</button>
        <button data-mode="places">PLACES</button>
        <button data-mode="bookpicks">BOOK PICKS</button>
        <button data-mode="contact">CONTACT SHEET</button>
      </div>
      <div id="albumHost"></div>
    `;
    const host = container.querySelector('#albumHost');
    container.querySelectorAll('#modeToolbar button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        mode = btn.dataset.mode;
        container.querySelectorAll('#modeToolbar button').forEach(b=>b.classList.toggle('is-active', b===btn));
        draw(host, container.querySelector('#albumSearch').value.trim());
      });
    });
    container.querySelector('#albumSearch').addEventListener('input', (e)=> draw(host, e.target.value.trim()));

    unsub.push(DB.onAllPhotos(photos=>{
      allPhotos = photos;
      draw(host, container.querySelector('#albumSearch').value.trim());
    }));
  }

  Router.registerView('album', {render});
  window.AlbumView = {openUploader, openLightbox, closeLightbox};
})();
