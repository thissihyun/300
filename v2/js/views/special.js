/* ================================================================
   SPECIAL — hub + subviews. Every card here is driven by real data
   (EVENTS / FIRSTS / WORDS / Firestore reactions) — nothing invented.
   ================================================================ */
(function(){
  const HUB = [
    {key:'firsts', n:'01', t:'OUR FIRSTS', s:'처음들의 타임라인.'},
    {key:'constellation', n:'02', t:'OUR CONSTELLATION', s:'중요한 날들을 별로 이은 우리 밤하늘.'},
    {key:'liveagain', n:'03', t:"THE DATES I'D LIVE AGAIN", s:'다시 살고 싶은 날들.'},
    {key:'places', n:'04', t:'OUR NEW YORK', s:'장소로 다시 보는 우리.'},
    {key:'words', n:'05', t:'WORDS THAT BECAME OURS', s:'둘만의 단어.'},
    {key:'seasons', n:'06', t:'THE SEASONS WE SHARED', s:'가을 뉴욕에서 여름의 300일까지.'},
    {key:'food', n:'07', t:'OUR LOVE LANGUAGE WAS “밥 먹자”', s:'함께 먹은 음식들.'},
    {key:'numbers', n:'08', t:'US, BY THE NUMBERS', s:'관계를 숫자로.'},
    {key:'photobooth', n:'09', t:'PHOTOBOOTH ARCHIVE', s:'네컷 모음.'},
    {key:'awards', n:'10', t:'OUR MINI AWARDS', s:'둘만의 시상식.'},
    {key:'favorites', n:'11', t:'OUR FAVORITES ♥', s:'즐겨찾기한 기억들.'},
    {key:'liked', n:'12', t:'DAYS WE BOTH LOVED', s:'각자, 그리고 함께 좋아한 날.'},
  ];
  const MORE = [
    {key:'funny', t:'Funny & Inside Jokes'},
    {key:'beforecame', t:'Before / Came True'},
  ];

  function renderHub(){
    const hub = document.getElementById('specialHub');
    hub.innerHTML = `
      <div class="section-head"><div class="section-title">SPECIAL FEATURES</div><div class="section-note">Our little museum.</div></div>
      <div class="grid grid-3">${HUB.map(h=>`
        <button class="card card-btn hub-card" data-action="special" data-target="${h.key}">
          <div class="n">${h.n} · ${escapeHtml(h.t.split(' ')[0])}</div>
          <div class="t">${escapeHtml(h.t)}</div>
          <div class="s">${escapeHtml(h.s)}</div>
        </button>`).join('')}</div>
      <div class="section-head" style="margin-top:28px;"><div class="section-title" style="font-size:17px;">MORE OF US</div></div>
      <div class="grid grid-3">${MORE.map(m=>`
        <button class="card card-btn hub-card" data-action="special" data-target="${m.key}"><div class="t">${escapeHtml(m.t)}</div></button>`).join('')}</div>
    `;
  }

  function subHeader(title, sub){
    return `<button class="btn btn-sm btn-outline" data-action="special-back">← SPECIAL</button>
      <div class="section-head" style="margin-top:14px;"><div class="section-title">${escapeHtml(title)}</div>${sub?`<div class="section-note">${escapeHtml(sub)}</div>`:''}</div>`;
  }

  /* ---- OUR FIRSTS ---- */
  Router.registerSpecial('firsts', {render(host){
    host.innerHTML = subHeader('OUR FIRSTS') + `<div class="grid grid-3">${window.FIRSTS.map(([date,label])=>`
      <button class="card card-btn hub-card" data-action="memory" data-date="${date}">
        <div class="empty-frame" style="height:90px; display:flex; align-items:center; justify-content:center; margin-bottom:8px;">▣</div>
        <div class="t">${escapeHtml(label)}</div><div class="s">${date}</div>
      </button>`).join('')}</div>`;
  }});

  /* ---- CONSTELLATION ---- */
  Router.registerSpecial('constellation', {render(host){
    const pts = window.FIRSTS.map((f,i)=>{
      const n = window.FIRSTS.length, W=800, H=460;
      const t = n>1 ? i/(n-1) : 0;
      const x = 40 + t*(W-80);
      const y = H/2 + Math.sin(i*1.9)*120 + Math.cos(i*0.7)*40;
      return {x,y,date:f[0],label:f[1]};
    });
    let seed=42; function rnd(){ seed=(seed*9301+49297)%233280; return seed/233280; }
    let bgDots=''; for(let i=0;i<60;i++){ const bx=rnd()*800, by=rnd()*460, r=.6+rnd()*1.2, op=.15+rnd()*.35;
      bgDots += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${r.toFixed(2)}" fill="#f6f1e6" opacity="${op.toFixed(2)}"/>`; }
    const line = pts.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
    const stars = pts.map((p,i)=>`<g data-action="memory" data-date="${p.date}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})" style="cursor:pointer;">
        <circle r="7" fill="#c8a24a" opacity="0.25"/><circle r="3.2" fill="#fff8e6" stroke="#c8a24a" stroke-width="1"/>
        <text x="0" y="${i%2===0?-14:22}" text-anchor="middle" font-size="10" fill="#f6f1e6">${escapeHtml(p.label)}</text></g>`).join('');
    host.innerHTML = subHeader('OUR CONSTELLATION') + `
      <div class="card" style="background:#2c2418; padding:0; overflow:hidden;">
        <svg viewBox="0 0 800 460" preserveAspectRatio="xMidYMid meet" style="width:100%; display:block;">
          <rect width="800" height="460" fill="#2c2418"/>${bgDots}
          <path d="${line}" fill="none" stroke="#c8a24a" stroke-width="1" opacity="0.35" stroke-dasharray="2 4"/>${stars}
        </svg>
      </div>`;
  }});

  /* ---- THE DATES I'D LIVE AGAIN (favorited days as posters) ---- */
  Router.registerSpecial('liveagain', {render(host){
    host.innerHTML = subHeader("THE DATES I'D LIVE AGAIN") + '<div id="liveAgainGrid" class="grid grid-3"></div>';
    DB.onAllFavorites(rows=>{
      const favDates = rows.filter(r=>r.value).map(r=>r.date).filter(d=>window.EVENTS[d]);
      const grid = host.querySelector('#liveAgainGrid');
      if(!grid) return;
      if(!favDates.length){ grid.innerHTML = '<div class="empty-frame" style="grid-column:1/-1;">아직 다시 살고 싶은 날로 표시한 기억이 없어요. Memory Detail에서 ♥ Favorite을 눌러보세요.</div>'; return; }
      grid.innerHTML = favDates.map(d=>`
        <button class="card card-btn" style="background:#1c1712; color:#f6f1e6; text-align:center;" data-action="memory" data-date="${d}">
          <div class="empty-frame" style="height:140px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; border-color:#5a4c33;">▣</div>
          <div style="font-family:var(--serif); font-size:16px;">${escapeHtml(window.EVENTS[d].title)}</div>
          <div style="font-size:11px; color:#c8a24a; margin-top:4px;">${d}</div>
        </button>`).join('');
    });
  }});

  /* ---- OUR NEW YORK / PLACES ---- */
  Router.registerSpecial('places', {render(host){
    host.innerHTML = subHeader('OUR NEW YORK', 'A city full of places, somehow becoming full of us.') +
      `<div class="grid grid-3">${window.PLACES.map(p=>`
        <button class="card card-btn hub-card" data-action="memory" data-date="${p.date}">
          <div class="t">${escapeHtml(p.name)}</div><div class="s">${p.date}${window.EVENTS[p.date]?' · '+escapeHtml(window.EVENTS[p.date].title):''}</div>
        </button>`).join('')}</div>
      <div class="section-head" style="margin-top:26px;"><div class="section-title" style="font-size:17px;">CITIES WE SHARED</div></div>
      <div class="grid grid-3">${window.CITIES.map(c=>{
        const first = Object.keys(window.EVENTS).sort().find(d=>c.filter(d));
        return `<button class="card card-btn hub-card" ${first?`data-action="memory" data-date="${first}"`:''}><div class="t">${escapeHtml(c.name)}</div></button>`;
      }).join('')}</div>`;
  }});

  /* ---- WORDS THAT BECAME OURS ---- */
  Router.registerSpecial('words', {render(host){
    host.innerHTML = subHeader('WORDS THAT BECAME OURS') + `<div class="mood-grid" id="wordChips" style="margin-bottom:16px;">
      ${window.WORDS.map(w=>`<button class="chip" data-word="${w}">${escapeHtml(w)} <span class="section-note">${(window.BASELINE_STATS.words[w]||0)}</span></button>`).join('')}
      </div><div id="wordDetail"></div>`;
    host.querySelectorAll('[data-word]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        host.querySelectorAll('[data-word]').forEach(b=>b.classList.toggle('is-selected', b===btn));
        const w = btn.dataset.word;
        const dates = Object.entries(window.EVENTS).filter(([,ev])=>(ev.kakao||[]).some(([,t])=>t.includes(w)));
        const detail = host.querySelector('#wordDetail');
        detail.innerHTML = `<div class="card">
          <div class="eyebrow">“${escapeHtml(w)}” · 총 ${window.BASELINE_STATS.words[w]||0}회 (전체 카톡 기준)</div>
          ${dates.length ? dates.map(([d,ev])=>`
            <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${d}">
              <div class="list-date">${d.slice(5)}</div>
              <div style="flex:1;text-align:left;margin-left:14px;">${escapeHtml(ev.kakao.find(([,t])=>t.includes(w))[1])}</div>
            </button>`).join('') : '<div class="empty-frame">큐레이션된 대화에는 등장하지 않아요.</div>'}
        </div>`;
      });
    });
  }});

  /* ---- SEASONS ---- */
  Router.registerSpecial('seasons', {render(host){
    const entries = Object.entries(window.EVENTS).sort((a,b)=>a[0]<b[0]?-1:1);
    host.innerHTML = subHeader('THE SEASONS WE SHARED') + window.SEASONS.map(s=>{
      const matches = entries.filter(([k])=>s.months.includes(parseInt(k.split('-')[1],10)));
      return `<div class="section">
        <div class="eyebrow">${s.icon} ${s.label}</div>
        <div class="section-note" style="margin-bottom:10px;">${escapeHtml(s.quote)}</div>
        <div class="grid grid-4">${matches.slice(0,8).map(([d,ev])=>`
          <button class="card card-btn hub-card" data-action="memory" data-date="${d}"><div class="t" style="font-size:14px;">${escapeHtml(ev.title)}</div><div class="s">${d}</div></button>`).join('') || '<div class="empty-frame">기록 없음</div>'}</div>
      </div>`;
    }).join('');
  }});

  /* ---- FOOD ---- */
  Router.registerSpecial('food', {render(host){
    host.innerHTML = subHeader('OUR LOVE LANGUAGE WAS “밥 먹자”') + `<div class="grid grid-2">${window.FOOD_ENTRIES.map(f=>`
      <button class="card card-btn" data-action="memory" data-date="${f.date}">
        <div style="font-family:var(--serif); font-size:17px;">${escapeHtml(f.food)}</div>
        <div class="section-note">${escapeHtml(f.place)} · ${f.date}</div>
      </button>`).join('')}</div>`;
  }});

  /* ---- US BY THE NUMBERS ---- */
  Router.registerSpecial('numbers', {render(host){
    const days = Object.keys(window.EVENTS).length;
    const firsts = window.FIRSTS.length;
    const stats = window.BASELINE_STATS;
    host.innerHTML = subHeader('US, BY THE NUMBERS') + `<div class="report-grid">
      ${[
        [dayNumber(todayISO()), 'days together'],
        [days, 'recorded days'],
        [firsts, 'firsts'],
        [stats.total.toLocaleString(), 'kakao messages'],
        [stats.words['사랑해'], '“사랑해”'],
        [stats.words['보고싶어'], '“보고싶어”'],
      ].map(([v,l])=>`<div class="report-tile"><div class="val">${v}</div><div class="lbl">${escapeHtml(l)}</div></div>`).join('')}
    </div><div class="section-note" style="margin-top:10px;">카카오톡 통계는 ${stats.asOf} 업로드 기준이에요.</div>`;
  }});

  /* ---- PHOTOBOOTH ---- */
  Router.registerSpecial('photobooth', {render(host){
    host.innerHTML = subHeader('PHOTOBOOTH ARCHIVE', '인생네컷만 따로 모았어요.') +
      `<button class="btn btn-sm" id="pbUploadBtn">네컷 사진 추가</button><div id="pbGrid" class="grid grid-4" style="margin-top:12px;"></div>`;
    host.querySelector('#pbUploadBtn').addEventListener('click', ()=> window.AlbumView.openUploader(todayISO()));
    DB.onAllPhotos(photos=>{
      const grid = host.querySelector('#pbGrid');
      if(!grid) return;
      const strips = photos.filter(p=>p.type==='네컷').sort((a,b)=>a.date<b.date?1:-1);
      grid.innerHTML = strips.length ? strips.map(p=>`<div class="photo-frame"><img src="${p.url}" data-action="photo" data-url="${p.url}"></div>`).join('')
        : '<div class="empty-frame" style="grid-column:1/-1;">아직 네컷이 없어요. 사진을 추가하고 종류를 “네컷”으로 태그해보세요.</div>';
    });
  }});

  /* ---- MINI AWARDS ---- */
  Router.registerSpecial('awards', {render(host){
    host.innerHTML = subHeader('OUR MINI AWARDS') + window.AWARDS.map(a=>`
      <div class="section">
        <div class="eyebrow">${escapeHtml(a.title)}</div>
        <div class="grid grid-3" id="award-${a.id}" style="margin-top:8px;">
          ${a.candidates.map(d=>`<button class="card card-btn hub-card" data-award="${a.id}" data-cand="${d}">
            <div class="t" style="font-size:14px;">${escapeHtml((window.EVENTS[d]||{}).title||d)}</div><div class="s">${d}</div>
            <div class="section-note" data-votecount="${a.id}:${d}">0 votes</div>
          </button>`).join('')}
        </div>
      </div>`).join('');
    host.querySelectorAll('[data-award]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        DB.setAwardVote(btn.dataset.award, Identity.displayName(Identity.current()), btn.dataset.cand);
      });
    });
    DB.onAwardVotes(rows=>{
      window.AWARDS.forEach(a=>{
        a.candidates.forEach(d=>{
          const votes = rows.filter(r=>r.awardId===a.id && r.candidate===d);
          const el = host.querySelector(`[data-votecount="${a.id}:${d}"]`);
          if(el) el.textContent = `${votes.length} votes`;
        });
        const mine = rows.find(r=>r.awardId===a.id && r.user===Identity.displayName(Identity.current()));
        host.querySelectorAll(`[data-award="${a.id}"]`).forEach(b=>{
          b.classList.toggle('is-selected', mine && mine.candidate===b.dataset.cand);
        });
      });
    });
  }});

  /* ---- FAVORITES ---- */
  Router.registerSpecial('favorites', {render(host){
    host.innerHTML = subHeader('OUR FAVORITES ♥') + '<div id="favList" class="card"></div>';
    DB.onAllFavorites(rows=>{
      const list = host.querySelector('#favList');
      const favs = rows.filter(r=>r.value && window.EVENTS[r.date]).sort((a,b)=>a.date<b.date?1:-1);
      if(!list) return;
      list.innerHTML = favs.length ? favs.map(r=>`
        <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${r.date}">
          <div>${escapeHtml(window.EVENTS[r.date].title)}</div><div>${r.date} ♥</div>
        </button>`).join('') : '<div class="empty-frame">아직 즐겨찾기한 기억이 없어요.</div>';
    });
  }});

  /* ---- DAYS WE BOTH LOVED ---- */
  Router.registerSpecial('liked', {render(host){
    host.innerHTML = subHeader('DAYS WE BOTH LOVED') + `
      <div class="future-tabs">
        <button data-action="tab" data-group="liked" data-target="both" data-tabbtn="liked" class="is-active">둘 다 좋아한 날</button>
        <button data-action="tab" data-group="liked" data-target="sihyun" data-tabbtn="liked">시현이 좋아한 날</button>
        <button data-action="tab" data-group="liked" data-target="gangwon" data-tabbtn="liked">강원이 좋아한 날</button>
      </div>
      <div data-tabpanel="liked" data-panel="both" class="tab-panel is-active"></div>
      <div data-tabpanel="liked" data-panel="sihyun" class="tab-panel"></div>
      <div data-tabpanel="liked" data-panel="gangwon" class="tab-panel"></div>`;
    DB.onAllReactions(rows=>{
      const byDate = {};
      rows.filter(r=>r.liked).forEach(r=>{ (byDate[r.date]=byDate[r.date]||new Set()).add(r.user); });
      const listHtml = (dates)=> dates.length ? `<div class="card">${dates.map(d=>`
          <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${d}">
            <div>${escapeHtml((window.EVENTS[d]||{}).title||d)}</div><div>${d}</div>
          </button>`).join('')}</div>` : '<div class="empty-frame">아직 없어요.</div>';
      const both = Object.keys(byDate).filter(d=>byDate[d].size>=2);
      const s = Object.keys(byDate).filter(d=>byDate[d].has(Identity.displayName('sihyun')));
      const g = Object.keys(byDate).filter(d=>byDate[d].has(Identity.displayName('gangwon')));
      const p1 = host.querySelector('[data-panel="both"]'), p2 = host.querySelector('[data-panel="sihyun"]'), p3 = host.querySelector('[data-panel="gangwon"]');
      if(p1) p1.innerHTML = listHtml(both);
      if(p2) p2.innerHTML = listHtml(s);
      if(p3) p3.innerHTML = listHtml(g);
    });
  }});

  /* ---- FUNNY & INSIDE JOKES ---- */
  Router.registerSpecial('funny', {render(host){
    const funny = Object.entries(window.EVENTS).filter(([,ev])=>(ev.kakao||[]).some(([,t])=>t.includes('ㅋㅋ')));
    host.innerHTML = subHeader('Funny & Inside Jokes') + (funny.length ? `<div class="card">${funny.map(([d,ev])=>`
      <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${d}">
        <div class="list-date">${d.slice(5)}</div><div style="flex:1;text-align:left;margin-left:14px;">${escapeHtml(ev.title)}</div>
      </button>`).join('')}</div>` : '<div class="empty-frame">아직 없어요.</div>');
  }});

  /* ---- BEFORE / CAME TRUE ---- */
  Router.registerSpecial('beforecame', {render(host){
    host.innerHTML = subHeader('Before / Came True') + window.BEFORE_CAME_TRUE.map(b=>`
      <div class="grid grid-2" style="margin-bottom:16px;">
        <button class="card card-btn" data-action="memory" data-date="${b.beforeDate}">
          <div class="eyebrow">BEFORE</div><div style="font-family:var(--serif); margin:6px 0;">“${escapeHtml(b.beforeQuote)}”</div><div class="section-note">${b.beforeDate}</div>
        </button>
        <button class="card card-btn" data-action="memory" data-date="${b.trueDate}">
          <div class="eyebrow">CAME TRUE</div><div style="font-family:var(--serif); margin:6px 0;">${escapeHtml(b.trueLabel)}</div><div class="section-note">${b.trueDate}</div>
        </button>
      </div>`).join('');
  }});

  Router.registerView('special', {render(){ renderHub(); document.getElementById('specialHub').style.display=''; document.getElementById('specialDetailHost').style.display='none'; }});
})();
