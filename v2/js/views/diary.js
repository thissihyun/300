/* ================================================================
   DIARY — photo-first daily flow: photos / mood+line / thank you / question
   ================================================================ */
(function(){
  let unsub = [];
  function clearSub(){ unsub.forEach(f=>f&&f()); unsub=[]; }

  function questionIndexFor(dateStr){
    const base = new Date('2025-10-23T00:00:00');
    const d = new Date(dateStr+'T00:00:00');
    const n = Math.floor((d-base)/86400000);
    return ((n % window.QUESTIONS.length) + window.QUESTIONS.length) % window.QUESTIONS.length;
  }

  function myName(){ return Identity.displayName(Identity.current()); }
  function partnerName(){ const uid=Identity.current(); const other = Identity.users.find(u=>u.id!==uid); return other ? other.name : ''; }

  function render(container){
    clearSub();
    const today = todayISO();
    const me = myName(), partner = partnerName();
    const qIdx = questionIndexFor(today);
    const question = window.QUESTIONS[qIdx];

    container.innerHTML = `
      <div class="section-head"><div class="section-title">OUR PHOTO DIARY</div><div class="section-note">Keep the days we actually lived.</div></div>
      <p class="section-note">오늘의 실제 사진을 먼저 남기고, 그날의 마음과 고마움, 서로의 답을 기록해요.</p>

      <div class="grid" style="grid-template-columns:2fr 1fr; gap:24px; align-items:start;">
      <div>

        <div class="diary-step">
          <div class="diary-step-num">01 · TODAY'S PHOTOS</div>
          <div class="section-note">Save the day as it looked.</div>
          <div class="grid grid-3" id="todayPhotos" style="margin-top:10px;"></div>
          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn-sm" id="diaryAddPhotoBtn">오늘 사진 추가</button>
            <button class="btn btn-sm btn-outline" data-action="view" data-target="album">PHOTO ALBUM 보기</button>
          </div>
        </div>

        <div class="diary-step">
          <div class="diary-step-num">02 · OUR DAY</div>
          <div class="section-note">오늘 우리에게 있었던 일을 한 줄로 남겨요.</div>
          <div class="mood-grid" id="moodGrid">
            ${window.MOODS.map(([label,emoji])=>`<button class="chip" data-mood="${label}">${emoji} ${label}</button>`).join('')}
          </div>
          <div class="act-grid" id="actGrid">
            ${window.ACTIVITIES.map(([label,emoji])=>`<button class="chip" data-act="${label}">${emoji} ${label}</button>`).join('')}
          </div>
          <textarea class="field" id="dayLine" placeholder="오늘 하루, 한 줄로." style="margin-top:10px;"></textarea>
          <div style="margin-top:8px;"><button class="btn btn-sm" id="saveDayBtn">오늘 기록 저장</button></div>
        </div>

        <div class="diary-step">
          <div class="diary-step-num">03 · THANK YOU</div>
          <div class="section-note">오늘 ${escapeHtml(partner)}에게 고마웠던 것 하나</div>
          <div id="gratitudeHost"></div>
        </div>

        <div class="diary-step">
          <div class="diary-step-num">04 · TODAY'S QUESTION</div>
          <div class="section-note" style="font-weight:600; color:var(--ink);">${escapeHtml(question)}</div>
          <div id="answerHost" style="margin-top:10px;"></div>
        </div>

        <div class="diary-step card" style="text-align:center;">
          <div id="completionText" style="font-family:var(--serif); font-size:20px;">0 / 6</div>
          <div class="section-note">Today is saved. Another day of us.</div>
          <div style="margin-top:10px;"><button class="btn btn-sm" data-action="memory" data-date="${today}">오늘 카드 보기 →</button></div>
        </div>

      </div>
      <div>
        <div class="card jar">
          <div class="jar-emoji">🫙</div>
          <div class="section-title" style="font-size:16px;">OUR THANK-YOU JAR</div>
          <div id="jarDays" style="font-family:var(--serif); font-size:22px; margin-top:6px;">0 days</div>
          <div class="section-note" id="jarStreak">0 day streak</div>
          <div id="jarStars" style="margin-top:8px; line-height:1.6;"></div>
        </div>
      </div>
      </div>
    `;

    // ---- mood / activity chip state
    let selectedMood = null;
    const selectedActs = new Set();
    container.querySelectorAll('#moodGrid [data-mood]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        selectedMood = btn.dataset.mood;
        container.querySelectorAll('#moodGrid [data-mood]').forEach(b=>b.classList.toggle('is-selected', b===btn));
      });
    });
    container.querySelectorAll('#actGrid [data-act]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const a = btn.dataset.act;
        if(selectedActs.has(a)){ selectedActs.delete(a); btn.classList.remove('is-selected'); }
        else { selectedActs.add(a); btn.classList.add('is-selected'); }
      });
    });
    container.querySelector('#saveDayBtn').addEventListener('click', async ()=>{
      const line = container.querySelector('#dayLine').value.trim();
      if(!selectedMood && !line){ Router.toast('감정이나 한 줄을 남겨주세요'); return; }
      await DB.setDailyRecord(today, me, {mood:selectedMood, line, activities:[...selectedActs]});
      await DB.logActivity('record', today, me, line);
      Router.toast(`${me}으로 기록할게요 ♡`);
    });

    // ---- photo upload trigger (delegates to Album's uploader)
    container.querySelector('#diaryAddPhotoBtn').addEventListener('click', ()=>{
      if(window.AlbumView) window.AlbumView.openUploader(today);
    });

    // ---- live subscriptions
    unsub.push(DB.onAllPhotos(photos=>{
      const todays = photos.filter(p=>p.date===today).slice(0,3);
      const host = container.querySelector('#todayPhotos');
      if(!todays.length){
        host.innerHTML = `<div class="empty-frame" style="grid-column:1/-1;">▣<br>아직 오늘의 사진이 없어요.<br>빈 프레임부터 시작해요.</div>`;
      } else {
        host.innerHTML = todays.map(p=>`<div class="photo-frame"><img src="${p.url}" data-action="photo" data-url="${p.url}"></div>`).join('');
      }
    }));

    let myGrat=null, partnerGrat=null;
    function renderGratitude(){
      const host = container.querySelector('#gratitudeHost');
      if(myGrat && partnerGrat){
        host.innerHTML = `<div class="reveal-pair">
          <div class="reveal-card"><div class="reveal-from">FROM ${escapeHtml(me)}</div>${escapeHtml(myGrat)}</div>
          <div class="reveal-card"><div class="reveal-from">FROM ${escapeHtml(partner)}</div>${escapeHtml(partnerGrat)}</div>
        </div>`;
      } else if(!myGrat && partnerGrat){
        host.innerHTML = `<div class="locked-note">💌 ${escapeHtml(partner)}의 감사가 도착했어요. 내가 남기면 함께 열려요.</div>
          <textarea class="field" id="gratInput" style="margin-top:8px;" placeholder="오늘 고마웠던 것 하나"></textarea>
          <div style="margin-top:8px;"><button class="btn btn-sm" id="gratSaveBtn">감사 저장</button></div>`;
        bindGratSave();
      } else {
        host.innerHTML = `<textarea class="field" id="gratInput" placeholder="오늘 고마웠던 것 하나"></textarea>
          <div style="margin-top:8px;"><button class="btn btn-sm" id="gratSaveBtn">감사 저장</button></div>
          ${myGrat ? `<div class="reveal-card" style="margin-top:10px;"><div class="reveal-from">FROM ${escapeHtml(me)}</div>${escapeHtml(myGrat)}</div><div class="locked-note" style="margin-top:8px;">${escapeHtml(partner)}이 아직 작성하지 않았어요.</div>` : ''}`;
        bindGratSave();
      }
    }
    function bindGratSave(){
      const btn = container.querySelector('#gratSaveBtn');
      if(!btn) return;
      btn.addEventListener('click', async ()=>{
        const text = container.querySelector('#gratInput').value.trim();
        if(!text) return;
        await DB.setGratitude(today, me, text);
        await DB.logActivity('gratitude', today, me, text);
        Router.toast('오늘의 감사를 남겼어요 ♡');
      });
    }
    unsub.push(DB.onGratitudeForDate(today, rows=>{
      myGrat = (rows.find(r=>r.from===me)||{}).text || null;
      partnerGrat = (rows.find(r=>r.from===partner)||{}).text || null;
      renderGratitude();
      updateCompletion();
    }));

    let myAns=null, partnerAns=null;
    function renderAnswer(){
      const host = container.querySelector('#answerHost');
      if(myAns && partnerAns){
        host.innerHTML = `<div class="section-note" style="margin-bottom:6px;">OUR ANSWERS</div><div class="reveal-pair">
          <div class="reveal-card"><div class="reveal-from">${escapeHtml(me)}</div>${escapeHtml(myAns)}</div>
          <div class="reveal-card"><div class="reveal-from">${escapeHtml(partner)}</div>${escapeHtml(partnerAns)}</div>
        </div>`;
      } else if(!myAns && partnerAns){
        host.innerHTML = `<div class="locked-note">💌 ${escapeHtml(partner)}이 답했어요. 내가 답하면 함께 열려요.</div>
          <textarea class="field" id="ansInput" style="margin-top:8px;"></textarea>
          <div style="margin-top:8px;"><button class="btn btn-sm" id="ansSaveBtn">답변 저장</button></div>`;
        bindAnsSave();
      } else {
        host.innerHTML = `<textarea class="field" id="ansInput" placeholder="내 답변"></textarea>
          <div style="margin-top:8px;"><button class="btn btn-sm" id="ansSaveBtn">답변 저장</button></div>
          ${myAns ? `<div class="reveal-card" style="margin-top:10px;"><div class="reveal-from">${escapeHtml(me)}</div>${escapeHtml(myAns)}</div><div class="locked-note" style="margin-top:8px;">${escapeHtml(partner)}이 아직 답하지 않았어요.</div>` : ''}`;
        bindAnsSave();
      }
    }
    function bindAnsSave(){
      const btn = container.querySelector('#ansSaveBtn');
      if(!btn) return;
      btn.addEventListener('click', async ()=>{
        const text = container.querySelector('#ansInput').value.trim();
        if(!text) return;
        await DB.setAnswer(today, me, qIdx, text);
        await DB.logActivity('question', today, me, text);
        Router.toast('오늘 질문에 답했어요');
      });
    }
    unsub.push(DB.onAnswersForDate(today, rows=>{
      myAns = (rows.find(r=>r.user===me)||{}).text || null;
      partnerAns = (rows.find(r=>r.user===partner)||{}).text || null;
      renderAnswer();
      updateCompletion();
    }));

    let recDone = {sihyun:false, gangwon:false};
    unsub.push(DB.onDailyRecordsForDate(today, rows=>{
      recDone.sihyun = rows.some(r=>r.user===Identity.displayName('sihyun'));
      recDone.gangwon = rows.some(r=>r.user===Identity.displayName('gangwon'));
      updateCompletion();
    }));

    function updateCompletion(){
      let done = 0;
      if(recDone.sihyun) done++; if(recDone.gangwon) done++;
      if(myGrat) done++; if(partnerGrat) done++;
      if(myAns) done++; if(partnerAns) done++;
      const el = container.querySelector('#completionText');
      if(el) el.textContent = `${done} / 6`;
    }

    // ---- thank-you jar: mutual gratitude days + streak
    unsub.push(DB.onAllGratitude(rows=>{
      const byDate = {};
      rows.forEach(r=>{ (byDate[r.date] = byDate[r.date]||new Set()).add(r.from); });
      const mutualDates = Object.keys(byDate).filter(d=>byDate[d].size>=2).sort();
      container.querySelector('#jarDays').textContent = `${mutualDates.length} days`;
      // streak ending today
      let streak = 0;
      let cursor = new Date();
      while(true){
        const key = todayISO(cursor);
        if(byDate[key] && byDate[key].size>=2){ streak++; cursor.setDate(cursor.getDate()-1); }
        else break;
      }
      container.querySelector('#jarStreak').textContent = `${streak} day streak`;
      const starsEl = container.querySelector('#jarStars');
      if(starsEl){
        const count = Math.min(30, mutualDates.length);
        starsEl.innerHTML = Array.from({length:count}, (_,i)=>
          `<span class="jar-star" style="animation-delay:${Math.min(i*30,300)}ms;">${i%5===0?'✦':i%3===0?'♡':'★'}</span>`).join('');
      }
    }));
  }

  Router.registerView('diary', {render});
})();
