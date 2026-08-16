/* ================================================================
   MEMORY DETAIL — the core screen. Story + kakao + photos + daily
   card + likes + favorite + note + comments + prev/next.
   ================================================================ */
(function(){
  let unsub = [];
  function clearSub(){ unsub.forEach(f=>f&&f()); unsub=[]; }
  let currentDate = null;

  function sortedDates(){ return Object.keys(window.EVENTS).sort(); }

  // Section 27/84 — each chapter reads like a different travel-magazine issue,
  // not just a different accent color.
  const THEME_META = {
    'theme-nyc':      {masthead:'NEW YORK FIELD NOTES',   tagline:'NEW YORK, WHERE WE STARTED'},
    'theme-park':     {masthead:'CENTRAL PARK ISSUE',      tagline:'AUTUMN IN CENTRAL PARK'},
    'theme-west':     {masthead:'WEST COAST ROAD BOOK',    tagline:'GO WEST, TOGETHER'},
    'theme-korea':    {masthead:'KOREA EDITION',           tagline:'BACK HOME, STILL US'},
    'theme-distance': {masthead:'LONG DISTANCE ISSUE',     tagline:'SAME US, TWO PLACES'},
  };
  function themeForEvent(ev){
    const chapter = ev.chapter||'';
    if(/central park/i.test(ev.title||'')) return 'theme-park';
    if(chapter.startsWith('CHAPTER 6')) return 'theme-west';
    if(chapter.startsWith('CHAPTER 7')) return 'theme-korea';
    if(chapter.startsWith('CHAPTER 8')) return 'theme-distance';
    if(chapter.startsWith('CHAPTER 9')) return 'theme-korea';
    if(chapter.startsWith('FINAL')) return 'theme-distance';
    return 'theme-nyc';
  }

  function myName(){ return Identity.displayName(Identity.current()); }

  function open(date){
    currentDate = date;
    clearSub();
    const ev = window.EVENTS[date] || {chapter:'', title:'This day is still being written', story:'', kakao:[]};
    const panel = document.getElementById('memoryPanel');
    const theme = themeForEvent(ev);
    const meta = THEME_META[theme];
    panel.className = 'modal-panel ' + theme;

    panel.innerHTML = `
      <div class="issue-masthead">
        <span>${escapeHtml(meta.masthead)}</span>
        <span class="issue-tagline">${escapeHtml(meta.tagline)}</span>
      </div>
      <div class="modal-top">
        <button class="icon-btn" data-action="close-modal">✕</button>
        <button class="like-btn" id="favBtn">♥ Favorite</button>
      </div>
      <div class="modal-date">${escapeHtml(fmtDate(date))} · DAY ${dayNumber(date)}</div>
      <div class="modal-chapter">${escapeHtml(ev.chapter)}</div>
      <h2 class="modal-title">${escapeHtml(ev.title)}</h2>

      <div class="like-row">
        <button class="like-btn" id="likeSihyun" data-user="sihyun">시현 🤍</button>
        <button class="like-btn" id="likeGangwon" data-user="gangwon">강원 🤍</button>
      </div>

      ${ev.story ? `<div class="story-text">${escapeHtml(ev.story)}</div>` : `<div class="empty-frame">${escapeHtml(ev.title)}</div>`}

      ${(window.STORY_LINKS[date]||[]).map(([linkDate,label])=>`
        <button class="card card-btn" style="display:flex; align-items:center; gap:8px; margin-bottom:10px; padding:10px 14px;" data-action="memory" data-date="${linkDate}">
          <span style="color:var(--gold);">↳</span>
          <span style="font-family:var(--hand); font-size:14px;">${escapeHtml(label)}</span>
        </button>`).join('')}

      ${ev.kakao && ev.kakao.length ? `
        <div class="kakao-block" id="kakaoBlock">
          ${ev.kakao.map(([who,text],i)=>`
            <div class="kakao-msg from-${escapeHtml(who)}" style="position:relative;">
              ${escapeHtml(text)}
              <span class="kakao-like-row" data-kakao-idx="${i}">
                <button class="kakao-like-btn" data-kakao-heart="${i}" title="저장">♡</button>
                <button class="kakao-best-btn" data-kakao-best="${i}" title="BEST" style="display:none;">★</button>
              </span>
            </div>`).join('')}
        </div>` : ''}

      <div class="section-head" style="margin-top:20px;"><div class="section-title" style="font-size:16px;">사진</div></div>
      <div class="photo-gallery" id="memPhotoGallery"></div>
      <button class="btn btn-sm btn-outline" id="memAddPhotoBtn">사진 추가</button>

      <div class="section-head" style="margin-top:24px;"><div class="section-title" style="font-size:16px;">그날의 우리</div></div>
      <div id="dailyCardHost" class="card"></div>

      <div class="note-area">
        <div class="section-note">나의 한 줄 (직접 편집 가능)</div>
        <textarea class="field" id="memNote" placeholder="이 날에 대해 자유롭게 적어보세요"></textarea>
      </div>

      <div class="section-head" style="margin-top:20px;"><div class="section-title" style="font-size:16px;">댓글</div></div>
      <div id="commentList"></div>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <input class="field" id="commentInput" placeholder="이 날의 기억에 댓글 남기기">
        <button class="btn btn-sm" id="commentSendBtn">남기기</button>
      </div>

      <div class="nav-row">
        <button class="btn btn-outline btn-sm" id="prevMemBtn">◀ 이전 기억</button>
        <button class="btn btn-outline btn-sm" id="nextMemBtn">다음 기억 ▶</button>
      </div>
    `;

    document.getElementById('memoryModal').classList.add('is-open');
    document.body.classList.add('modal-open');

    wireInteractions(date, ev);
  }

  function wireInteractions(date, ev){
    const panel = document.getElementById('memoryPanel');
    const me = myName();

    // per-message kakao like / best (Section: liked kakao messages archive)
    if(ev.kakao && ev.kakao.length){
      unsub.push(DB.onAllChatLikes(rows=>{
        const mine = {};
        rows.filter(r=>r.date===date).forEach(r=>{ mine[r.msgIndex] = r; });
        ev.kakao.forEach((msg,i)=>{
          const heartBtn = panel.querySelector(`[data-kakao-heart="${i}"]`);
          const bestBtn = panel.querySelector(`[data-kakao-best="${i}"]`);
          if(!heartBtn) return;
          const liked = !!mine[i];
          heartBtn.classList.toggle('is-liked', liked);
          heartBtn.textContent = liked ? '♥' : '♡';
          bestBtn.style.display = liked ? '' : 'none';
          bestBtn.classList.toggle('is-best', liked && mine[i].best);
        });
      }));
      panel.querySelectorAll('[data-kakao-heart]').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          const i = +btn.dataset.kakaoHeart;
          const liked = btn.classList.contains('is-liked');
          if(liked) await DB.deleteChatLike(date, i);
          else await DB.setChatLike(date, i, {speaker:ev.kakao[i][0], text:ev.kakao[i][1], best:false, savedBy:me});
        });
      });
      panel.querySelectorAll('[data-kakao-best]').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          const i = +btn.dataset.kakaoBest;
          const nowBest = btn.classList.contains('is-best');
          await DB.setChatLike(date, i, {speaker:ev.kakao[i][0], text:ev.kakao[i][1], best:!nowBest, savedBy:me});
        });
      });
    }

    // favorite
    let favVal = false;
    unsub.push(DB.onFavorite(date, d=>{ favVal = !!(d&&d.value); updateFav(); }));
    function updateFav(){ panel.querySelector('#favBtn').classList.toggle('is-liked', favVal); }
    panel.querySelector('#favBtn').addEventListener('click', async ()=>{
      favVal = !favVal;
      await DB.setFavorite(date, favVal);
      updateFav();
    });

    // individual likes
    let likes = {sihyun:false, gangwon:false};
    unsub.push(DB.onAllReactions(rows=>{
      likes.sihyun = rows.some(r=>r.date===date && r.user===Identity.displayName('sihyun') && r.liked);
      likes.gangwon = rows.some(r=>r.date===date && r.user===Identity.displayName('gangwon') && r.liked);
      updateLikes();
    }));
    function updateLikes(){
      const sBtn = panel.querySelector('#likeSihyun'), gBtn = panel.querySelector('#likeGangwon');
      sBtn.textContent = '시현 ' + (likes.sihyun ? '♥' : '🤍');
      sBtn.classList.toggle('is-liked', likes.sihyun);
      gBtn.textContent = '강원 ' + (likes.gangwon ? '♥' : '🤍');
      gBtn.classList.toggle('is-liked', likes.gangwon);
    }
    ['likeSihyun','likeGangwon'].forEach(id=>{
      panel.querySelector('#'+id).addEventListener('click', async (e)=>{
        const uid = e.currentTarget.dataset.user;
        if(uid !== Identity.current()){ Router.toast('본인 좋아요만 남길 수 있어요'); return; }
        const name = Identity.displayName(uid);
        const willLike = !likes[uid];
        await DB.setLiked(date, name, willLike);
      });
    });

    // photos
    unsub.push(DB.onAllPhotos(photos=>{
      const dayPhotos = photos.filter(p=>p.date===date);
      const gallery = panel.querySelector('#memPhotoGallery');
      if(!dayPhotos.length){
        gallery.innerHTML = `<div class="empty-frame" style="grid-column:1/-1;">▣<br>사진이 아직 없어요</div>`;
      } else {
        gallery.innerHTML = dayPhotos.map(p=>`
          <div class="photo-frame">
            ${p.hero ? '<div class="hero-flag">HERO</div>' : ''}
            <img src="${p.url}" data-action="photo" data-url="${p.url}">
          </div>`).join('');
      }
    }));
    panel.querySelector('#memAddPhotoBtn').addEventListener('click', ()=>{
      if(window.AlbumView) window.AlbumView.openUploader(date);
    });

    // daily card (that date's Our Day / Thank You / Question)
    let rec=[], grat=[], ans=[];
    function renderDailyCard(){
      const host = panel.querySelector('#dailyCardHost');
      const has = rec.length || grat.length || ans.length;
      if(!has){ host.innerHTML = `<div class="empty-frame">This day is still being written.</div>`; return; }
      host.innerHTML = `
        <div class="eyebrow">DAILY CARD · ${escapeHtml(date)}</div>
        ${rec.length ? `<div style="margin-top:8px;"><b>OUR DAY</b><br>${rec.map(r=>`${escapeHtml(r.user)}: ${escapeHtml(r.line||r.mood||'')}`).join('<br>')}</div>` : ''}
        ${grat.length ? `<div style="margin-top:8px;"><b>THANK YOU</b><br>${grat.map(g=>`${escapeHtml(g.from)} → ${escapeHtml(g.text)}`).join('<br>')}</div>` : ''}
        ${ans.length ? `<div style="margin-top:8px;"><b>QUESTION</b><br>${ans.map(a=>`${escapeHtml(a.user)}: ${escapeHtml(a.text)}`).join('<br>')}</div>` : ''}
      `;
    }
    unsub.push(DB.onDailyRecordsForDate(date, rows=>{ rec=rows; renderDailyCard(); }));
    unsub.push(DB.onGratitudeForDate(date, rows=>{ grat=rows; renderDailyCard(); }));
    unsub.push(DB.onAnswersForDate(date, rows=>{ ans=rows; renderDailyCard(); }));

    // note (autosave, debounced)
    let noteTimer = null;
    unsub.push(DB.onNote(date, d=>{
      const ta = panel.querySelector('#memNote');
      if(document.activeElement !== ta) ta.value = (d && d.text) || '';
    }));
    panel.querySelector('#memNote').addEventListener('input', (e)=>{
      clearTimeout(noteTimer);
      const val = e.target.value;
      noteTimer = setTimeout(()=> DB.setNote(date, val), 600);
    });

    // comments
    unsub.push(DB.onCommentsForDate(date, rows=>{
      const host = panel.querySelector('#commentList');
      if(!rows.length){ host.innerHTML = `<div class="empty-frame">아직 댓글이 없어요.</div>`; return; }
      host.innerHTML = rows.map(c=>`<div class="comment-item"><span class="comment-author">${escapeHtml(c.author)}</span>${escapeHtml(c.text)}</div>`).join('');
    }));
    panel.querySelector('#commentSendBtn').addEventListener('click', async ()=>{
      const input = panel.querySelector('#commentInput');
      const text = input.value.trim();
      if(!text) return;
      await DB.addComment(date, me, text);
      await DB.logActivity('comment', date, me, text);
      input.value = '';
    });

    // prev/next
    const dates = sortedDates();
    const idx = dates.indexOf(date);
    const prevBtn = panel.querySelector('#prevMemBtn'), nextBtn = panel.querySelector('#nextMemBtn');
    if(idx <= 0) prevBtn.disabled = true; else prevBtn.addEventListener('click', ()=> open(dates[idx-1]));
    if(idx === -1 || idx >= dates.length-1) nextBtn.disabled = true; else nextBtn.addEventListener('click', ()=> open(dates[idx+1]));
  }

  function close(){
    document.getElementById('memoryModal').classList.remove('is-open');
    document.body.classList.remove('modal-open');
    clearSub();
    currentDate = null;
  }

  window.MemoryView = {open, close, get currentDate(){ return currentDate; }};
})();
