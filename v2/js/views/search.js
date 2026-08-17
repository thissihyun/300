/* ================================================================
   GLOBAL MEMORY SEARCH (Section 62) — searches across EVENTS
   (title/story/chapter/kakao), photo metadata, personal notes, and —
   once loaded — the full 89,251-message Kakao archive (fullchat.js),
   so this reaches every real day of chat, not just the curated ones.
   ================================================================ */
(function(){
  let notesCache = [];
  let photosCache = [];
  if(window.DB){
    DB.onAllNotes(rows=>{ notesCache = rows; });
    DB.onAllPhotos(rows=>{ photosCache = rows; });
  }

  function buildIndex(){
    const fullData = window.FULL_CHAT_DATA || null;
    const dates = new Set(Object.keys(window.EVENTS));
    if(fullData) Object.keys(fullData).forEach(d=>dates.add(d));
    return [...dates].map(date=>{
      const ev = window.EVENTS[date];
      const kakaoText = ev ? (ev.kakao||[]).map(k=>k[1]).join(' ') : '';
      const fullMsgs = fullData && fullData[date] ? fullData[date] : [];
      const fullText = fullMsgs.map(m=>m.t).join(' ');
      const note = (notesCache.find(n=>n.date===date)||{}).text || '';
      const photoText = photosCache.filter(p=>p.date===date)
        .map(p=>[p.place,p.food,p.caption,...(p.moods||[])].join(' ')).join(' ');
      const haystack = [date, ev&&ev.title, ev&&ev.chapter, ev&&ev.story, kakaoText, fullText, note, photoText].filter(Boolean).join(' ').toLowerCase();
      return {date, title: ev ? ev.title : 'This day is still being written', chapter: ev ? ev.chapter : '', fullMsgs, haystack};
    });
  }

  // Pull one real line of chat to show under the title, so a match isn't just a date.
  function snippetFor(r, q){
    const hit = r.fullMsgs.find(m=>m.t.toLowerCase().includes(q));
    if(hit) return `${hit.s} · ${hit.t.length>60?hit.t.slice(0,60)+'…':hit.t}`;
    return r.chapter;
  }

  function render(){
    const results = document.getElementById('searchResults');
    if(!results) return;
    const q = (document.getElementById('globalSearchInput').value || '').trim().toLowerCase();
    if(!q){ results.innerHTML = '<div class="empty-frame">첫눈, MoMA, 사랑해, 부산… 무엇이든 검색해보세요.</div>'; return; }
    const matches = buildIndex().filter(r=>r.haystack.includes(q)).sort((a,b)=>a.date<b.date?1:-1).slice(0,60);
    const note = window.FULL_CHAT_DATA ? '' : '<div class="section-note" style="margin-bottom:8px;">실제 카톡 전체 기록을 불러오는 중…</div>';
    results.innerHTML = (matches.length ? note + `<div class="card">${matches.map(r=>`
      <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${r.date}">
        <div class="list-date">${r.date.slice(5)}</div>
        <div style="flex:1;text-align:left;margin-left:14px;">
          <div style="font-family:var(--serif);">${escapeHtml(r.title)}</div>
          <div class="section-note">${escapeHtml(snippetFor(r, q))}</div>
        </div>
      </button>`).join('')}</div>`
      : (note || '<div class="empty-frame">해당 기억을 찾지 못했어요.<br>다른 단어나 날짜로 검색해봐.</div>'));
  }

  function open(){
    document.getElementById('searchModal').classList.add('is-open');
    document.body.classList.add('modal-open');
    const input = document.getElementById('globalSearchInput');
    input.value = '';
    render();
    setTimeout(()=> input.focus(), 60);
    if(window.FullChat) window.FullChat.load().then(render);
  }

  document.addEventListener('input', (e)=>{ if(e.target.id === 'globalSearchInput') render(); });

  window.RouterActions = window.RouterActions || {};
  window.RouterActions['open-search'] = open;
  window.SearchView = {open};
})();
