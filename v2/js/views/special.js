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
    {key:'pulse', n:'13', t:'RELATIONSHIP PULSE', s:'월별 애정/긴장 표현 그래프.'},
    {key:'kakao', n:'14', t:'KAKAO IMPORT', s:'카톡 .txt를 올려서 통계를 갱신해요.'},
    {key:'thanksarchive', n:'15', t:'300 DAYS OF 고마워', s:'우리가 남긴 모든 감사를 검색해요.'},
    {key:'stats', n:'16', t:'OUR STATS', s:'연속 기록, 감정 믹스, 30일 히트맵.'},
    {key:'likedkakao', n:'17', t:'LIKED KAKAO MESSAGES', s:'저장해둔 카톡 한 줄들.'},
  ];
  const MORE = [
    {key:'funny', t:'Funny & Inside Jokes'},
    {key:'beforecame', t:'Before / Came True'},
  ];
  // Exposed so the global Archive Drawer (app.js) can list every special
  // page without duplicating this catalogue.
  window.SPECIAL_HUB = HUB.concat(MORE);

  // Live Kakao import stats (Section 53/54), once uploaded, override the
  // ported BASELINE_STATS/PULSE_BASELINE everywhere they're shown.
  let liveKakaoStats = null;
  if(window.DB) DB.onKakaoStats(d=>{ liveKakaoStats = d; });

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

  /* ---- OUR FIRSTS (stamp-in as each card scrolls into view) ---- */
  Router.registerSpecial('firsts', {render(host){
    host.innerHTML = subHeader('OUR FIRSTS') + `<div class="grid grid-3">${window.FIRSTS.map(([date,label])=>`
      <button class="card card-btn hub-card v2-stamp" data-action="memory" data-date="${date}">
        <div class="empty-frame" style="height:90px; display:flex; align-items:center; justify-content:center; margin-bottom:8px;">▣</div>
        <div class="t">${escapeHtml(label)}</div><div class="s">${date}</div>
      </button>`).join('')}</div>`;
    if(window.V2Anim) V2Anim.observeReveal(host.querySelectorAll('.v2-stamp'));
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

  /* ---- THE DATES I'D LIVE AGAIN (favorited days as flip-poster cards) ---- */
  Router.registerSpecial('liveagain', {render(host){
    const canHover = window.matchMedia && window.matchMedia('(hover:hover)').matches;
    host.innerHTML = subHeader("THE DATES I'D LIVE AGAIN", '다시 살고 싶은 날들을 영화 포스터처럼. 탭하면 뒤집혀요.') +
      `<div class="grid grid-3">${window.POSTERS.map(p=>`
        <div class="poster-flip" style="aspect-ratio:2/3;" data-poster-date="${p.date}">
          <div class="poster-flip-inner">
            <div class="poster-flip-front card" style="background:#1c1712; color:#f6f1e6; text-align:center; padding:16px;">
              <div class="empty-frame" style="height:140px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; border-color:#5a4c33;">▣</div>
              <div style="font-size:11px; color:#c8a24a; letter-spacing:.08em;">${escapeHtml(p.genre)}</div>
              <div style="font-family:var(--serif); font-size:17px; margin:4px 0;">${escapeHtml(p.title)}</div>
              <div style="font-family:var(--hand); font-size:12px; opacity:.85;">${escapeHtml(p.tagline)}</div>
              <div style="margin-top:6px; color:#e0917a;">${p.stars}</div>
              <div style="font-size:11px; color:#a99; margin-top:4px;">${p.date}</div>
            </div>
            <div class="poster-flip-back card" style="background:#2a231c; color:#f6f1e6; text-align:center; padding:16px;">
              <div style="font-family:var(--serif); font-size:16px;">${escapeHtml(p.title)}</div>
              <div class="section-note" style="color:#c9bfae;">${p.date}</div>
              <button class="btn btn-sm btn-gold" data-poster-play="${p.date}" style="margin-top:10px;">PLAY ▶</button>
            </div>
          </div>
        </div>`).join('')}</div>`;

    host.querySelectorAll('.poster-flip').forEach(card=>{
      const date = card.dataset.posterDate;
      card.addEventListener('click', (e)=>{
        if(e.target.closest('[data-poster-play]') || canHover){ Router.openMemory(date); return; }
        card.classList.toggle('is-flipped');
      });
    });
  }});

  /* ---- OUR NEW YORK / PLACES ---- */
  Router.registerSpecial('places', {render(host){
    host.innerHTML = subHeader('OUR NEW YORK', 'A city full of places, somehow becoming full of us.') +
      `<div id="nycMapWrap" class="card" style="padding:0; overflow:hidden;"></div>
      <div class="grid grid-3" id="placesFallback" style="margin-top:14px; display:none;"></div>
      <div class="section-head" style="margin-top:26px;"><div class="section-title" style="font-size:17px;">CITIES WE SHARED</div></div>
      <div class="grid grid-3">${window.CITIES.map(c=>{
        const clickable = !!c.date;
        return `<button class="card ${clickable?'card-btn':''} hub-card" ${clickable?`data-action="memory" data-date="${c.date}"`:'disabled style="opacity:.55; cursor:default;"'}>
          <div class="t">${c.icon} ${escapeHtml(c.name)}</div>${clickable?`<div class="s">${c.date}</div>`:'<div class="s">아직 못 가본 곳</div>'}
        </button>`;
      }).join('')}</div>`;

    const mapWrap = host.querySelector('#nycMapWrap');
    const fallback = host.querySelector('#placesFallback');
    if(window.L && mapWrap){
      mapWrap.style.height = '420px';
      const map = L.map(mapWrap, {scrollWheelZoom:false}).setView([40.745,-73.98], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:'&copy; OpenStreetMap', maxZoom:18,
      }).addTo(map);
      window.PLACES.forEach(p=>{
        const marker = L.marker([p.lat, p.lng]).addTo(map);
        const latest = p.dates[p.dates.length-1];
        const popupHtml = `<div style="text-align:center; font-family:var(--serif);">
          <div style="font-weight:700; margin-bottom:4px;">${escapeHtml(p.name)}</div>
          <div style="font-size:11px; color:var(--ink-soft); margin-bottom:6px;">${p.dates.join(' · ')}</div>
          <div class="map-visited-stamp">VISITED</div><br>
          <button class="popup-open-btn" style="border:1px solid var(--line); background:var(--paper); border-radius:999px; padding:4px 10px; font-size:11px; margin-top:6px;">열기</button>
        </div>`;
        marker.bindPopup(popupHtml);
        // Leaflet stops click propagation inside popups, so the document-level
        // router delegate never sees this button — bind it directly instead.
        marker.on('popupopen', (e)=>{
          const btn = e.popup.getElement().querySelector('.popup-open-btn');
          if(btn) btn.addEventListener('click', ()=> Router.openMemory(latest));
        });
      });
      // animated thread connecting every place in visiting order (earliest date first)
      try{
        const ordered = window.PLACES.slice().sort((a,b)=> (a.dates[0]||'') < (b.dates[0]||'') ? -1 : 1);
        const line = L.polyline(ordered.map(p=>[p.lat,p.lng]), {color:'#a5372c', weight:2, opacity:.55, dashArray:'1,1'}).addTo(map);
        const pathEl = line.getElement && line.getElement();
        if(pathEl && pathEl.getTotalLength){
          const len = pathEl.getTotalLength();
          pathEl.style.strokeDasharray = len;
          pathEl.style.strokeDashoffset = len;
          pathEl.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.22,.9,.25,1)';
          requestAnimationFrame(()=> requestAnimationFrame(()=>{ pathEl.style.strokeDashoffset = 0; }));
        }
      }catch(e){ console.warn('[places] thread line skipped', e); }
    } else if(mapWrap){
      mapWrap.style.display = 'none';
      fallback.style.display = '';
      fallback.innerHTML = window.PLACES.map(p=>{
        const latest = p.dates[p.dates.length-1];
        return `<button class="card card-btn hub-card" data-action="memory" data-date="${latest}">
          <div class="t">${escapeHtml(p.name)}</div><div class="s">${p.dates.join(' · ')}</div>
          <div class="map-visited-stamp">VISITED</div>
        </button>`;
      }).join('');
    }
  }});

  /* ---- WORDS THAT BECAME OURS ----
     Shows curated EVENTS.kakao hits immediately, then upgrades in place to
     every real occurrence across the full 89,251-message archive once
     fullchat.js finishes loading (Section 1 gap: v1 could search the whole
     export, v2 previously only knew about the small curated subset). */
  const WORDS_MAX_ROWS = 120;
  Router.registerSpecial('words', {render(host){
    host.innerHTML = subHeader('WORDS THAT BECAME OURS') + `<div class="mood-grid" id="wordChips" style="margin-bottom:16px;">
      ${window.WORDS.map(w=>`<button class="chip" data-word="${w}">${escapeHtml(w)} <span class="section-note">${(window.BASELINE_STATS.words[w]||0)}</span></button>`).join('')}
      </div><div id="wordDetail"></div>`;

    let activeWord = null;
    function draw(){
      if(!activeWord) return;
      const w = activeWord;
      const detail = host.querySelector('#wordDetail');
      if(!detail) return;
      const full = window.FullChat && window.FullChat.ready ? window.FullChat.allMessages().filter(m=>m.text.includes(w)) : null;
      const rows = full
        ? full.slice().sort((a,b)=>a.date<b.date?1:-1)
        : Object.entries(window.EVENTS).filter(([,ev])=>(ev.kakao||[]).some(([,t])=>t.includes(w)))
            .map(([d,ev])=>({date:d, speaker:ev.kakao.find(([,t])=>t.includes(w))[0], text:ev.kakao.find(([,t])=>t.includes(w))[1]}));
      const total = full ? full.length : (window.BASELINE_STATS.words[w]||0);
      const shown = rows.slice(0, WORDS_MAX_ROWS);
      detail.innerHTML = `<div class="card">
        <div class="eyebrow">“${escapeHtml(w)}” · 총 ${total}회 ${full?'(실제 카톡 전체 기준)':'(불러오는 중… 우선 큐레이션된 기록만 보여요)'}</div>
        ${shown.length ? shown.map(r=>`
          <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${r.date}">
            <div class="list-date">${r.date.slice(5)}</div>
            <div style="flex:1;text-align:left;margin-left:14px;"><span class="section-note">${escapeHtml(r.speaker||'')}</span> ${escapeHtml(r.text)}</div>
          </button>`).join('') : '<div class="empty-frame">아직 등장하지 않아요.</div>'}
        ${rows.length > shown.length ? `<div class="section-note" style="padding:10px 2px;">+ ${rows.length-shown.length}개 더 (날짜순 최근 ${WORDS_MAX_ROWS}개만 표시)</div>` : ''}
      </div>`;
    }
    host.querySelectorAll('[data-word]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        host.querySelectorAll('[data-word]').forEach(b=>b.classList.toggle('is-selected', b===btn));
        activeWord = btn.dataset.word;
        draw();
      });
    });
    if(window.FullChat) window.FullChat.load().then(draw);
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
    const stats = liveKakaoStats || window.BASELINE_STATS;
    const total = liveKakaoStats ? liveKakaoStats.total : window.BASELINE_STATS.total;
    const words = liveKakaoStats ? liveKakaoStats.words : window.BASELINE_STATS.words;
    const tiles = [
      [dayNumber(todayISO()), 'days together'],
      [days, 'recorded days'],
      [firsts, 'firsts'],
      [total, 'kakao messages'],
      [words['사랑해']||0, '“사랑해”'],
      [words['보고싶어']||0, '“보고싶어”'],
    ];
    host.innerHTML = subHeader('US, BY THE NUMBERS') + `<div class="report-grid">
      ${tiles.map(([v,l],i)=>`<div class="report-tile"><div class="val" data-countto="${v}">0</div><div class="lbl">${escapeHtml(l)}</div></div>`).join('')}
    </div><div class="section-note" style="margin-top:10px;">
      카카오톡 통계는 ${escapeHtml(stats.asOf)} ${liveKakaoStats?'업로드':'기준 값'}이에요.
      ${liveKakaoStats ? '' : '<button class="btn btn-sm btn-outline" style="margin-left:8px;" data-action="special" data-target="kakao">최신 카톡으로 갱신 →</button>'}
    </div>`;
    if(window.V2Anim) host.querySelectorAll('.report-tile .val[data-countto]').forEach(el=> V2Anim.countUp(el, +el.dataset.countto, {duration:1000}));
  }});

  /* ---- RELATIONSHIP PULSE (Section 54) ---- */
  Router.registerSpecial('pulse', {render(host){
    const rows = (liveKakaoStats && liveKakaoStats.pulse && liveKakaoStats.pulse.length) ? liveKakaoStats.pulse : window.PULSE_BASELINE;
    const W = 760, H = 320, PAD = 36;
    const maxV = Math.max(...rows.map(r=>Math.max(r[1],r[2]))) * 1.15 || 1;
    const stepX = rows.length>1 ? (W-PAD*2)/(rows.length-1) : 0;
    const toPt = (i,v)=> [PAD+i*stepX, H-PAD-(v/maxV)*(H-PAD*2)];
    const pathFor = (idx)=> rows.map((r,i)=>{ const [x,y]=toPt(i,r[idx]); return (i===0?'M':'L')+x.toFixed(1)+','+y.toFixed(1); }).join(' ');
    const dotsFor = (idx,color)=> rows.map((r,i)=>{ const [x,y]=toPt(i,r[idx]); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}"/>`; }).join('');
    const labels = rows.map((r,i)=>{ const [x]=toPt(i,0); return `<text x="${x.toFixed(1)}" y="${H-10}" font-size="10" text-anchor="middle" fill="var(--ink-soft)">${escapeHtml(String(r[0]).slice(2))}</text>`; }).join('');
    host.innerHTML = subHeader('RELATIONSHIP PULSE', '1,000 messages 당 애정/긴장 표현 빈도 — 긴장 지표는 실제 다툰 횟수가 아니라 참고용 heuristic이에요.') + `
      <div class="card">
        <div style="display:flex; gap:16px; margin-bottom:10px; font-size:12px;">
          <span style="color:var(--red);">● 애정 표현</span><span style="color:var(--blue);">● 긴장 표현</span>
          ${liveKakaoStats ? '<span class="section-note">(내 카톡 업로드 기준)</span>' : '<span class="section-note">(예전 기준값 — Kakao Import에서 갱신 가능)</span>'}
        </div>
        <svg viewBox="0 0 ${W} ${H}" style="width:100%; display:block;">
          <path d="${pathFor(1)}" fill="none" stroke="var(--red)" stroke-width="2"/>
          <path d="${pathFor(2)}" fill="none" stroke="var(--blue)" stroke-width="2"/>
          ${dotsFor(1,'var(--red)')}${dotsFor(2,'var(--blue)')}
          ${labels}
        </svg>
      </div>`;
  }});

  /* ---- KAKAO IMPORT (Section 53) ---- */
  Router.registerSpecial('kakao', {render(host){
    host.innerHTML = subHeader('KAKAO IMPORT', '실제 카카오톡 대화 내보내기(.txt)를 올리면 통계가 이 기기뿐 아니라 서로에게도 갱신돼요. 원문 메시지는 저장하지 않고, 집계된 숫자만 저장해요.') + `
      <div class="card">
        <input type="file" id="kakaoFile" accept=".txt">
        <div id="kakaoPreview" class="section-note" style="margin-top:10px;"></div>
        <button class="btn btn-sm" id="kakaoSaveBtn" style="margin-top:10px; display:none;">이 통계로 저장하기</button>
      </div>
      ${liveKakaoStats ? `<div class="section-note" style="margin-top:10px;">현재 저장된 통계: ${escapeHtml(liveKakaoStats.asOf)} 업로드 · 총 ${liveKakaoStats.total.toLocaleString()}개 메시지 · ${liveKakaoStats.byDays}일</div>` : ''}
    `;
    let pending = null;
    host.querySelector('#kakaoFile').addEventListener('change', async (e)=>{
      const file = e.target.files[0];
      const preview = host.querySelector('#kakaoPreview');
      const saveBtn = host.querySelector('#kakaoSaveBtn');
      if(!file) return;
      preview.textContent = '읽는 중...';
      saveBtn.style.display = 'none';
      const text = await file.text();
      const messages = window.KakaoParse.parseKakaoExport(text);
      if(!messages.length){
        preview.textContent = '이 파일에서 카카오톡 내보내기 형식을 인식하지 못했어요. 카카오톡 채팅방 → 설정 → 대화 내용 내보내기(.txt)로 받은 파일인지 확인해주세요.';
        return;
      }
      pending = window.KakaoParse.aggregate(messages);
      const [from,to] = pending.dateRange || ['',''];
      preview.innerHTML = `${pending.total.toLocaleString()}개 메시지 · ${pending.byDays}일 · ${escapeHtml(from)} ~ ${escapeHtml(to)}<br>
        말하는 사람: ${Object.entries(pending.bySpeaker).map(([k,v])=>`${escapeHtml(k)} ${v}`).join(' · ')}`;
      saveBtn.style.display = '';
    });
    host.querySelector('#kakaoSaveBtn').addEventListener('click', async ()=>{
      if(!pending) return;
      await DB.setKakaoStats(pending);
      await DB.logActivity('kakao', null, Identity.displayName(Identity.current()), `카톡 통계 갱신 · ${pending.total.toLocaleString()}개`);
      Router.toast('카톡 통계를 저장했어요');
    });
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
      grid.innerHTML = strips.length ? strips.map((p,i)=>`<div class=”photo-frame v2-print-in” style=”animation-delay:${Math.min(i*60,420)}ms;”><img src=”${p.url}” data-action=”photo” data-url=”${p.url}”></div>`).join('')
        : '<div class=”empty-frame” style=”grid-column:1/-1;”>아직 네컷이 없어요. 사진을 추가하고 종류를 “네컷”으로 태그해보세요.</div>';
    });
  }});

  /* ---- MINI AWARDS ---- */
  Router.registerSpecial('awards', {render(host){
    const ny = window.MOST_NY_DAY;
    host.innerHTML = subHeader('OUR MINI AWARDS') + `
      <div class="grid grid-2" id="awardsGrid">${window.AWARDS.map(a=>`
        <button class="card card-btn hub-card" data-action="memory" data-date="${a.date}">
          <div style="font-size:26px;">${a.trophy}</div>
          <div class="t" style="font-size:14px; text-transform:uppercase; letter-spacing:.04em;">${escapeHtml(a.title)}</div>
          <div style="font-family:var(--serif); font-style:italic; font-size:16px; margin-top:4px;">${escapeHtml((window.EVENTS[a.date]||{}).title||a.date)}</div>
          <div class="s">${a.date}</div>
          <div style="margin-top:8px; display:flex; gap:6px;" data-agree="${a.id}"></div>
        </button>`).join('')}</div>
      <div class="section-head" style="margin-top:24px;"><div class="section-title" style="font-size:16px;">가장 뉴욕다웠던 날</div></div>
      <button class="card card-btn" data-action="memory" data-date="${ny.date}">
        <div style="font-family:var(--serif); font-size:16px;">LAST DAY IN NEW YORK</div>
        <div class="section-note">${ny.date} · ${escapeHtml(ny.note)}</div>
      </button>`;

    // Mutual-agreement badge per award — each person taps "나도 동의해" independently.
    host.querySelectorAll('[data-agree]').forEach(el=>{
      const id = el.dataset.agree;
      el.innerHTML = `<button class="btn btn-sm btn-outline" data-agree-btn="${id}" style="pointer-events:auto;">나도 동의해</button>`;
      el.querySelector('button').addEventListener('click', (e)=>{
        e.stopPropagation();
        DB.setAwardVote(id, Identity.displayName(Identity.current()), 'agree');
      });
    });
    DB.onAwardVotes(rows=>{
      window.AWARDS.forEach(a=>{
        const agreed = rows.filter(r=>r.awardId===a.id && r.candidate==='agree').map(r=>r.user);
        const el = host.querySelector(`[data-agree="${a.id}"]`);
        if(!el) return;
        const both = agreed.includes(Identity.displayName('sihyun')) && agreed.includes(Identity.displayName('gangwon'));
        el.innerHTML = both
          ? `<span class="section-note">💛 둘 다 동의했어요</span>`
          : `<button class="btn btn-sm btn-outline" data-agree-btn="${a.id}">나도 동의해${agreed.length?` (${agreed.join(', ')} 동의함)`:''}</button>`;
        const btn = el.querySelector('button');
        if(btn) btn.addEventListener('click', (e)=>{ e.stopPropagation(); DB.setAwardVote(a.id, Identity.displayName(Identity.current()), 'agree'); });
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
    host.innerHTML = subHeader('Funny & Inside Jokes') + `
      <div class="grid grid-2">${window.FUNNY_MOMENTS.map(f=>`
        <button class="card card-btn" data-action="memory" data-date="${f.date}">
          <div class="section-note">${f.date}</div>
          <div style="font-family:var(--serif); font-style:italic; margin:6px 0;">“${escapeHtml(f.quote)}”</div>
          <div class="section-note">${escapeHtml(f.note)}</div>
        </button>`).join('')}</div>
      <div class="section-head" style="margin-top:24px;"><div class="section-title" style="font-size:16px;">INSIDE JOKES</div></div>
      <div class="mood-grid">${window.INSIDE_JOKES.map(j=>`
        <span class="chip" title="${escapeHtml(j.example)}">${escapeHtml(j.phrase)} <span class="section-note">×${j.count}</span></span>
      `).join('')}</div>
      <div class="section-note" style="margin-top:10px;">예시: ${window.INSIDE_JOKES.slice(0,3).map(j=>`"${escapeHtml(j.example)}"`).join(' · ')}</div>`;
  }});

  /* ---- OUR STATS ---- */
  const MOOD_COLORS = ['#a5372c','#c8a24a','#5f6b3f','#3f5a72','#8a6a4b','#b25c61','#6b5f4f','#c17b7f','#7a4526'];
  function moodColor(mood){
    const idx = window.MOODS.findIndex(m=>m[0]===mood);
    return MOOD_COLORS[(idx<0?0:idx) % MOOD_COLORS.length];
  }
  function computeStreaks(rows, user){
    const dates = new Set(rows.filter(r=>r.user===user).map(r=>r.date));
    // current streak ending today
    let current = 0, cursor = new Date();
    while(dates.has(todayISO(cursor))){ current++; cursor.setDate(cursor.getDate()-1); }
    // best streak over all recorded dates
    const sorted = [...dates].sort();
    let best = 0, run = 0, prev = null;
    sorted.forEach(d=>{
      if(prev){
        const diff = Math.round((new Date(d) - new Date(prev))/86400000);
        run = diff===1 ? run+1 : 1;
      } else run = 1;
      best = Math.max(best, run);
      prev = d;
    });
    return {current, best};
  }
  Router.registerSpecial('stats', {render(host){
    host.innerHTML = subHeader('OUR STATS') + '<div class="stats-grid" id="statsGrid"></div>';
    DB.onAllDailyRecords(rows=>{
      const grid = host.querySelector('#statsGrid');
      if(!grid) return;
      const sName = Identity.displayName('sihyun'), gName = Identity.displayName('gangwon');
      const sStreak = computeStreaks(rows, sName), gStreak = computeStreaks(rows, gName);
      const maxStreak = Math.max(sStreak.best, gStreak.best, 1);

      const moodCounts = {};
      rows.forEach(r=>{ if(r.mood) moodCounts[r.mood] = (moodCounts[r.mood]||0)+1; });
      const topMood = Object.entries(moodCounts).sort((a,b)=>b[1]-a[1]);
      const totalMood = topMood.reduce((a,[,n])=>a+n,0) || 1;
      let acc = 0;
      const segments = topMood.map(([m,n])=>{
        const a = acc/totalMood*360; acc += n; const b = acc/totalMood*360;
        return `${moodColor(m)} ${a.toFixed(1)}deg ${b.toFixed(1)}deg`;
      });

      const actCounts = {};
      rows.forEach(r=>{ (r.activities||[]).forEach(a=>actCounts[a]=(actCounts[a]||0)+1); });
      const topActs = Object.entries(actCounts).sort((a,b)=>b[1]-a[1]).slice(0,7);
      const maxAct = topActs[0]?.[1] || 1;

      const sDates = new Set(rows.filter(r=>r.user===sName).map(r=>r.date));
      const gDates = new Set(rows.filter(r=>r.user===gName).map(r=>r.date));
      const heat = [];
      let d = new Date(); d.setDate(d.getDate()-29);
      for(let i=0;i<30;i++){
        const k = todayISO(d);
        const c = (sDates.has(k)?1:0) + (gDates.has(k)?1:0);
        heat.push([k,c]);
        d.setDate(d.getDate()+1);
      }

      grid.innerHTML = `
        <div class="stats-card">
          <div class="stats-card-title">RECORDING STREAK</div>
          <div class="ring-row">
            <div class="ring-item"><div class="ring" style="--p:${Math.min(100, sStreak.current/Math.max(7,maxStreak)*100)}"><div class="ring-inside">${sStreak.current}</div></div><div class="ring-label">${escapeHtml(sName)} 현재 연속</div></div>
            <div class="ring-item"><div class="ring" style="--p:${Math.min(100, gStreak.current/Math.max(7,maxStreak)*100)}"><div class="ring-inside">${gStreak.current}</div></div><div class="ring-label">${escapeHtml(gName)} 현재 연속</div></div>
          </div>
        </div>
        <div class="stats-card">
          <div class="stats-card-title">OUR MOOD MIX</div>
          <div class="donut-wrap">
            <div class="donut" style="background:conic-gradient(${segments.length?segments.join(','):'#eee 0 360deg'})"><div class="donut-center">${rows.length}<br>records</div></div>
            <div class="donut-legend">${topMood.slice(0,6).map(([m,n])=>`<span><i style="background:${moodColor(m)}"></i>${escapeHtml(m)} ${n}</span>`).join('') || '<span class="section-note">기록이 쌓이면 보여요</span>'}</div>
          </div>
        </div>
        <div class="stats-card">
          <div class="stats-card-title">FAVORITE DATE TYPES</div>
          ${topActs.length ? topActs.map(([a,n])=>`<div class="stat-bar-row"><div class="lbl">${escapeHtml(a)}</div><div class="track"><div class="fill" style="width:${n/maxAct*100}%"></div></div><div>${n}</div></div>`).join('') : '<div class="section-note">아직 활동 기록이 없어요.</div>'}
        </div>
        <div class="stats-card">
          <div class="stats-card-title">TOTAL ARCHIVE</div>
          <div class="report-grid" style="margin-top:0;">
            <div class="report-tile"><div class="val">${sDates.size}</div><div class="lbl">${escapeHtml(sName)} 기록</div></div>
            <div class="report-tile"><div class="val">${gDates.size}</div><div class="lbl">${escapeHtml(gName)} 기록</div></div>
            <div class="report-tile"><div class="val">${sStreak.best}</div><div class="lbl">${escapeHtml(sName)} 최고 연속</div></div>
            <div class="report-tile"><div class="val">${gStreak.best}</div><div class="lbl">${escapeHtml(gName)} 최고 연속</div></div>
          </div>
        </div>
        <div class="stats-card full">
          <div class="stats-card-title">LAST 30 DAYS · 둘이 기록한 날</div>
          <div class="heatmap">${heat.map(([k,c])=>`<div class="heat-cell ${c===1?'one':c===2?'two':''}" title="${k} · ${c===0?'기록 없음':c===1?'한 명 기록':'둘 다 기록'}"></div>`).join('')}</div>
          <div class="section-note" style="margin-top:8px;">연한 칸 = 한 명 기록 · 진한 칸 = 둘 다 기록.</div>
        </div>`;
    });
  }});

  /* ---- LIKED KAKAO MESSAGES ---- */
  Router.registerSpecial('likedkakao', {render(host){
    host.innerHTML = subHeader('LIKED KAKAO MESSAGES', '♡는 저장, ★는 정말 다시 보고 싶은 BEST예요.') + `
      <input class="field" id="lkSearch" placeholder="카톡 검색…" style="margin-bottom:10px;">
      <div class="album-toolbar" id="lkFilters">
        <button data-filter="best" class="is-active">★ BEST</button>
        <button data-filter="all">전체</button>
        <button data-filter="${Identity.displayName('sihyun')}">${escapeHtml(Identity.displayName('sihyun'))}</button>
        <button data-filter="${Identity.displayName('gangwon')}">${escapeHtml(Identity.displayName('gangwon'))}</button>
      </div>
      <div id="lkResults"></div>`;
    let all = [], filter = 'best', q = '';
    function draw(){
      const results = host.querySelector('#lkResults');
      if(!results) return;
      let items = all;
      if(filter==='best') items = items.filter(x=>x.best);
      else if(filter!=='all') items = items.filter(x=>x.speaker===filter);
      if(q) items = items.filter(x=>((x.text||'')+(x.speaker||'')+(x.date||'')).toLowerCase().includes(q.toLowerCase()));
      if(!items.length){ results.innerHTML = '<div class="empty-frame">조건에 맞는 저장 카톡이 없어요.</div>'; return; }
      const groups = {};
      items.forEach(x=>{ const m=(x.date||'기타').slice(0,7); (groups[m]=groups[m]||[]).push(x); });
      results.innerHTML = Object.entries(groups).sort((a,b)=>b[0]<a[0]?-1:1).map(([m,arr])=>`
        <div class="section">
          <div class="eyebrow">${m} · ${arr.length} messages</div>
          <div class="card">${arr.map(x=>`
            <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${x.date}">
              <div style="flex:1; text-align:left;">
                <div class="section-note">${x.date} · ${escapeHtml(x.speaker||'')} ${x.best?'★':''}</div>
                <div>${escapeHtml(x.text||'')}</div>
              </div>
            </button>`).join('')}</div>
        </div>`).join('');
    }
    host.querySelector('#lkSearch').addEventListener('input', e=>{ q = e.target.value; draw(); });
    host.querySelectorAll('#lkFilters button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        filter = btn.dataset.filter;
        host.querySelectorAll('#lkFilters button').forEach(b=>b.classList.toggle('is-active', b===btn));
        draw();
      });
    });
    DB.onAllChatLikes(rows=>{ all = rows.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')); draw(); });
  }});

  /* ---- 300 DAYS OF 고마워 ---- */
  Router.registerSpecial('thanksarchive', {render(host){
    host.innerHTML = subHeader('300 DAYS OF 고마워', '우리가 하루하루 남긴 감사를 다시 읽어요.') + `
      <input class="field" id="thanksSearch" placeholder="감사 내용 검색 (예: 공부, 기다려줘서)" style="margin-bottom:14px;">
      <div id="thanksResults"></div>`;
    let all = [];
    function draw(){
      const q = host.querySelector('#thanksSearch').value.trim();
      const results = host.querySelector('#thanksResults');
      if(!results) return;
      const items = (q ? all.filter(it=>it.text.includes(q)) : all);
      results.innerHTML = items.length ? `<div class="card">${items.map(it=>`
        <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${it.date}">
          <div class="list-date">${escapeHtml(it.date)}</div>
          <div style="flex:1;text-align:left;margin-left:14px;">
            <div class="section-note">FROM ${escapeHtml(it.from)}</div>
            <div>${escapeHtml(it.text)}</div>
          </div>
        </button>`).join('')}</div>` : '<div class="empty-frame">아직 저장된 감사가 없어요.</div>';
    }
    host.querySelector('#thanksSearch').addEventListener('input', draw);
    DB.onAllGratitude(rows=>{
      all = rows.filter(r=>r.text && r.text.trim()).sort((a,b)=> b.date.localeCompare(a.date));
      draw();
    });
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
