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

  function monthEntries(y,m){
    const prefix = `${y}-${pad(m+1)}`;
    return Object.entries(window.EVENTS).filter(([k])=>k.startsWith(prefix)).sort((a,b)=>a[0]<b[0]?-1:1);
  }

  function renderCalendar(host, y, m){
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
      const isBirthday = ev && /생일/.test(ev.title);
      const cls = ['cal-cell'];
      if(ev) cls.push('has-event');
      if(isToday) cls.push('is-today');
      if(isBirthday) cls.push('is-birthday');
      cells += `<button class="${cls.join(' ')}" ${ev?`data-action="memory" data-date="${key}"`:''}>
        <div class="cal-num">${d}</div>
        ${ev ? `<div class="cal-title">${escapeHtml(ev.title)}</div>` : ''}
      </button>`;
    }
    host.innerHTML = `<div class="cal-grid" style="margin-bottom:6px;">${['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}</div>
      <div class="cal-grid">${cells}</div>`;
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

    function draw(){
      const y = cursor.getFullYear(), m = cursor.getMonth();
      container.querySelector('#monthLabel').textContent = `${MONTH_NAMES[m]} ${y}`;
      renderCalendar(container.querySelector('#calHost'), y, m);
      renderList(container.querySelector('#listHost'), y, m);
    }
    container.querySelector('#prevMonth').addEventListener('click', ()=>{ cursor.setMonth(cursor.getMonth()-1); draw(); });
    container.querySelector('#nextMonth').addEventListener('click', ()=>{ cursor.setMonth(cursor.getMonth()+1); draw(); });
    draw();

    unsub.push(DB.onAllDailyRecords(rows=>{
      const y = cursor.getFullYear(), m = cursor.getMonth();
      renderReport(container.querySelector('#reportHost'), y, m, rows);
      const origDraw = draw;
      container.querySelector('#prevMonth').onclick = ()=>{ cursor.setMonth(cursor.getMonth()-1); origDraw(); renderReport(container.querySelector('#reportHost'), cursor.getFullYear(), cursor.getMonth(), rows); };
      container.querySelector('#nextMonth').onclick = ()=>{ cursor.setMonth(cursor.getMonth()+1); origDraw(); renderReport(container.querySelector('#reportHost'), cursor.getFullYear(), cursor.getMonth(), rows); };
    }));
  }

  Router.registerView('ourdays', {render});
})();
