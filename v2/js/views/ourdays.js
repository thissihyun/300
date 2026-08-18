/* ================================================================
   OUR DAYS — calendar / list toggle + monthly love report
   ================================================================ */
(function(){
  let unsub = [];
  function clearSub(){ unsub.forEach(f=>f&&f()); unsub=[]; }

  let viewMode = 'calendar'; // 'calendar' | 'list'
  let cursor = new Date(); // current month being viewed
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function pad(n){ return String(n).padStart(2,'0'); }
  function keyFor(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }

  // Day-type classification for calendar badges (Section 15/32 in v1) — same
  // small taxonomy as the original app: birthday / anniversary / first / trip.
  function dayKind(date, ev){
    if(!ev) return null;
    const t = ev.title || '';
    if(/생일/.test(t)) return 'birthday';
    if(/DAY\s*(1|50|100|150|200|300)\b/i.test(t) || (window.MILESTONES||[]).some(m=>m.date===date)) return 'anniversary';
    if(/첫|first/i.test(t)) return 'first';
    if(/San Diego|Joshua|West Coast|Hollywood|Packing|공항|출국|귀국|여행|Beacon/i.test(t)) return 'trip';
    return null;
  }
  const KIND_ICON = {birthday:'🎂', anniversary:'✦', first:'♥', trip:'✈'};
  const KIND_LABEL = {birthday:'생일', anniversary:'기념일', first:'처음', trip:'여행'};

  function monthEntries(y,m){
    const prefix = `${y}-${pad(m+1)}`;
    return Object.entries(window.EVENTS).filter(([k])=>k.startsWith(prefix)).sort((a,b)=>a[0]<b[0]?-1:1);
  }

  function photoFor(key, photos){
    const forDate = photos.filter(p=>p.date===key);
    if(!forDate.length) return null;
    return forDate.find(p=>p.hero) || forDate[0];
  }

  function moodDots(key, diaryRows){
    const rows = diaryRows.filter(r=>r.date===key && r.mood);
    if(!rows.length) return '';
    return `<div class="cal-mood-dots">${rows.map(r=>{
      const uid = r.user===Identity.displayName('sihyun') ? 'sihyun' : 'gangwon';
      return `<span class="cal-mood-dot is-${uid}" title="${escapeHtml(r.user)} · ${escapeHtml(r.mood)}"></span>`;
    }).join('')}</div>`;
  }

  function renderCalendar(host, y, m, dir, photos, diaryRows){
    photos = photos || [];
    diaryRows = diaryRows || [];
    const chatDates = (window.FullChat && window.FullChat.ready) ? window.FULL_CHAT_DATA : null;
    const first = new Date(y,m,1);
    const startDow = first.getDay();
    const daysInMonth = new Date(y,m+1,0).getDate();
    const today = todayISO();
    let cells = '';
    for(let i=0;i<startDow;i++) cells += `<div class="cal-cell is-empty"></div>`;
    for(let d=1; d<=daysInMonth; d++){
      const key = keyFor(y,m,d);
      const ev = window.EVENTS[key];
      const isToday = key===today;
      const kind = dayKind(key, ev);
      const photo = photoFor(key, photos);
      const isChatOnly = !ev && chatDates && chatDates[key] && chatDates[key].length;
      const cls = ['cal-cell'];
      if(ev) cls.push('has-event');
      if(isToday) cls.push('is-today');
      if(kind) cls.push('kind-'+kind);
      if(photo) cls.push('has-photo');
      if(isChatOnly) cls.push('chat-only');
      let photoImg = '';
      if(photo){
        const fx = photo.focusX!=null ? photo.focusX : 50;
        const fy = photo.focusY!=null ? photo.focusY : 50;
        const fz = photo.focusZoom!=null ? photo.focusZoom : 100;
        photoImg = `<img class="cal-photo-img" src="${photo.url}" alt="" style="object-position:${fx}% ${fy}%; transform:scale(${fz/100});">`;
      }
      cells += `<button class="${cls.join(' ')}" ${ev?`data-action="memory" data-date="${key}"`:(isChatOnly?`data-action="memory" data-date="${key}"`:'')}>
        ${photoImg}
        <div class="cal-num">${d}</div>
        ${kind ? `<span class="cal-badge">${KIND_ICON[kind]}</span>` : ''}
        ${isChatOnly ? `<span class="cal-chat-badge">💬</span>` : ''}
        ${ev ? `<div class="cal-title">${escapeHtml(ev.title)}</div>` : ''}
        ${moodDots(key, diaryRows)}
      </button>`;
    }
    const wrapCls = dir==='next' ? 'cal-slide-left' : dir==='prev' ? 'cal-slide-right' : '';
    host.innerHTML = `<div class="cal-grid" style="margin-bottom:6px;">${['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}</div>
      <div class="cal-grid ${wrapCls}">${cells}</div>
      <div class="cal-legend">${Object.keys(KIND_ICON).map(k=>`<span>${KIND_ICON[k]} ${KIND_LABEL[k]}</span>`).join('')}<span>💬 대화만 있는 날</span><span class="is-today-sw">오늘</span></div>`;
    host.querySelectorAll('.cal-cell').forEach(cell=>{
      cell.addEventListener('click', ()=>{ cell.classList.remove('cal-bounce'); void cell.offsetWidth; cell.classList.add('cal-bounce'); });
    });
  }

  function renderList(host, y, m){
    const entries = monthEntries(y,m);
    if(!entries.length){ host.innerHTML = '<div class="empty-frame">이 달은 아직 기록이 없어요.</div>'; return; }
    host.innerHTML = `<div class="card">${entries.map(([date,ev])=>`
      <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${date}">
        <div><div class="list-date">${date.slice(5)}</div></div>
        <div style="flex:1;text-align:left;margin-left:14px;">
          <div style="font-family:var(--serif);">${escapeHtml(ev.title)}</div>
          <div class="section-note">${escapeHtml(ev.chapter)}</div>
        </div>
      </button>`).join('')}</div>`;
  }

  function computeMonthlyReport(y,m, diaryRows){
    const prefix = `${y}-${pad(m+1)}`;
    const monthDiary = diaryRows.filter(r=>r.date && r.date.startsWith(prefix));
    const moodCount = {};
    monthDiary.forEach(r=>{ if(r.mood) moodCount[r.mood]=(moodCount[r.mood]||0)+1; });
    const topMood = Object.entries(moodCount).sort((a,b)=>b[1]-a[1])[0];
    const hardMoods = ['서운함','속상함','화남'];
    const hardDays = new Set(monthDiary.filter(r=>hardMoods.includes(r.mood)).map(r=>r.date)).size;
    const actCount = {};
    const dateDaysSet = new Set();
    monthDiary.forEach(r=>{ (r.activities||[]).forEach(a=>{ actCount[a]=(actCount[a]||0)+1; dateDaysSet.add(r.date); }); });
    const topAct = Object.entries(actCount).sort((a,b)=>b[1]-a[1])[0];

    // affection pulse from curated real kakao highlights for this month
    let loveCount = 0, msgCount = 0;
    monthEntries(y,m).forEach(([,ev])=>{
      (ev.kakao||[]).forEach(([,text])=>{ msgCount++; if(text.includes('사랑해')) loveCount++; });
    });

    return {
      topMood: topMood ? `${topMood[0]} ${topMood[1]}회` : '기록 없음',
      hardDays, dateDays: dateDaysSet.size,
      topAct: topAct ? `${topAct[0]}` : '기록 없음',
      loveCount, pulse: msgCount ? Math.round(loveCount/msgCount*1000) : 0,
    };
  }

  function renderReport(host, y, m, diaryRows){
    const r = computeMonthlyReport(y,m,diaryRows);
    host.innerHTML = `
      <div class="section-head"><div class="section-title">MONTHLY LOVE REPORT</div><div class="section-note">${MONTH_NAMES[m]} ${y}</div></div>
      <div class="report-grid">
        <div class="report-tile"><div class="val">${escapeHtml(r.topMood)}</div><div class="lbl">Mostly</div></div>
        <div class="report-tile"><div class="val">${r.hardDays}</div><div class="lbl">Hard days</div></div>
        <div class="report-tile"><div class="val">${r.dateDays}</div><div class="lbl">Date days</div></div>
        <div class="report-tile"><div class="val">${escapeHtml(r.topAct)}</div><div class="lbl">Most common date</div></div>
        <div class="report-tile"><div class="val">${r.pulse}‰</div><div class="lbl">Affection pulse</div></div>
        <div class="report-tile"><div class="val">${r.loveCount}</div><div class="lbl">“사랑해” (highlights)</div></div>
      </div>`;
  }

  function render(container){
    clearSub();
    container.innerHTML = `
      <div class="section-head">
        <div class="section-title">OUR DAYS</div>
        <div class="album-toolbar">
          <button data-action="tab" data-group="daysmode" data-target="calendar" data-tabbtn="daysmode" class="is-active">CALENDAR</button>
          <button data-action="tab" data-group="daysmode" data-target="list" data-tabbtn="daysmode">LIST</button>
        </div>
      </div>
      <div class="cal-nav">
        <button class="icon-btn" id="prevMonth">←</button>
        <div class="month-label" id="monthLabel"></div>
        <button class="icon-btn" id="nextMonth">→</button>
      </div>
      <div data-tabpanel="daysmode" data-panel="calendar" class="is-active"><div id="calHost"></div></div>
      <div data-tabpanel="daysmode" data-panel="list" style="display:none;"><div id="listHost"></div></div>
      <section class="section card" id="reportHost"></section>
    `;
    // hook simple show/hide for tab panels since our generic tab CSS uses .is-active but here we used inline style toggling too
    container.querySelectorAll('[data-tabbtn="daysmode"]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        viewMode = btn.dataset.target;
        container.querySelector('[data-panel="calendar"]').style.display = viewMode==='calendar' ? '' : 'none';
        container.querySelector('[data-panel="list"]').style.display = viewMode==='list' ? '' : 'none';
      });
    });

    let diaryRows = [];
    let photoRows = [];
    function draw(dir){
      const y = cursor.getFullYear(), m = cursor.getMonth();
      container.querySelector('#monthLabel').textContent = `${MONTH_NAMES[m]} ${y}`;
      renderCalendar(container.querySelector('#calHost'), y, m, dir, photoRows, diaryRows);
      renderList(container.querySelector('#listHost'), y, m);
      renderReport(container.querySelector('#reportHost'), y, m, diaryRows);
    }
    // Single handler each — this used to also get re-bound via .onclick inside
    // onAllDailyRecords below, so every click fired twice and jumped two months.
    container.querySelector('#prevMonth').addEventListener('click', ()=>{ cursor.setMonth(cursor.getMonth()-1); draw('prev'); });
    container.querySelector('#nextMonth').addEventListener('click', ()=>{ cursor.setMonth(cursor.getMonth()+1); draw('next'); });
    draw();

    unsub.push(DB.onAllDailyRecords(rows=>{
      diaryRows = rows;
      draw();
    }));
    unsub.push(DB.onAllPhotos(rows=>{
      photoRows = rows;
      draw();
    }));
    if(window.FullChat) window.FullChat.load().then(()=> draw());
  }

  Router.registerView('ourdays', {render});
})();
