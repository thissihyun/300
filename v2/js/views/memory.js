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

  // Highlight affection/tension words inline (Section 23 kakao emphasis).
  function emphasize(text){
    let out = escapeHtml(text);
    (window.AFFECTION_WORDS||[]).concat(window.TENSION_WORDS||[]).forEach(w=>{
      if(!w) return;
      out = out.split(escapeHtml(w)).join(`<mark>${escapeHtml(w)}</mark>`);
    });
    return out;
  }
  // Best-effort real timestamp for a curated kakao line, once fullchat.js has loaded.
  function realTimeFor(date, speaker, text){
    if(!window.FULL_CHAT_DATA || !window.FULL_CHAT_DATA[date]) return null;
    const hit = window.FULL_CHAT_DATA[date].find(m => m.t === text);
    if(!hit) return null;
    return `${hit.ap} ${hit.h}:${String(hit.m).padStart(2,'0')}`;
  }

  // "우리 카톡" — real messages for the day, pulled from the full Kakao archive.
  // Baseline is up to 20, prioritized toward emotionally warm lines (두근거림/
  // 행복/편안함/애틋함/보고싶음/고마움), each shown with its real timestamp.
  // Messages containing one of the CORE_WORDS are never truncated by the cap —
  // every one of those shows, even if that pushes the day's total past 20.
  const REAL_KAKAO_MAX = 20;
  const REAL_KAKAO_COLLAPSED = 6;
  const EMOTION_RE = /두근|설레|설렘|떨려|떨린|행복|최고|기쁘|즐거|신나|편안|안심|포근|든든|애틋|짠하|뭉클|보고\s?싶|그리워|그립|고마워|고맙|감사/;
  const CORE_WORDS = ['사랑해','보고싶어','보고 싶어','아가','여보','결혼','평생','고마워','행복'];
  const CORE_WORDS_RE = new RegExp(CORE_WORDS.map(w=>w.replace(/ /g,'\\s?')).join('|'));
  function realKakaoList(date){
    const rows = window.FULL_CHAT_DATA && window.FULL_CHAT_DATA[date];
    if(!rows || !rows.length) return [];
    const withMeta = rows.map((m,i)=>({
      speaker: m.s, text: m.t, idx: i,
      core: CORE_WORDS_RE.test(m.t), emotion: EMOTION_RE.test(m.t),
      time: `${m.ap} ${m.h}:${String(m.m).padStart(2,'0')}`,
    }));
    const core = withMeta.filter(m=>m.core);
    const otherEmotion = withMeta.filter(m=>!m.core && m.emotion);
    const rest = withMeta.filter(m=>!m.core && !m.emotion);
    const picked = core.slice(); // uncapped — every core-word message shows
    picked.push(...otherEmotion.slice(0, Math.max(0, REAL_KAKAO_MAX - picked.length)));
    picked.push(...rest.slice(0, Math.max(0, REAL_KAKAO_MAX - picked.length)));
    return picked.sort((a,b)=>a.idx-b.idx);
  }
  function realKakaoHtml(date){
    const list = realKakaoList(date);
    if(!list.length) return '';
    const bubble = (m,i)=>`
      <div class="kakao-msg v2-msg-in ${m.core?'is-core':(m.emotion?'is-emotion':'')} from-${escapeHtml(m.speaker)}" style="position:relative; animation-delay:${Math.min(i*70,500)}ms;">
        ${emphasize(m.text)}
        <span class="kakao-time">${escapeHtml(m.time)}</span>
      </div>`;
    const shown = list.slice(0, REAL_KAKAO_COLLAPSED);
    const rest = list.slice(REAL_KAKAO_COLLAPSED);
    return `
      <div class="section-head" style="margin-top:20px;"><div class="section-title" style="font-size:16px;">우리 카톡</div><div class="section-note">실제 대화에서 뽑은 이날의 순간들 · ${list.length}개</div></div>
      <div class="real-kakao-block" id="realKakaoBlock">
        ${shown.map(bubble).join('')}
        ${rest.length ? `<div class="real-kakao-rest" style="display:none;">${rest.map(bubble).join('')}</div>
        <button class="btn btn-sm btn-outline real-kakao-more" id="realKakaoMoreBtn">카톡 더보기 (${list.length}개)</button>` : ''}
      </div>`;
  }

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
        <div class="section-head" style="margin-top:20px;"><div class="section-title" style="font-size:16px;">하이라이트 카톡</div></div>
        <div class="kakao-block" id="kakaoBlock">
          ${ev.kakao.map(([who,text],i)=>`
            <div class="kakao-msg v2-msg-in from-${escapeHtml(who)}" data-kakao-msg="${i}" style="position:relative; animation-delay:${Math.min(i*70,500)}ms;">
              ${emphasize(text)}
              <span class="kakao-time" data-kakao-time="${i}">${escapeHtml(realTimeFor(date, who, text)||'')}</span>
              <span class="kakao-like-row" data-kakao-idx="${i}">
                <button class="kakao-like-btn" data-kakao-heart="${i}" title="저장">♡</button>
                <button class="kakao-best-btn" data-kakao-best="${i}" title="BEST" style="display:none;">★</button>
              </span>
            </div>`).join('')}
        </div>` : ''}

      <div id="realKakaoHost">${realKakaoHtml(date)}</div>

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

    // load the full archive (if not already) to backfill curated-message
    // timestamps and populate the "우리 카톡" real-message section
    function refreshRealKakao(){
      const host = panel.querySelector('#realKakaoHost');
      if(host) host.innerHTML = realKakaoHtml(date);
      wireRealKakaoMore();
      if(ev.kakao && ev.kakao.length){
        panel.querySelectorAll('#kakaoBlock [data-kakao-time]').forEach(timeEl=>{
          if(timeEl.textContent) return;
          const i = +timeEl.dataset.kakaoTime;
          if(!ev.kakao[i]) return;
          const t = realTimeFor(date, ev.kakao[i][0], ev.kakao[i][1]);
          if(t) timeEl.textContent = t;
        });
      }
    }
    function wireRealKakaoMore(){
      const btn = panel.querySelector('#realKakaoMoreBtn');
      if(!btn) return;
      btn.addEventListener('click', ()=>{
        const rest = panel.querySelector('.real-kakao-rest');
        if(rest) rest.style.display = '';
        btn.remove();
      });
    }
    wireRealKakaoMore();
    if(window.FullChat) window.FullChat.load().then(refreshRealKakao);

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
    panel.querySelector('#favBtn').addEventListener('click', async (e)=>{
      favVal = !favVal;
      await DB.setFavorite(date, favVal);
      updateFav();
      if(favVal && window.V2Anim){
        const btn = e.currentTarget;
        btn.classList.remove('v2-fav-pop'); void btn.offsetWidth; btn.classList.add('v2-fav-pop');
        V2Anim.sparkleAt(btn, 8);
      }
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
        gallery.innerHTML = dayPhotos.map((p,i)=>`
          <div class="photo-frame v2-photo-in" style="animation-delay:${Math.min(i*80,480)}ms;">
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
