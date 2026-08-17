/* ================================================================
   OUR FUTURE — Postcards / Someday With You / Letter to Future Us
   ================================================================ */
(function(){
  let unsub = [];
  function clearSub(){ unsub.forEach(f=>f&&f()); unsub=[]; }
  const SEED_PLACES = ['MoMA','Raku','Beacon','San Diego'];
  const BUCKET_CATS = [
    {key:'places', label:'PLACES'}, {key:'little', label:'LITTLE THINGS'},
    {key:'try', label:'THINGS TO TRY'}, {key:'years', label:'YEARS AHEAD'},
  ];

  function me(){ return Identity.displayName(Identity.current()); }

  function renderPostcards(panel){
    panel.innerHTML = `
      <div class="section-note">다시 가고 싶은 곳. 왜 다시 가고 싶은지 둘이 직접 적어요.</div>
      <div style="display:flex; gap:8px; margin:12px 0;">
        <input class="field" id="pcNewPlace" placeholder="장소 추가 (예: MoMA)">
        <button class="btn btn-sm" id="pcAddBtn">추가</button>
      </div>
      <div id="pcSeeds" class="mood-grid" style="margin-bottom:14px;"></div>
      <div id="pcGrid" class="grid grid-2"></div>
    `;
    panel.querySelector('#pcSeeds').innerHTML = SEED_PLACES.map(p=>`<button class="chip" data-seed="${p}">+ ${p}</button>`).join('');
    panel.querySelector('#pcAddBtn').addEventListener('click', async ()=>{
      const val = panel.querySelector('#pcNewPlace').value.trim();
      if(!val) return;
      await DB.addPostcard({place:val, why:''});
      panel.querySelector('#pcNewPlace').value='';
    });
    panel.querySelectorAll('[data-seed]').forEach(b=>b.addEventListener('click', ()=> DB.addPostcard({place:b.dataset.seed, why:''})));

    unsub.push(DB.onPostcards(rows=>{
      const grid = panel.querySelector('#pcGrid');
      if(!grid) return;
      if(!rows.length){ grid.innerHTML = '<div class="empty-frame" style="grid-column:1/-1;">아직 추가한 장소가 없어요.</div>'; return; }
      grid.innerHTML = rows.map(r=>`
        <div class="postcard">
          <div style="font-family:var(--serif); font-size:18px;">${escapeHtml(r.place)}</div>
          <div class="section-note" style="margin:8px 0 4px;">WHY WE'D RETURN</div>
          <textarea class="field" data-why="${r.id}">${escapeHtml(r.why||'')}</textarea>
          <div style="margin-top:8px; display:flex; gap:8px;">
            <button class="btn btn-sm btn-outline" data-del-pc="${r.id}">삭제</button>
          </div>
        </div>`).join('');
      grid.querySelectorAll('[data-why]').forEach(ta=>{
        let t=null;
        ta.addEventListener('input', ()=>{ clearTimeout(t); t=setTimeout(()=> DB.updatePostcard(ta.dataset.why, {why:ta.value}), 600); });
      });
      grid.querySelectorAll('[data-del-pc]').forEach(b=> b.addEventListener('click', ()=> DB.deletePostcard(b.dataset.delPc)));
    }));
  }

  function renderBucket(panel){
    panel.innerHTML = `
      <div class="section-note">앞으로 같이 하고 싶은 것들.</div>
      <div style="display:flex; gap:8px; margin:12px 0; flex-wrap:wrap;">
        <select class="field" id="bkCat" style="max-width:160px;">${BUCKET_CATS.map(c=>`<option value="${c.key}">${c.label}</option>`).join('')}</select>
        <input class="field" id="bkNew" placeholder="하고 싶은 것" style="flex:1;">
        <button class="btn btn-sm" id="bkAddBtn">추가</button>
      </div>
      <div id="bkLists"></div>
    `;
    panel.querySelector('#bkAddBtn').addEventListener('click', async ()=>{
      const text = panel.querySelector('#bkNew').value.trim();
      if(!text) return;
      const type = panel.querySelector('#bkCat').value;
      await DB.addBucketItem({type, text, done:false, author:me()});
      panel.querySelector('#bkNew').value='';
    });
    unsub.push(DB.onBucketItems(rows=>{
      const host = panel.querySelector('#bkLists');
      if(!host) return;
      host.innerHTML = BUCKET_CATS.map(c=>{
        const items = rows.filter(r=>r.type===c.key);
        return `<div class="section">
          <div class="eyebrow">${c.label}</div>
          <div class="card">${items.length ? items.map(it=>`
            <div class="bucket-item ${it.done?'is-done':''}">
              <input type="checkbox" data-toggle="${it.id}" ${it.done?'checked':''}>
              <div class="bucket-text" style="flex:1;">${escapeHtml(it.text)}</div>
              ${it.done?'<span class="wedidit-stamp">WE DID IT</span>':''}
              <button class="icon-btn" data-del-bk="${it.id}" style="width:30px;height:30px;">✕</button>
            </div>`).join('') : '<div class="section-note">아직 없어요.</div>'}</div>
        </div>`;
      }).join('');
      host.querySelectorAll('[data-toggle]').forEach(cb=> cb.addEventListener('change', ()=>{
        DB.updateBucketItem(cb.dataset.toggle, {done:cb.checked});
        if(cb.checked && window.V2Anim) V2Anim.sparkleAt(cb.closest('.bucket-item'), 6);
      }));
      host.querySelectorAll('[data-del-bk]').forEach(b=> b.addEventListener('click', ()=> DB.deleteBucketItem(b.dataset.delBk)));
    }));
  }

  function renderNewPlaces(panel){
    panel.innerHTML = `
      <div class="section-note">아직 못 가봤지만 언젠가 같이 가고 싶은 곳.</div>
      <div style="display:flex; gap:8px; margin:12px 0;">
        <input class="field" id="npNew" placeholder="가보고 싶은 곳">
        <button class="btn btn-sm" id="npAddBtn">추가</button>
      </div>
      <div id="npSeeds" class="mood-grid" style="margin-bottom:14px;"></div>
      <div id="npList" class="card"></div>
    `;
    panel.querySelector('#npSeeds').innerHTML = window.NEWPLACES_SEED.map(s=>`<button class="chip" data-seed="${escapeHtml(s.text)}">+ ${escapeHtml(s.text)}</button>`).join('');
    panel.querySelector('#npAddBtn').addEventListener('click', async ()=>{
      const val = panel.querySelector('#npNew').value.trim();
      if(!val) return;
      await DB.addBucketItem({type:'newplaces', text:val, done:false, author:me()});
      panel.querySelector('#npNew').value='';
    });
    panel.querySelectorAll('#npSeeds [data-seed]').forEach(b=>b.addEventListener('click', ()=> DB.addBucketItem({type:'newplaces', text:b.dataset.seed, done:false, author:me()})));
    unsub.push(DB.onBucketItems(rows=>{
      const list = panel.querySelector('#npList');
      if(!list) return;
      const items = rows.filter(r=>r.type==='newplaces');
      list.innerHTML = items.length ? items.map(it=>`
        <div class="bucket-item"><div class="bucket-text" style="flex:1;">${escapeHtml(it.text)}</div>
          <button class="icon-btn" data-del-np="${it.id}" style="width:30px;height:30px;">✕</button></div>`).join('')
        : '<div class="section-note">가보고 싶은 곳을 추가해보세요.</div>';
      list.querySelectorAll('[data-del-np]').forEach(b=> b.addEventListener('click', ()=> DB.deleteBucketItem(b.dataset.delNp)));
    }));
  }

  function renderPromises(panel){
    panel.innerHTML = `
      <div class="section-note">서로에게 하는 작은 약속들.</div>
      <div style="display:flex; gap:8px; margin:12px 0;">
        <input class="field" id="prNew" placeholder="우리의 약속">
        <button class="btn btn-sm" id="prAddBtn">추가</button>
      </div>
      <div id="prSeeds" class="mood-grid" style="margin-bottom:14px;"></div>
      <div id="prList" class="card"></div>
    `;
    panel.querySelector('#prSeeds').innerHTML = window.PROMISES_SEED.map(s=>`<button class="chip" data-seed="${escapeHtml(s.text)}">+ ${escapeHtml(s.text)}</button>`).join('');
    panel.querySelector('#prAddBtn').addEventListener('click', async ()=>{
      const val = panel.querySelector('#prNew').value.trim();
      if(!val) return;
      await DB.addBucketItem({type:'promises', text:val, done:false, author:me()});
      panel.querySelector('#prNew').value='';
    });
    panel.querySelectorAll('#prSeeds [data-seed]').forEach(b=>b.addEventListener('click', ()=> DB.addBucketItem({type:'promises', text:b.dataset.seed, done:false, author:me()})));
    unsub.push(DB.onBucketItems(rows=>{
      const list = panel.querySelector('#prList');
      if(!list) return;
      const items = rows.filter(r=>r.type==='promises');
      list.innerHTML = items.length ? items.map(it=>`
        <div class="bucket-item ${it.done?'is-done':''}">
          <input type="checkbox" data-toggle-pr="${it.id}" ${it.done?'checked':''}>
          <div class="bucket-text" style="flex:1;">${escapeHtml(it.text)}</div>
          ${it.done?'<span class="wedidit-stamp">WE DID IT</span>':''}
          <button class="icon-btn" data-del-pr="${it.id}" style="width:30px;height:30px;">✕</button>
        </div>`).join('') : '<div class="section-note">약속을 추가해보세요.</div>';
      list.querySelectorAll('[data-toggle-pr]').forEach(cb=> cb.addEventListener('change', ()=>{
        DB.updateBucketItem(cb.dataset.togglePr, {done:cb.checked});
        if(cb.checked && window.V2Anim) V2Anim.sparkleAt(cb.closest('.bucket-item'), 6);
      }));
      list.querySelectorAll('[data-del-pr]').forEach(b=> b.addEventListener('click', ()=> DB.deleteBucketItem(b.dataset.delPr)));
    }));
  }

  function renderDay500(panel){
    const target = new Date(window.DAY1); target.setDate(target.getDate()+499);
    const targetStr = `${target.getFullYear()}.${String(target.getMonth()+1).padStart(2,'0')}.${String(target.getDate()).padStart(2,'0')}`;
    const dNum = dayNumber(todayISO());
    if(dNum < 500){
      const daysLeft = 500 - dNum;
      panel.innerHTML = `
        <div class="envelope" style="text-align:center;">
          <div style="font-size:34px;">🔒</div>
          <div style="font-family:var(--serif); margin-top:6px;">DAY 500 (${targetStr})에 다시 열어볼 수 있어요.</div>
          <div class="section-note">앞으로 ${daysLeft}일 남았어요. 지금은 계속 수정할 수 있어요.</div>
        </div>
        <textarea class="field" id="day500Area" style="margin-top:12px; min-height:160px;" placeholder="DAY 500에 열어볼 편지를 지금 써두세요."></textarea>
        <div class="section-note" id="day500Hint" style="margin-top:6px;">자동 저장돼요.</div>`;
      const area = panel.querySelector('#day500Area');
      let t;
      unsub.push(DB.onDay500Letter(d=>{ if(document.activeElement !== area) area.value = (d && d.text) || ''; }));
      area.addEventListener('input', ()=>{
        clearTimeout(t);
        const hint = panel.querySelector('#day500Hint');
        hint.textContent = '저장 중…';
        t = setTimeout(async ()=>{ await DB.setDay500Letter(area.value); hint.textContent = '저장됨 ✓'; }, 600);
      });
    } else {
      panel.innerHTML = `<div class="eyebrow">DAY 500 — 이제 열어볼 수 있어요</div><div class="story-text" id="day500Text">아직 쓰인 편지가 없어요.</div>`;
      unsub.push(DB.onDay500Letter(d=>{
        const el = panel.querySelector('#day500Text');
        if(el) el.textContent = (d && d.text) ? d.text : '아직 쓰인 편지가 없어요.';
      }));
    }
  }

  function renderLetters(panel){
    panel.innerHTML = `
      <div class="envelope">
        <div class="section-note">미래의 우리에게.</div>
        <textarea class="field" id="letterText" style="margin-top:8px; min-height:120px;" placeholder="편지를 적어주세요"></textarea>
        <div style="display:flex; gap:8px; margin-top:10px; align-items:center; flex-wrap:wrap;">
          <label class="section-note">열어볼 날짜</label>
          <input class="field" type="date" id="letterOpenDate" style="max-width:180px;">
          <button class="btn btn-sm" id="sealBtn">Seal this letter</button>
        </div>
      </div>
      <div id="letterList" style="margin-top:20px;"></div>
    `;
    panel.querySelector('#sealBtn').addEventListener('click', async ()=>{
      const text = panel.querySelector('#letterText').value.trim();
      const openDate = panel.querySelector('#letterOpenDate').value;
      if(!text || !openDate){ Router.toast('편지와 여는 날짜를 모두 채워주세요'); return; }
      await DB.addLetter({text, openDate, author:me(), opened:false});
      panel.querySelector('#letterText').value=''; panel.querySelector('#letterOpenDate').value='';
      Router.toast('편지를 봉인했어요');
    });
    unsub.push(DB.onLetters(rows=>{
      const host = panel.querySelector('#letterList');
      if(!host) return;
      const today = todayISO();
      if(!rows.length){ host.innerHTML = '<div class="empty-frame">아직 봉인한 편지가 없어요.</div>'; return; }
      host.innerHTML = rows.map(r=>{
        const canOpen = today >= r.openDate;
        return `<div class="card" style="margin-bottom:10px;">
          <div class="eyebrow">${escapeHtml(r.author||'')} · OPEN ON ${r.openDate}</div>
          ${canOpen ? `<div class="story-text">${escapeHtml(r.text)}</div>` : `<div class="locked-note" style="margin-top:8px;">Sealed until ${r.openDate}.</div>`}
        </div>`;
      }).join('');
    }));
  }

  function render(container){
    clearSub();
    container.innerHTML = `
      <div class="section-head"><div class="section-title">OUR FUTURE</div><div class="section-note">Still becoming us.</div></div>
      <div class="future-tabs">
        <button data-action="tab" data-group="future" data-target="postcards" data-tabbtn="future" class="is-active">POSTCARDS TO US AGAIN</button>
        <button data-action="tab" data-group="future" data-target="bucket" data-tabbtn="future">SOMEDAY, WITH YOU</button>
        <button data-action="tab" data-group="future" data-target="newplaces" data-tabbtn="future">HAVEN'T BEEN YET</button>
        <button data-action="tab" data-group="future" data-target="promises" data-tabbtn="future">OUR SMALL PROMISES</button>
        <button data-action="tab" data-group="future" data-target="letter" data-tabbtn="future">LETTER TO FUTURE US</button>
        <button data-action="tab" data-group="future" data-target="day500" data-tabbtn="future">OPEN ON DAY 500</button>
      </div>
      <div data-tabpanel="future" data-panel="postcards" class="tab-panel is-active"></div>
      <div data-tabpanel="future" data-panel="bucket" class="tab-panel"></div>
      <div data-tabpanel="future" data-panel="newplaces" class="tab-panel"></div>
      <div data-tabpanel="future" data-panel="promises" class="tab-panel"></div>
      <div data-tabpanel="future" data-panel="letter" class="tab-panel"></div>
      <div data-tabpanel="future" data-panel="day500" class="tab-panel"></div>
    `;
    renderPostcards(container.querySelector('[data-panel="postcards"]'));
    renderBucket(container.querySelector('[data-panel="bucket"]'));
    renderNewPlaces(container.querySelector('[data-panel="newplaces"]'));
    renderPromises(container.querySelector('[data-panel="promises"]'));
    renderLetters(container.querySelector('[data-panel="letter"]'));
    renderDay500(container.querySelector('[data-panel="day500"]'));
  }

  Router.registerView('future', {render});
})();
