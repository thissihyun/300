/* ================================================================
   HOME — hero, today dashboard, our story as a movie, by month, recent
   ================================================================ */
(function(){
  let unsub = [];
  function clearSub(){ unsub.forEach(f=>f&&f()); unsub=[]; }

  function heroPhotoFor(date, photos){
    return photos.find(p=>p.date===date && p.hero) || photos.find(p=>p.date===date);
  }

  let carouselTimer = null;
  function startCarousel(container, urls){
    clearInterval(carouselTimer);
    if(urls.length < 2) return;
    let i = 0;
    carouselTimer = setInterval(()=>{
      i = (i+1) % urls.length;
      const imgs = container.querySelectorAll('#heroPhotoWrap img');
      imgs.forEach((img,idx)=> img.classList.toggle('is-active', idx===i));
    }, 4200);
  }

  const STORY_HUB = [
    ['firsts','01','Our Firsts','처음들의 타임라인.'],
    ['constellation','02','Our Constellation','중요한 날들을 별로 이은 우리 밤하늘.'],
    ['places','03','Our New York','장소로 다시 보는 우리.'],
    ['words','04','Words That Became Ours','둘만의 단어.'],
    ['seasons','05','The Seasons We Shared','가을 뉴욕에서 여름의 300일까지.'],
    ['food','06','밥 먹자','함께 먹은 음식들.'],
    ['numbers','07','Us, By the Numbers','관계를 숫자로.'],
    ['photobooth','08','Photobooth Archive','네컷 모음.'],
    ['awards','09','Our Mini Awards','둘만의 시상식.'],
    ['favorites','10','Our Favorites ♥','즐겨찾기한 기억들.'],
    ['liked','11','Days We Both Loved','각자, 그리고 함께 좋아한 날.'],
  ];

  function onThisDay(today){
    const [, mm, dd] = today.split('-');
    return Object.entries(window.EVENTS)
      .filter(([date])=> date !== today && date.slice(5)===`${mm}-${dd}`)
      .sort((a,b)=>a[0]<b[0]?-1:1);
  }

  function render(container){
    clearSub();
    clearInterval(carouselTimer);
    const today = todayISO();
    const pastOnThisDay = onThisDay(today);
    container.innerHTML = `
      <section class="hero">
        <div>
          <div class="hero-eyebrow v2-reveal">SIHYUN &amp; GANGWON · OUR DIGITAL MEMORY ARCHIVE</div>
          <h1 class="hero-title v2-reveal">300 DAYS<br>WITH YOU</h1>
          <div class="hero-sub v2-reveal" id="homeQuote">New York, 2025 — and somehow, we met here.</div>
          <div class="day-counter v2-reveal"><span id="dayCounterNum">0</span><span class="day-counter-lbl">DAYS TOGETHER</span></div>
          <div class="hero-actions v2-reveal">
            <button class="btn" data-action="view" data-target="ourdays">OPEN OUR DAYS</button>
            <button class="btn btn-outline" data-action="memory" data-date="2025-10-01">START FROM THE BEGINNING → 2025-10-01</button>
            <button class="btn btn-outline" data-action="memory" data-date="2025-10-23">GO TO DAY 1 → 2025-10-23</button>
            <button class="btn btn-outline" id="randomMemoryBtn">🎲 RANDOM MEMORY</button>
          </div>
        </div>
        <div class="hero-photo v2-reveal" id="heroPhotoWrap"><div class="empty-frame" style="height:100%;display:flex;align-items:center;justify-content:center;">▣<br>EMPTY FRAME</div></div>
      </section>

      <section class="section dash v2-reveal">
        <div class="section-head">
          <div>
            <div class="eyebrow">TODAY · DAILY US</div>
            <div class="section-title">${fmtDate(today)} · DAY ${dayNumber(today)}</div>
          </div>
        </div>
        <div id="gratReminder"></div>
        <div class="checkin-row" id="checkinPills"></div>
        <div class="progress-bar"><div class="progress-fill" id="dashProgressFill" style="width:0%"></div></div>
        <div class="section-note" id="dashProgressText">오늘 우리 0 / 6 완료</div>
        <div style="margin-top:12px;"><button class="btn btn-sm" data-action="view" data-target="diary">Continue today →</button></div>
      </section>

      ${pastOnThisDay.length ? `
      <section class="section v2-reveal">
        <div class="section-head"><div class="section-title">ON THIS DAY</div><div class="section-note">${today.slice(5).replace('-','.')}, 다른 해에는.</div></div>
        <div class="grid grid-3">${pastOnThisDay.map(([d,ev])=>`
          <button class="card card-btn hub-card" data-action="memory" data-date="${d}">
            <div class="n">${d.slice(0,4)}</div><div class="t">${escapeHtml(ev.title)}</div><div class="s">${d}</div>
          </button>`).join('')}</div>
      </section>` : ''}

      <section class="section v2-reveal">
        <div class="section-head">
          <div class="section-title">OUR STORY, AS A MOVIE</div>
          <button class="btn btn-sm btn-outline" data-action="view" data-target="ourstory">See the full story →</button>
        </div>
        <div class="filmstrip" id="movieStrip"></div>
      </section>

      <section class="section v2-reveal">
        <div class="section-head"><div class="section-title">ENTER OUR STORY</div><div class="section-note">한눈에 보는 우리 아카이브.</div></div>
        <div class="grid grid-3">${STORY_HUB.map(([key,n,t,s])=>`
          <button class="card card-btn hub-card" data-action="special" data-target="${key}">
            <div class="n">${n}</div><div class="t">${escapeHtml(t)}</div><div class="s">${escapeHtml(s)}</div>
          </button>`).join('')}</div>
      </section>

      <section class="section v2-reveal">
        <div class="section-head"><div class="section-title">BY MONTH</div></div>
        <div class="grid grid-3" id="monthBoard"></div>
      </section>

      <section class="section v2-reveal">
        <div class="section-head"><div class="section-title">RECENT FROM US</div></div>
        <div id="recentActivity"><div class="empty-frame">아직 새 활동이 없어요.</div></div>
      </section>
    `;

    container.querySelector('#randomMemoryBtn').addEventListener('click', ()=>{
      const dates = Object.keys(window.EVENTS);
      if(!dates.length) return;
      Router.openMemory(dates[Math.floor(Math.random()*dates.length)]);
    });

    const quoteEl = container.querySelector('#homeQuote');
    if(quoteEl && window.HOME_QUOTES && window.HOME_QUOTES.length){
      quoteEl.textContent = window.HOME_QUOTES[Math.floor(Math.random()*window.HOME_QUOTES.length)];
    }

    // entrance sequence: fade/slide the hero stack + sections in with a stagger
    if(window.V2Anim) V2Anim.staggerIn(container.querySelectorAll('.v2-reveal'), 90);

    // DAY counter count-up
    const dayCounterEl = container.querySelector('#dayCounterNum');
    if(dayCounterEl && window.V2Anim) V2Anim.countUp(dayCounterEl, dayNumber(today), {duration:1100});

    container.querySelector('#movieStrip').innerHTML = window.MOVIE_CHAPTERS.map(c=>`
      <button class="card card-btn" data-action="memory" data-date="${c.date}">
        <div class="film-photo"><div class="empty-frame" style="height:100%;display:flex;align-items:center;justify-content:center;">▣</div></div>
        <div class="film-n">${c.n}</div>
        <div class="film-title">${escapeHtml(c.title)}</div>
        <div class="film-sub">${escapeHtml(c.sub)}</div>
      </button>
    `).join('');

    container.querySelector('#monthBoard').innerHTML = window.MONTH_BOARD.map(m=>`
      <button class="card card-btn hub-card" data-action="memory" data-date="${m.date}">
        <div class="n">${escapeHtml(m.label)}</div>
        <div class="t">${escapeHtml(m.title)}</div>
        <div class="s">${escapeHtml(m.sub)}</div>
      </button>
    `).join('');

    // live: photos (hero carousel — cycles through a few hero-worthy shots instead of one static frame)
    unsub.push(DB.onAllPhotos(photos=>{
      const wrap = container.querySelector('#heroPhotoWrap');
      if(wrap){
        const candidates = [];
        window.MOVIE_CHAPTERS.forEach(c=>{ const p = heroPhotoFor(c.date, photos); if(p && !candidates.some(x=>x.url===p.url)) candidates.push(p); });
        photos.filter(p=>p.hero).forEach(p=>{ if(!candidates.some(x=>x.url===p.url)) candidates.push(p); });
        const urls = candidates.slice(0,5).map(p=>p.url);
        if(urls.length){
          wrap.innerHTML = urls.map((u,i)=>`<img src="${u}" alt="" class="${i===0?'is-active':''}">`).join('');
          startCarousel(container, urls);
        }
      }
      container.querySelectorAll('#movieStrip .film-photo').forEach((el,i)=>{
        const c = window.MOVIE_CHAPTERS[i];
        const p = heroPhotoFor(c.date, photos);
        if(p) el.innerHTML = `<img src="${p.url}" alt="">`;
      });
    }));

    // live: today dashboard
    const KIND_LABEL = {record:'OUR DAY', gratitude:'THANK YOU', answer:'QUESTION'};
    let rec=[], grat=[], ans=[];
    function refreshDash(){
      const cells = {
        record: rec.map(r=>r.user), gratitude: grat.map(g=>g.from), answer: ans.map(a=>a.user)
      };
      let done=0;
      const pillsHost = container.querySelector('#checkinPills');
      const pillsHtml = ['sihyun','gangwon'].map(uid=>{
        const name = Identity.displayName(uid);
        const stats = ['record','gratitude','answer'].map(kind=>{
          const ok = cells[kind].includes(name);
          if(ok) done++;
          return `<span class="checkin-stat ${ok?'is-done':''}"><span class="checkin-dot"></span>${KIND_LABEL[kind]}</span>`;
        }).join('');
        return `<div class="checkin-pill"><div class="checkin-name">${escapeHtml(name)}</div><div class="checkin-stats">${stats}</div></div>`;
      }).join('');
      if(pillsHost) pillsHost.innerHTML = pillsHtml;

      const pct = Math.round(done/6*100);
      const fill = document.getElementById('dashProgressFill');
      const txt = document.getElementById('dashProgressText');
      if(fill) fill.style.width = pct+'%';
      if(txt) txt.textContent = `오늘 우리 ${done} / 6 완료`;

      const gratHost = container.querySelector('#gratReminder');
      if(gratHost){
        const myUid = Identity.current();
        const myName = myUid ? Identity.displayName(myUid) : '';
        const iWroteGratitude = myName && cells.gratitude.includes(myName);
        gratHost.innerHTML = (myUid && !iWroteGratitude)
          ? `<div class="grat-reminder"><span>오늘 ${escapeHtml(myName)}의 고마운 순간을 아직 안 남겼어요.</span><button class="btn btn-sm" data-action="view" data-target="diary">지금 남기기 →</button></div>`
          : '';
      }
    }
    unsub.push(DB.onDailyRecordsForDate(today, rows=>{ rec=rows; refreshDash(); }));
    unsub.push(DB.onGratitudeForDate(today, rows=>{ grat=rows; refreshDash(); }));
    unsub.push(DB.onAnswersForDate(today, rows=>{ ans=rows; refreshDash(); }));

    // live: recent activity
    unsub.push(DB.onActivity(rows=>{
      const host = container.querySelector('#recentActivity');
      if(!rows.length){ host.innerHTML = '<div class="empty-frame">아직 새 활동이 없어요.</div>'; return; }
      host.innerHTML = rows.slice(0,8).map(r=>`
        <div class="list-row">
          <div><span class="notif-author">${escapeHtml(r.author||'')}</span> · ${escapeHtml(r.type||'')}<br>
          <span class="section-note">${escapeHtml(r.date||'')} · ${escapeHtml(r.text||'')}</span></div>
          ${r.date ? `<button class="btn btn-sm btn-outline" data-action="memory" data-date="${r.date}">열기</button>` : ''}
        </div>`).join('');
    }));
  }

  Router.registerView('home', {render});
})();
