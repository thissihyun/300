/* Exact-text correction guard + Our Days calendar date bridge. */
(function(){
  const rows=window.V3_LATEST_CHAT_PATCH&&window.V3_LATEST_CHAT_PATCH['2026-08-17'];
  if(Array.isArray(rows)){
    const hit=rows.find(m=>m&&m.t==='신세계가면 배부를수도..!?' );
    if(hit)hit.t='신세계가면 배부를수도..!?';
  }
})();

/* V2 calendar only puts data-date on event/chat cells. V6 needs an exact date
   on every real day cell so photo-only days can use the same editor too. */
(function(){
  const MONTH={January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};
  let queued=false;
  function tagCalendarDates(){
    const view=document.getElementById('view-ourdays');
    if(!view)return;
    const label=view.querySelector('#monthLabel');
    const text=(label&&label.textContent||'').trim();
    const hit=text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i);
    if(!hit)return;
    const key=hit[1][0].toUpperCase()+hit[1].slice(1).toLowerCase(),year=Number(hit[2]),month=MONTH[key];
    if(!month)return;
    view.querySelectorAll('.cal-cell:not(.is-empty)').forEach(cell=>{
      const n=Number(cell.querySelector('.cal-num')?.textContent);
      if(!n)return;
      const date=`${year}-${String(month).padStart(2,'0')}-${String(n).padStart(2,'0')}`;
      cell.dataset.v6Date=date;
      if(!cell.dataset.date)cell.dataset.date=date;
    });
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;tagCalendarDates()})}
  const mo=new MutationObserver(queue);
  mo.observe(document.body,{childList:true,subtree:true,characterData:true});
  window.addEventListener('hashchange',queue);
  queue();
})();
