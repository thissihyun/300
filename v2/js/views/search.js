/* ================================================================
   GLOBAL MEMORY SEARCH (Section 62) — searches across EVENTS
   (title/story/chapter/kakao), photo metadata, and personal notes.
   ================================================================ */
(function(){
  let notesCache = [];
  let photosCache = [];
  if(window.DB){
    DB.onAllNotes(rows=>{ notesCache = rows; });
    DB.onAllPhotos(rows=>{ photosCache = rows; });
  }

  function buildIndex(){
    return Object.entries(window.EVENTS).map(([date,ev])=>{
      const kakaoText = (ev.kakao||[]).map(k=>k[1]).join(' ');
      const note = (notesCache.find(n=>n.date===date)||{}).text || '';
      const photoText = photosCache.filter(p=>p.date===date)
        .map(p=>[p.place,p.food,p.caption,...(p.moods||[])].join(' ')).join(' ');
      const haystack = [date, ev.title, ev.chapter, ev.story, kakaoText, note, photoText].join(' ').toLowerCase();
      return {date, title:ev.title, chapter:ev.chapter, haystack};
    });
  }

  function render(){
    const results = document.getElementById('searchResults');
    if(!results) return;
    const q = (document.getElementById('globalSearchInput').value || '').trim().toLowerCase();
    if(!q){ results.innerHTML = '<div class="empty-frame">첫눈, MoMA, 사랑해, 부산… 무엇이든 검색해보세요.</div>'; return; }
    const matches = buildIndex().filter(r=>r.haystack.includes(q)).sort((a,b)=>a.date<b.date?1:-1).slice(0,40);
    results.innerHTML = matches.length ? `<div class="card">${matches.map(r=>`
      <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${r.date}">
        <div class="list-date">${r.date.slice(5)}</div>
        <div style="flex:1;text-align:left;margin-left:14px;">
          <div style="font-family:var(--serif);">${escapeHtml(r.title)}</div>
          <div class="section-note">${escapeHtml(r.chapter)}</div>
        </div>
      </button>`).join('')}</div>`
      : '<div class="empty-frame">해당 기억을 찾지 못했어요.<br>다른 단어나 날짜로 검색해봐.</div>';
  }

  function open(){
    document.getElementById('searchModal').classList.add('is-open');
    document.body.classList.add('modal-open');
    const input = document.getElementById('globalSearchInput');
    input.value = '';
    render();
    setTimeout(()=> input.focus(), 60);
  }

  document.addEventListener('input', (e)=>{ if(e.target.id === 'globalSearchInput') render(); });

  window.RouterActions = window.RouterActions || {};
  window.RouterActions['open-search'] = open;
  window.SearchView = {open};
})();
