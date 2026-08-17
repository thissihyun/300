/* ================================================================
   V3 — additive compatibility layer
   V2 remains the engine. This file restores V1-only behavior/design.
   ================================================================ */
(function(){
  'use strict';

  const V3 = {version:'3.0.0'};
  window.V3 = V3;

  const $ = (sel, root=document)=> root.querySelector(sel);
  const $$ = (sel, root=document)=> Array.from(root.querySelectorAll(sel));
  const esc = s => window.escapeHtml ? escapeHtml(s) : String(s==null?'':s);

  function me(){
    try{ return Identity.displayName(Identity.current()); }catch(e){ return ''; }
  }

  /* ----------------------------------------------------------------
     1) V1 AUTO ACTIVITY CLASSIFICATION
     ---------------------------------------------------------------- */
  const ACTIVITY_RULES = [
    ['밥/맛집', /밥|점심|저녁|아침|먹|맛집|Raku|udon|국밥|떡볶이|hotpot|pizza|뷔페|buffet|restaurant|diner|sandwich/i],
    ['카페', /카페|coffee|starbucks|oak berry|cafe|cheesecake/i],
    ['산책', /산책|걷|20\s*KM|central park|beacon|trail|walking/i],
    ['공부', /공부|시험|도서관|bobst|수업|강의|KAIST|과제|study|exam|library/i],
    ['여행', /여행|canada|cancun|chicago|maryland|governors|beacon|LA\b|west coast|las vegas|grand canyon|yosemite|san francisco|san diego|joshua|airport|공항|출국|귀국/i],
    ['문화/전시', /moma|museum|cloisters|전시|미술관|동물원|zoo|gallery/i],
    ['영화/공연', /영화|broadway|jazz|공연|cinema|gatsby|zootopia/i],
    ['운동', /스케이트|skating|nba|basketball|20\s*KM|운동|climbing|tennis/i],
    ['쇼핑', /쇼핑|macy|선물|반지|shopping|bookstore/i],
    ['집데이트', /집데이트|집에서|packing|짐 정리|캐리어|home/i],
    ['영상통화', /영상통화|video call|facetime|통화/i],
    ['예배', /예배|worship|교회|church/i],
    ['친구들과', /친구|셋이|넷이|지윤|현수|진리|주찬|민재|하은|group/i],
    ['가족', /부모님|가족|family/i],
    ['기념일', /DAY\s*(1|50|60|80|100|150|200|300)|생일|고백|첫 |FIRST|kiss|손잡기|크리스마스|anniversary/i],
  ];

  function inferActivities(date){
    const ev = (window.EVENTS||{})[date];
    if(!ev) return [];
    const text = [ev.title, ev.story, ev.chapter]
      .concat((ev.kakao||[]).map(x=>x[1]))
      .filter(Boolean).join(' ');
    const allowed = new Set((window.ACTIVITIES||[]).map(x=>x[0]));
    return ACTIVITY_RULES.filter(([label,re])=>allowed.has(label) && re.test(text)).map(x=>x[0]);
  }
  V3.inferActivities = inferActivities;

  function autoActivityMarkup(date){
    const suggested = inferActivities(date);
    if(!suggested.length) return '';
    return `<div class="v3-auto-activity"><b>연대기 기록 기반 자동 분류</b><br>${suggested.map(x=>`<span class="v3-auto-chip">${esc(x)}</span>`).join('')}</div>`;
  }

  function enhanceDiary(view){
    const grid = $('#actGrid', view);
    if(!grid || grid.dataset.v3Auto==='1') return;
    grid.dataset.v3Auto='1';
    const date = typeof todayISO==='function' ? todayISO() : '';
    const suggested = inferActivities(date);
    if(!suggested.length) return;
    grid.insertAdjacentHTML('afterend', autoActivityMarkup(date));
    // V1 behavior: auto-classified categories start selected, but remain editable.
    suggested.forEach(label=>{
      const btn = $$('[data-act]', grid).find(b=>b.dataset.act===label);
      if(btn && !btn.classList.contains('is-selected')) btn.click();
    });
  }

  /* ----------------------------------------------------------------
     2) HOME / CALENDAR / ALBUM / FUTURE visual restoration
     ---------------------------------------------------------------- */
  function enhanceHome(view){
    if(!view.classList.contains('v3-enhanced')) view.classList.add('v3-enhanced');
    const heroActions = $('.hero-actions', view);
    if(heroActions && !$('.v3-home-stamp', view)){
      heroActions.insertAdjacentHTML('afterend', `<div class="v3-home-stamp">✦ V3 · V2 engine, V1 memories restored</div>`);
    }
  }

  function seasonFromMonthText(text){
    text = (text||'').toLowerCase();
    if(/october|november/.test(text)) return 'autumn';
    if(/december|january|february/.test(text)) return 'winter';
    if(/march|april|may/.test(text)) return 'spring';
    return 'summer';
  }
  function enhanceOurDays(view){
    const label = $('#monthLabel', view);
    const host = $('#calHost', view);
    if(!label || !host) return;
    ['autumn','winter','spring','summer'].forEach(s=>view.classList.remove('v3-season-'+s));
    view.classList.add('v3-season-'+seasonFromMonthText(label.textContent));
    if(!$('.v3-calendar-note', view)){
      host.insertAdjacentHTML('beforebegin','<div class="v3-calendar-note">photos · chats · moods · little milestones</div>');
    }
  }

  function enhanceAlbum(view){
    if(view.dataset.v3Album==='1') return;
    view.dataset.v3Album='1';
    const toolbar = $('#modeToolbar', view);
    if(toolbar) toolbar.setAttribute('aria-label','V1 + V2 album modes');
  }

  function enhanceFuture(view){
    const tabs = $('.future-tabs', view);
    if(!tabs) return;
    const first = tabs.querySelector('button[data-target="postcards"]');
    if(first && first.textContent.trim()!="WE'LL COME BACK FOR") first.textContent = "WE'LL COME BACK FOR";
    if(!$('.v3-future-intro', view)){
      tabs.insertAdjacentHTML('beforebegin', `
        <div class="v3-future-intro">
          <div class="v3-future-hero">
            <div class="v3-future-k">NEXT SEASON · STILL BECOMING US</div>
            <h2>Our Future</h2>
            <p>지금까지 지나온 시간만큼, 앞으로 함께 채워갈 장면들도 천천히 모아두는 곳. 다시 가고 싶은 장소, 처음 가볼 도시, 작은 약속과 미래의 편지를 한곳에 이어둬요.</p>
          </div>
          <div class="v3-future-note">
            <div class="v3-future-k">WHAT WE WANT TO KEEP</div>
            <p>불필요한 설명이 필요없다.<br>이해시킬 필요가 없다.<br>애쓰지 않아도 된다.<br>편안해서 더 나다워짐.</p>
          </div>
        </div>`);
    }
  }

  /* ----------------------------------------------------------------
     3) REAL MAP + V1 SCRAPBOOK MAP TOGGLE
     ---------------------------------------------------------------- */
  function scrapMapSvg(){
    const pts = (window.PLACES||[]).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));
    if(!pts.length) return '<div class="empty-frame">지도 데이터가 없어요.</div>';
    const minLat=Math.min(...pts.map(p=>p.lat)), maxLat=Math.max(...pts.map(p=>p.lat));
    const minLng=Math.min(...pts.map(p=>p.lng)), maxLng=Math.max(...pts.map(p=>p.lng));
    const W=800,H=460,pad=55;
    const x=p=>pad+(p.lng-minLng)/(maxLng-minLng||1)*(W-pad*2);
    const y=p=>H-pad-(p.lat-minLat)/(maxLat-minLat||1)*(H-pad*2);
    const ordered = pts.slice().sort((a,b)=>(a.dates?.[0]||'').localeCompare(b.dates?.[0]||''));
    const line = ordered.map((p,i)=>(i?'L':'M')+x(p).toFixed(1)+','+y(p).toFixed(1)).join(' ');
    const nodes = pts.map((p,i)=>{
      const px=x(p), py=y(p), date=(p.dates||[]).slice(-1)[0]||'';
      const tx = px > W*.72 ? -8 : 8;
      const anchor = px > W*.72 ? 'end' : 'start';
      return `<g data-action="memory" data-date="${esc(date)}" style="cursor:pointer">
        <circle cx="${px}" cy="${py}" r="10" fill="#fbf6ea" stroke="#a5372c" stroke-width="2"/>
        <circle cx="${px}" cy="${py}" r="3" fill="#a5372c"/>
        <text class="v3-map-pin-label" x="${px+tx}" y="${py+(i%2?18:-12)}" text-anchor="${anchor}">${esc(p.name)}</text>
      </g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Our New York scrapbook map">
      <rect width="${W}" height="${H}" rx="18" fill="#fbf6ea"/>
      <path d="M72 370 C150 330 180 250 250 238 C350 218 330 130 440 108 C535 90 610 145 728 74" fill="none" stroke="#3f5a72" stroke-width="16" opacity=".08"/>
      <path d="${line}" fill="none" stroke="#a5372c" stroke-width="2" stroke-dasharray="7 8" opacity=".62"/>
      <text x="54" y="42" font-family="Georgia,serif" font-size="27" font-style="italic" fill="#231f16">Our New York</text>
      <text x="55" y="61" font-family="sans-serif" font-size="10" fill="#8a6a4b">the city annotated only with places that mattered to us</text>
      ${nodes}
    </svg>`;
  }

  function enhanceSpecial(view){
    const map = $('#nycMapWrap', view);
    if(map && !map.dataset.v3Map){
      map.dataset.v3Map='1';
      const wrap = document.createElement('div');
      wrap.className='v3-map-toggle';
      wrap.innerHTML='<button class="is-active" data-v3-mapmode="real">REAL MAP</button><button data-v3-mapmode="scrap">SCRAPBOOK MAP</button>';
      map.parentNode.insertBefore(wrap,map);
      const scrap=document.createElement('div');
      scrap.className='v3-scrap-map'; scrap.style.display='none'; scrap.innerHTML=scrapMapSvg();
      map.insertAdjacentElement('afterend',scrap);
      wrap.querySelectorAll('[data-v3-mapmode]').forEach(btn=>btn.addEventListener('click',()=>{
        const mode=btn.dataset.v3Mapmode;
        wrap.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',b===btn));
        map.style.display=mode==='real'?'':'none'; scrap.style.display=mode==='scrap'?'':'none';
        if(mode==='real') setTimeout(()=>window.dispatchEvent(new Event('resize')),80);
      }));
    }
  }

  /* ----------------------------------------------------------------
     4) V1 SPECIAL-DATE LAYOUTS INSIDE V2 MEMORY MODAL
     ---------------------------------------------------------------- */
  function specialMemoryHtml(date, ev){
    const firstKakao = ev?.kakao?.[0]?.[1] || '';
    if(date==='2025-10-23') return `<div class="v3-special-memory">
      <div class="v3-day1-stage">
        <div class="v3-day1-card q"><div class="v3-day1-speaker">강원</div><div class="v3-day1-line">나랑 사귈래?</div></div>
        <div class="v3-day1-arrow">→</div>
        <div class="v3-day1-card a"><div class="v3-day1-speaker">시현</div><div class="v3-day1-line">그래!</div></div>
      </div><div class="v3-day1-foot">OCT 23, 2025 · the day we became us.</div></div>`;
    if(date==='2025-11-01') return `<div class="v3-special-memory">
      <div class="v3-beacon-title">BEACON · 20 KM</div>
      <div class="v3-beacon-route">
        <div class="v3-beacon-stop"><strong>NEW YORK</strong>start</div>
        <div class="v3-beacon-stop"><strong>BEACON</strong>arrival</div>
        <div class="v3-beacon-stop"><strong>20 KM</strong>walk · survive</div>
        <div class="v3-beacon-stop"><strong>TOGETHER</strong>back home</div>
      </div></div>`;
    if(date==='2025-11-13') return `<div class="v3-special-memory"><div class="v3-milestone-quote">“${esc(firstKakao||'용기냈어')}”</div><div class="v3-milestone-sub">FIRST HAND-HOLDING · HOLD MY HAND</div></div>`;
    if(date==='2025-12-14') return `<div class="v3-special-memory"><div class="v3-milestone-quote">OUR FIRST SNOW</div><div class="v3-milestone-sub">a winter morning that became part of us</div></div>`;
    if(date==='2025-12-17') return `<div class="v3-special-memory"><div class="v3-milestone-quote">THE FIRST KISS</div><div class="v3-milestone-sub">on the cheek · Broom</div></div>`;
    if(date==='2025-12-20') return `<div class="v3-special-memory"><div class="v3-milestone-quote">We came back to where it began.</div><div class="v3-milestone-sub">10.04 MoMA ↔ 12.20 MoMA · LAST DAY IN NEW YORK</div></div>`;
    if(/DAY\s*(100|150|300)/i.test(ev?.title||'')) return `<div class="v3-special-memory"><div class="v3-milestone-quote">${esc(ev.title)}</div><div class="v3-milestone-sub">${esc(date)} · another page of us</div></div>`;
    return '';
  }

  function oneShot(subscribe, callback){
    let off=null, fired=false;
    off=subscribe(rows=>{
      if(fired) return; fired=true;
      callback(rows||[]);
      if(off) setTimeout(()=>{try{off()}catch(e){}},0);
    });
  }

  function questionIndexFor(dateStr){
    const base=new Date('2025-10-23T00:00:00');
    const d=new Date(dateStr+'T00:00:00');
    const n=Math.floor((d-base)/86400000);
    return ((n%(window.QUESTIONS||[]).length)+(window.QUESTIONS||[]).length)%(window.QUESTIONS||[]).length;
  }

  function injectHistoricEditor(date){
    const panel=$('#memoryPanel');
    if(!panel || panel.querySelector('.v3-day-editor')) return;
    const current=me();
    if(!current) return;
    const qIdx=questionIndexFor(date), question=(window.QUESTIONS||[])[qIdx]||'';
    const editor=document.createElement('div');
    editor.className='v3-day-editor';
    editor.innerHTML=`
      <h3>Edit this day</h3>
      <div class="section-note">V1처럼 과거 날짜도 다시 열어 감정·활동·감사·질문을 채울 수 있어요. 기록자는 ${esc(current)}.</div>
      <div class="v3-day-editor-block">
        <div class="v3-day-editor-label">OUR DAY · MOOD</div>
        <div class="mood-grid" id="v3HistMood">${(window.MOODS||[]).map(([l,e])=>`<button class="chip" data-v3-mood="${esc(l)}">${e} ${esc(l)}</button>`).join('')}</div>
        <div class="v3-day-editor-label">DATE / ACTIVITY</div>
        <div class="act-grid" id="v3HistActs">${(window.ACTIVITIES||[]).map(([l,e])=>`<button class="chip" data-v3-act="${esc(l)}">${e} ${esc(l)}</button>`).join('')}</div>
        ${autoActivityMarkup(date)}
        <textarea class="field" id="v3HistLine" placeholder="이 날을 한 줄로." style="margin-top:9px"></textarea>
        <div class="v3-day-editor-actions"><button class="btn btn-sm" id="v3HistSave">이 날 기록 저장</button><span class="v3-save-state" id="v3HistState"></span></div>
      </div>
      <div class="v3-day-editor-block">
        <div class="v3-day-editor-label">THANK YOU · ${esc(current)}</div>
        <textarea class="field" id="v3HistGrat" placeholder="이 날 고마웠던 것"></textarea>
        <div class="v3-day-editor-actions"><button class="btn btn-sm btn-outline" id="v3HistGratSave">감사 저장</button><span class="v3-save-state" id="v3HistGratState"></span></div>
      </div>
      <div class="v3-day-editor-block">
        <div class="v3-day-editor-label">TODAY'S QUESTION</div>
        <div style="font-family:var(--serif);font-size:14px;line-height:1.55;margin-bottom:8px">${esc(question)}</div>
        <textarea class="field" id="v3HistAnswer" placeholder="${esc(current)}의 답"></textarea>
        <div class="v3-day-editor-actions"><button class="btn btn-sm btn-outline" id="v3HistAnswerSave">답변 저장</button><span class="v3-save-state" id="v3HistAnswerState"></span></div>
      </div>`;
    const note=$('.note-area',panel);
    if(note) note.parentNode.insertBefore(editor,note); else panel.appendChild(editor);

    let selectedMood=null; const selectedActs=new Set();
    const moodBtns=$$('[data-v3-mood]',editor), actBtns=$$('[data-v3-act]',editor);
    moodBtns.forEach(btn=>btn.addEventListener('click',()=>{
      selectedMood=btn.dataset.v3Mood;
      moodBtns.forEach(b=>b.classList.toggle('is-selected',b===btn));
    }));
    actBtns.forEach(btn=>btn.addEventListener('click',()=>{
      const a=btn.dataset.v3Act;
      if(selectedActs.has(a)){selectedActs.delete(a);btn.classList.remove('is-selected')}
      else{selectedActs.add(a);btn.classList.add('is-selected')}
    }));

    // Start with V1 auto classification; saved data overrides it when present.
    inferActivities(date).forEach(label=>{
      const b=actBtns.find(x=>x.dataset.v3Act===label);
      if(b){selectedActs.add(label);b.classList.add('is-selected')}
    });

    oneShot(cb=>DB.onDailyRecordsForDate(date,cb), rows=>{
      const row=rows.find(r=>r.user===current);
      if(!row) return;
      selectedMood=row.mood||null;
      moodBtns.forEach(b=>b.classList.toggle('is-selected',b.dataset.v3Mood===selectedMood));
      selectedActs.clear(); (row.activities||[]).forEach(a=>selectedActs.add(a));
      actBtns.forEach(b=>b.classList.toggle('is-selected',selectedActs.has(b.dataset.v3Act)));
      $('#v3HistLine',editor).value=row.line||'';
    });
    oneShot(cb=>DB.onGratitudeForDate(date,cb), rows=>{
      const row=rows.find(r=>r.from===current); if(row) $('#v3HistGrat',editor).value=row.text||'';
    });
    oneShot(cb=>DB.onAnswersForDate(date,cb), rows=>{
      const row=rows.find(r=>r.user===current); if(row) $('#v3HistAnswer',editor).value=row.text||'';
    });

    $('#v3HistSave',editor).addEventListener('click',async()=>{
      const line=$('#v3HistLine',editor).value.trim();
      await DB.setDailyRecord(date,current,{mood:selectedMood,line,activities:[...selectedActs]});
      await DB.logActivity('record',date,current,line||'과거 날짜 기록 수정');
      $('#v3HistState',editor).textContent='저장됨 ✓';
    });
    $('#v3HistGratSave',editor).addEventListener('click',async()=>{
      const text=$('#v3HistGrat',editor).value.trim(); if(!text)return;
      await DB.setGratitude(date,current,text); await DB.logActivity('gratitude',date,current,text);
      $('#v3HistGratState',editor).textContent='저장됨 ✓';
    });
    $('#v3HistAnswerSave',editor).addEventListener('click',async()=>{
      const text=$('#v3HistAnswer',editor).value.trim(); if(!text)return;
      await DB.setAnswer(date,current,qIdx,text); await DB.logActivity('question',date,current,text);
      $('#v3HistAnswerState',editor).textContent='저장됨 ✓';
    });
  }

  function enhanceMemoryPanel(){
    const panel=$('#memoryPanel');
    const date=window.MemoryView && MemoryView.currentDate;
    if(!panel || !date || !panel.children.length) return;
    const ev=(window.EVENTS||{})[date]||{};
    if(!panel.querySelector('.v3-special-memory')){
      const html=specialMemoryHtml(date,ev);
      if(html){
        const anchor=panel.querySelector('.story-text')||panel.querySelector('.modal-title');
        if(anchor) anchor.insertAdjacentHTML('afterend',html);
      }
    }
    injectHistoricEditor(date);
  }

  /* ----------------------------------------------------------------
     5) V1 '300 DAYS OF 고마워' + V2 DAILY GRATITUDE IN ONE FEATURE
     ---------------------------------------------------------------- */
  let gratitudeUnsub=null;
  function renderThanksArchive(host){
    if(gratitudeUnsub){try{gratitudeUnsub()}catch(e){} gratitudeUnsub=null;}
    host.innerHTML=`
      <button class="btn btn-sm btn-outline" data-action="special-back">← SPECIAL</button>
      <div class="section-head" style="margin-top:14px"><div><div class="section-title">300 DAYS OF 고마워</div><div class="section-note">V1의 실제 카톡 ‘고마워’ + V2의 Daily Gratitude를 둘 다 보관해요.</div></div></div>
      <div class="v3-thanks-tabs"><button class="is-active" data-v3-thanks="kakao">KAKAO · 실제 대화</button><button data-v3-thanks="daily">DAILY GRATITUDE</button></div>
      <input class="field" id="v3ThanksSearch" placeholder="검색 — 기다려줘서, 공부, 고마워…">
      <div id="v3ThanksSummary" style="margin:14px 0"></div>
      <div id="v3ThanksBody" class="v3-thanks-list"><div class="empty-frame">불러오는 중…</div></div>`;

    let mode='kakao', q='', kakaoRows=[], dailyRows=[];
    const summary=$('#v3ThanksSummary',host), body=$('#v3ThanksBody',host);
    function draw(){
      const src=mode==='kakao'?kakaoRows:dailyRows;
      const filtered=q ? src.filter(r=>(r.text||'').includes(q)||(r.speaker||r.from||'').includes(q)||(r.date||'').includes(q)) : src;
      summary.innerHTML=`<div class="v3-thanks-count">${src.length.toLocaleString()}</div><div class="section-note">${mode==='kakao'?'real Kakao messages containing “고마워”':'daily gratitude notes'} · 검색 결과 ${filtered.length.toLocaleString()}</div>`;
      if(!filtered.length){body.innerHTML='<div class="empty-frame">조건에 맞는 기록이 없어요.</div>';return;}
      body.innerHTML=`<div class="card">${filtered.slice(0,220).map(r=>`
        <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);text-align:left" data-action="memory" data-date="${esc(r.date)}">
          <div class="list-date">${esc(r.date)}</div>
          <div style="flex:1;margin-left:12px"><div class="section-note">${esc(r.speaker||r.from||'')}</div><div class="v3-thanks-text">${esc(r.text||'')}</div></div>
        </button>`).join('')}</div>${filtered.length>220?`<div class="section-note" style="margin-top:8px">상위 220개 표시 · 검색어로 더 좁혀보세요.</div>`:''}`;
    }

    $$('#v3ThanksSearch',host).forEach(input=>input.addEventListener('input',e=>{q=e.target.value.trim();draw()}));
    $$('[data-v3-thanks]',host).forEach(btn=>btn.addEventListener('click',()=>{
      mode=btn.dataset.v3Thanks; $$('[data-v3-thanks]',host).forEach(b=>b.classList.toggle('is-active',b===btn)); draw();
    }));

    if(window.FullChat){
      FullChat.load().then(()=>{
        kakaoRows=FullChat.allMessages().filter(m=>(m.text||'').includes('고마워'));
        draw();
      });
    }
    gratitudeUnsub=DB.onAllGratitude(rows=>{
      dailyRows=(rows||[]).filter(r=>r.text&&r.text.trim()).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      draw();
    });
  }
  if(window.Router) Router.registerSpecial('thanksarchive',{render:renderThanksArchive});

  /* ----------------------------------------------------------------
     6) HEADER TOGETHER / REUNION WIDGET
     ---------------------------------------------------------------- */
  function daysUntil(dateStr){
    if(!dateStr) return null;
    const a=new Date((typeof todayISO==='function'?todayISO():'')+'T00:00:00');
    const b=new Date(dateStr+'T00:00:00');
    if(Number.isNaN(+a)||Number.isNaN(+b)) return null;
    return Math.ceil((b-a)/86400000);
  }
  function renderHeaderMetrics(){
    const together=$('#v3TogetherMetric'), reunion=$('#v3ReunionMetric');
    if(together && typeof todayISO==='function' && typeof dayNumber==='function'){
      const n=dayNumber(todayISO());
      together.innerHTML=`<div class="v3-metric-k">TOGETHER</div><div class="v3-metric-big">DAY ${n}</div><div>since 10.23.2025</div>`;
    }
    if(reunion){
      const date=localStorage.getItem('v3_reunion_date')||'';
      const left=daysUntil(date);
      reunion.innerHTML=date
        ? `<div class="v3-metric-k">NEXT MEETING</div><div class="v3-metric-big">${left===0?'TODAY':left>0?'D-'+left:'D+'+Math.abs(left)}</div><button id="v3EditReunion">${esc(date)}</button>`
        : `<div class="v3-metric-k">NEXT MEETING</div><div class="v3-metric-big">SET DATE</div><button id="v3EditReunion">날짜 정하기</button>`;
      const edit=$('#v3EditReunion',reunion); if(edit) edit.addEventListener('click',openReunionPopover);
    }
  }
  function openReunionPopover(){
    const pop=$('#v3ReunionPopover'); if(!pop)return;
    $('#v3ReunionDate',pop).value=localStorage.getItem('v3_reunion_date')||'';
    pop.classList.add('is-open'); pop.setAttribute('aria-hidden','false');
  }
  function closeReunionPopover(){const pop=$('#v3ReunionPopover');if(pop){pop.classList.remove('is-open');pop.setAttribute('aria-hidden','true')}}

  /* ----------------------------------------------------------------
     7) OBSERVERS — additive post-render enhancements
     ---------------------------------------------------------------- */
  function observe(id, fn){
    const el=document.getElementById(id); if(!el)return;
    let queued=false;
    const run=()=>{queued=false;try{fn(el)}catch(e){console.warn('[V3]',id,e)}};
    const mo=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(run)});
    mo.observe(el,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    run();
  }

  observe('view-home',enhanceHome);
  observe('view-ourdays',enhanceOurDays);
  observe('view-diary',enhanceDiary);
  observe('view-album',enhanceAlbum);
  observe('view-special',enhanceSpecial);
  observe('view-future',enhanceFuture);
  observe('memoryPanel',enhanceMemoryPanel);

  window.addEventListener('load',()=>{
    renderHeaderMetrics();
    const save=$('#v3ReunionSave'), close=$('#v3ReunionClose');
    if(save) save.addEventListener('click',()=>{
      const value=$('#v3ReunionDate').value;
      if(value) localStorage.setItem('v3_reunion_date',value); else localStorage.removeItem('v3_reunion_date');
      closeReunionPopover(); renderHeaderMetrics();
    });
    if(close) close.addEventListener('click',closeReunionPopover);
  });

})();
