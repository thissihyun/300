/* ================================================================
   OUR STORY, AS A MOVIE — full chronological timeline by chapter
   ================================================================ */
(function(){
  function render(container){
    const byChapter = {};
    Object.entries(window.EVENTS).sort((a,b)=>a[0]<b[0]?-1:1).forEach(([date,ev])=>{
      (byChapter[ev.chapter] = byChapter[ev.chapter]||[]).push([date,ev]);
    });
    const milestoneDates = new Set(window.MILESTONES.map(m=>m.date));

    container.innerHTML = `
      <div class="section-head"><div class="section-title">OUR STORY, AS A MOVIE</div></div>
      ${window.CHAPTER_ORDER.filter(c=>byChapter[c]).map(chapter=>`
        <div class="section">
          <div class="eyebrow">${escapeHtml(chapter)}</div>
          <div class="card" style="margin-top:10px;">
            ${byChapter[chapter].map(([date,ev])=>`
              <button class="list-row card-btn" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);" data-action="memory" data-date="${date}">
                <div class="list-date">${date.slice(5)}</div>
                <div style="flex:1; text-align:left; margin-left:14px;">
                  <div style="font-family:var(--serif);">${milestoneDates.has(date)?'★ ':''}${escapeHtml(ev.title)}</div>
                  <div class="section-note">${escapeHtml(ev.story||'')}</div>
                </div>
              </button>`).join('')}
          </div>
        </div>
      `).join('')}
    `;
  }
  Router.registerView('ourstory', {render});
})();
