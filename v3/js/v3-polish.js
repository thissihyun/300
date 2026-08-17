/* 300 Days With You — production polish and content consolidation */
(function(){
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>window.escapeHtml?escapeHtml(s):String(s==null?'':s);
  const me=()=>{try{return Identity.displayName(Identity.current())}catch(e){return ''}};
  const rawDb=()=>{try{return window.firebase&&firebase.firestore?firebase.firestore():null}catch(e){return null}};

  /* ------------------------------------------------------------------
     PRODUCT COPY / SHELL
     ------------------------------------------------------------------ */
  function cleanProductCopy(root=document){
    document.title='시현 & 강원 · 300 DAYS WITH YOU';
    const lockSub=$('#lockScreen .lock-sub'); if(lockSub) lockSub.textContent='300 Days With You · from New York to us';
    const brandTag=$('.brand-tag'); if(brandTag) brandTag.textContent='300 Days With You';
    $$('.v3-home-stamp',root).forEach(x=>x.remove());
    $$('.v3-album-k',root).forEach(x=>x.textContent='OUR DIGITAL PHOTOBOOK');
    $$('[data-v3-album-mode="filmstrip"]',root).forEach(x=>x.textContent='FILM STRIP');
    $$('[data-v3-album-mode="filmviewer"]',root).forEach(x=>x.textContent='FILM VIEWER');
    $$('.v3-promise-note b',root).forEach(x=>x.textContent='OUR SMALL PROMISES');
    $$('.v3-archive-kicker',root).forEach(x=>{if(x.textContent.trim()==='V2 QUICK NAVIGATION')x.textContent='QUICK NAVIGATION'});
    $$('.v3-archive-panel .section-note',root).forEach(x=>{
      if(x.textContent.includes('V1의 Today Hub')||x.textContent.includes('V2의 실시간')) x.textContent='오늘의 기록 상태를 한곳에서 확인해요.';
    });
  }

  function installTopMetrics(){
    const left=$('#v3TogetherMetric'), right=$('#v3ReunionMetric'), divider=$('.thread-divider');
    if(!left||!right||!divider||$('.v3-top-metrics'))return;
    const row=document.createElement('div'); row.className='v3-top-metrics';
    divider.parentNode.insertBefore(row,divider);
    row.append(left,right);
  }

  function polishHeroPlaceholder(){
    const empty=$('#view-home #heroPhotoWrap .empty-frame');
    if(!empty)return;
    empty.className='v3-hero-empty';
    empty.innerHTML='사진을 추가하면<br>우리의 대표 사진이 이곳에 보여요.';
  }

  function homeMovieV1(){
    const strip=$('#view-home #movieStrip');
    if(!strip||strip.dataset.polished==='1')return;
    strip.dataset.polished='1';
    const chapters=(window.MOVIE_CHAPTERS||[]).slice(0,7);
    strip.className='v3-home-movie-v1';
    strip.innerHTML=chapters.map(c=>`<button class="v3-home-movie-row" data-action="memory" data-date="${esc(c.date)}">
      <span class="num">${esc(c.n||'')}</span><span><b>${esc(c.title||'')}</b><small>${esc(c.sub||'')}</small></span><span class="arrow">→</span>
    </button>`).join('');
  }

  function albumSyncNote(){
    const view=$('#view-album'); if(!view||$('.v3-photo-sync-note',view))return;
    const filter=$('.v3-album-filterbar',view);
    if(filter) filter.insertAdjacentHTML('beforebegin','<div class="v3-photo-sync-note">이 앨범에 업로드한 사진은 Firebase에 저장되어 같은 링크를 여는 시현·강원에게 함께 보여요. 이 기기에만 저장되는 사진첩이 아닙니다.</div>');
  }

  function addStreakHelp(){
    const candidates=$$('.stats-card,.v3-stat-card,.v12-viz-card');
    candidates.forEach(card=>{
      const t=card.textContent||'';
      if(!/RECORDING STREAK/i.test(t)||$('.v3-streak-help',card))return;
      card.insertAdjacentHTML('beforeend','<div class="v3-streak-help"><b>0 days는?</b> OUR DAY에서 하루 기록을 저장하면 1 day가 되고, 다음 날도 이어서 기록하면 2 · 3 · 4 days로 올라가요. 시현과 강원은 각자 자신의 계정으로 기록해야 각자의 streak가 채워집니다.</div>');
    });
  }

  /* ------------------------------------------------------------------
     OUR STORY — restore V1 reading-column design
     ------------------------------------------------------------------ */
  function renderStoryV1(container){
    const by={};
    Object.entries(window.EVENTS||{}).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([d,e])=>{(by[e.chapter]=by[e.chapter]||[]).push([d,e])});
    const order=(window.CHAPTER_ORDER||Object.keys(by)).filter(k=>by[k]);
    container.innerHTML=`<div class="v3-story-shell">
      <div class="v3-story-intro"><h1>OUR STORY, AS A MOVIE</h1><p>챕터 순서대로 이어지는 우리의 이야기. 날짜를 누르면 그날의 사진, 카톡, 기록으로 들어가요.</p></div>
      ${order.map(ch=>`<section class="v3-story-chapter"><div class="v3-story-chapter-head"><h3>${esc(ch)}</h3></div><div class="v3-story-list">${by[ch].map(([d,e])=>`<button class="v3-story-row" data-action="memory" data-date="${d}"><span class="v3-story-date">${d.slice(5).replace('-','.')}</span><span><span class="v3-story-title">${esc(e.title)}</span><span class="v3-story-copy">${esc(e.story||'')}</span></span></button>`).join('')}</div></section>`).join('')}
    </div>`;
  }
  Router.registerView('ourstory',{render:renderStoryV1});

  /* ------------------------------------------------------------------
     SPECIAL HUB — remove duplicates, lower utility/archive modules
     ------------------------------------------------------------------ */
  const SPECIAL_PRIMARY=[
    {key:'firsts',n:'01',t:'OUR FIRSTS',s:'처음들의 타임라인.'},
    {key:'constellation',n:'02',t:'OUR CONSTELLATION',s:'중요한 날들을 별로 이은 우리 밤하늘.'},
    {key:'liveagain',n:'03',t:"THE DATES I'D LIVE AGAIN",s:'다시 살고 싶은 날들.'},
    {key:'places',n:'04',t:'OUR NEW YORK',s:'장소로 다시 보는 우리.'},
    {key:'words',n:'05',t:'WORDS THAT BECAME OURS',s:'둘만의 단어와 말버릇.'},
    {key:'seasons',n:'06',t:'THE SEASONS WE SHARED',s:'사계절마다 달랐던 우리의 장면.'},
    {key:'thankyoujar',n:'07',t:'OUR THANK-YOU JAR',s:'실제 카톡과 우리가 남긴 감사를 한곳에.'},
    {key:'pulse',n:'08',t:'RELATIONSHIP PULSE',s:'월별 애정과 긴장의 흐름.'},
  ];
  const SPECIAL_MORE=[
    {key:'food',t:'OUR LOVE LANGUAGE WAS “밥 먹자”',s:'함께 먹은 것과 앞으로 채울 맛집.'},
    {key:'photobooth',t:'PHOTOBOOTH ARCHIVE',s:'네컷 모음.'},
    {key:'numbers',t:'US, BY THE NUMBERS',s:'숫자와 그래프로 보는 우리.'},
    {key:'favorites',t:'OUR FAVORITES ♥',s:'즐겨찾기한 기억들.'},
    {key:'liked',t:'DAYS WE BOTH LOVED',s:'둘이 좋아한 날들.'},
    {key:'awards',t:'OUR MINI AWARDS',s:'둘만의 시상식.'},
    {key:'stats',t:'OUR STATS',s:'기록 streak · 감정 · 활동 통계.'},
    {key:'likedkakao',t:'LIKED KAKAO MESSAGES',s:'저장해둔 카톡 한 줄들.'},
  ];
  const SPECIAL_TOOLS=[{key:'kakao',t:'KAKAO IMPORT',s:'새 카톡 내보내기로 통계를 갱신.'}];
  window.SPECIAL_HUB=SPECIAL_PRIMARY.concat(SPECIAL_MORE,SPECIAL_TOOLS);

  function subHeader(title,sub){
    return `<button class="btn btn-sm btn-outline" data-action="special-back">← SPECIAL</button><div class="section-head" style="margin-top:14px"><div class="section-title">${esc(title)}</div>${sub?`<div class="section-note">${esc(sub)}</div>`:''}</div>`;
  }
  function specialCard(x,i,secondary){
    return `<button class="card card-btn v3-special-card ${secondary?'v3-special-secondary-card':''}" data-action="special" data-target="${x.key}">${secondary?'':`<div class="n">${x.n||String(i+1).padStart(2,'0')}</div>`}<div class="t">${esc(x.t)}</div><div class="s">${esc(x.s||'')}</div></button>`;
  }
  function renderSpecialHub(){
    const hub=$('#specialHub'), detail=$('#specialDetailHost'); if(!hub)return;
    if(detail)detail.style.display='none'; hub.style.display='';
    hub.innerHTML=`<div class="v3-special-hero"><h1>SPECIAL FEATURES</h1><p>우리 관계를 다른 방식으로 다시 꺼내보는 작은 아카이브.</p></div>
      <section class="v3-special-group"><div class="v3-special-group-title">OUR STORY COLLECTION</div><div class="v3-special-grid">${SPECIAL_PRIMARY.map((x,i)=>specialCard(x,i,false)).join('')}</div></section>
      <section class="v3-special-group v3-special-secondary"><div class="v3-special-group-title">MORE OF OUR ARCHIVE</div><div class="v3-special-grid">${SPECIAL_MORE.map((x,i)=>specialCard(x,i,true)).join('')}</div></section>
      <section class="v3-special-group"><div class="v3-special-group-title">TOOLS</div><div class="v3-special-tools">${SPECIAL_TOOLS.map(x=>`<button class="btn btn-sm btn-outline" data-action="special" data-target="${x.key}">${esc(x.t)}</button>`).join('')}</div></section>`;
  }
  Router.registerView('special',{render:renderSpecialHub});

  /* ------------------------------------------------------------------
     OUR NEW YORK — markers only, no connecting line
     ------------------------------------------------------------------ */
  Router.registerSpecial('places',{render(host){
    host.innerHTML=subHeader('OUR NEW YORK','A city full of places, somehow becoming full of us.')+'<div class="v3-map-note">장소끼리 선으로 연결하지 않고, 실제로 우리에게 의미 있던 지점만 남겼어요.</div><div id="v3PlainMap" class="v3-plain-map"></div><div class="section-head" style="margin-top:24px"><div class="section-title" style="font-size:17px">CITIES WE SHARED</div></div><div class="grid grid-3">'+(window.CITIES||[]).map(c=>c.date?`<button class="card card-btn hub-card" data-action="memory" data-date="${c.date}"><div class="t">${c.icon} ${esc(c.name)}</div><div class="s">${c.date}</div></button>`:`<div class="card hub-card" style="opacity:.62"><div class="t">${c.icon} ${esc(c.name)}</div><div class="s">아직 못 가본 곳</div></div>`).join('')+'</div>';
    const el=$('#v3PlainMap',host);
    if(!window.L||!el){el.innerHTML='<div class="empty-frame">지도를 불러오지 못했어요.</div>';return}
    const map=L.map(el,{scrollWheelZoom:false}).setView([40.745,-73.98],12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap',maxZoom:18}).addTo(map);
    (window.PLACES||[]).forEach(p=>{
      const marker=L.marker([p.lat,p.lng]).addTo(map), latest=(p.dates||[]).slice(-1)[0];
      marker.bindPopup(`<div style="font-family:var(--serif);text-align:center"><b>${esc(p.name)}</b><div style="font-size:10px;margin:4px 0 7px">${(p.dates||[]).join(' · ')}</div><button class="v3-map-open" style="border:1px solid #d9cdb0;background:#fbf6ea;border-radius:999px;padding:5px 10px">기억 열기</button></div>`);
      marker.on('popupopen',e=>{const b=e.popup.getElement()?.querySelector('.v3-map-open');if(b&&latest)b.onclick=()=>Router.openMemory(latest)});
    });
  }});

  /* ------------------------------------------------------------------
     SEASONS — distinct visual language for each season
     ------------------------------------------------------------------ */
  Router.registerSpecial('seasons',{render(host){
    const entries=Object.entries(window.EVENTS||{}).sort((a,b)=>a[0].localeCompare(b[0]));
    host.innerHTML=subHeader('THE SEASONS WE SHARED')+`<div class="v3-season-stack">${(window.SEASONS||[]).map(s=>{
      const matches=entries.filter(([d])=>s.months.includes(+d.slice(5,7)));
      return `<section class="v3-season-card ${s.key}"><div class="v3-season-title">${s.icon} ${esc(s.label)}</div><div class="v3-season-quote">${esc(s.quote)}</div><div class="v3-season-events">${matches.map(([d,e])=>`<button class="v3-season-event" data-action="memory" data-date="${d}"><b>${esc(e.title)}</b><span>${d}</span></button>`).join('')||'<div class="empty-frame">기록 없음</div>'}</div></section>`;
    }).join('')}</div>`;
  }});

  /* ------------------------------------------------------------------
     FOOD — V1 seeds + photo metadata + user additions
     ------------------------------------------------------------------ */
  const FOOD_SEEDS=[
    {icon:'🍱',food:'첫 학식',place:'NYU',date:'2025-10-01'},
    {icon:'🍲',food:'Hotpot — 강원 생일',place:'New York',date:'2025-12-08'},
    {icon:'🍜',food:'Raku — DAY 50',place:'New York',date:'2025-12-11'},
    {icon:'🍦',food:'Oak Berry — 첫눈',place:'New York',date:'2025-12-14'},
    {icon:'🍳',food:'Eggslut',place:'LA',date:''},
    {icon:'🍚',food:'국밥 — 첫 부모님 만남',place:'수원',date:'2026-01-04'},
    {icon:'🍢',food:'즉석떡볶이 + 붕어빵',place:'한국',date:'2026-01-17'},
    {icon:'🥘',food:'국밥 데이트',place:'부산/수원',date:'2026-03-16'},
    {icon:'🥪',food:'부산역 샌드위치',place:'부산',date:'2026-03-22'},
  ];
  function foodKey(x){return [x.date||'',x.food||'',x.place||''].join('|').toLowerCase()}
  Router.registerSpecial('food',{render(host){
    host.innerHTML=subHeader('OUR LOVE LANGUAGE WAS “밥 먹자”')+`<div class="v3-food-head"><div class="v3-food-note"><h2>It started with lunch.</h2><p>첫 학식부터 생일 Hotpot, Raku, 국밥, 즉떡까지. 사진에 음식 태그를 달면 이곳에도 자동으로 모이고, 기억나는 메뉴와 맛집은 직접 더할 수 있어요.</p></div><div class="v3-food-add"><div class="v3-food-form"><input class="field" id="v3FoodName" placeholder="메뉴 / 맛집"><input class="field" id="v3FoodPlace" placeholder="장소"><input class="field" type="date" id="v3FoodDate"><button class="btn btn-sm" id="v3FoodAdd">추가</button></div></div></div><div id="v3FoodGrid" class="v3-food-grid"></div>`;
    let photos=[],custom=[]; const db=rawDb();
    const draw=()=>{
      if(!host.isConnected)return;
      const fromPhotos=photos.filter(p=>p.food).map(p=>({icon:'🍽',food:p.food,place:p.place||'',date:p.date,source:'PHOTO TAG'}));
      const all=[],seen=new Set();
      FOOD_SEEDS.concat(fromPhotos,custom.map(x=>({...x,icon:'🍴',source:'ADDED'}))).forEach(x=>{const k=foodKey(x);if(!seen.has(k)){seen.add(k);all.push(x)}});
      const grid=$('#v3FoodGrid',host); if(!grid)return;
      grid.innerHTML=all.map(x=>{const inner=`${x.source?`<span class="source">${esc(x.source)}</span>`:''}<div class="icon">${x.icon||'🍽'}</div><h3>${esc(x.food)}</h3><div class="meta">${esc(x.place||'')}${x.date?` · ${x.date}`:''}</div>${x.id?`<button class="v3-food-delete" data-food-del="${x.id}">삭제</button>`:''}`;return x.date?`<button class="v3-food-card" data-action="memory" data-date="${x.date}">${inner}</button>`:`<div class="v3-food-card">${inner}</div>`}).join('');
      $$('[data-food-del]',grid).forEach(b=>b.addEventListener('click',async e=>{e.stopPropagation();if(db)await db.collection('foodMemories').doc(b.dataset.foodDel).delete()}));
    };
    let offPhotos=DB.onAllPhotos(r=>{photos=r||[];draw()});
    let offCustom=null;
    if(db) offCustom=db.collection('foodMemories').orderBy('createdAt','desc').onSnapshot(s=>{custom=s.docs.map(d=>({id:d.id,...d.data()}));draw()},()=>draw());
    $('#v3FoodAdd',host)?.addEventListener('click',async()=>{
      const food=$('#v3FoodName',host).value.trim(),place=$('#v3FoodPlace',host).value.trim(),date=$('#v3FoodDate',host).value;
      if(!food){Router.toast('메뉴나 맛집 이름을 적어주세요');return}
      if(!db){Router.toast('Firebase 연결이 필요해요');return}
      await db.collection('foodMemories').add({food,place,date,author:me(),createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      $('#v3FoodName',host).value='';$('#v3FoodPlace',host).value='';$('#v3FoodDate',host).value='';Router.toast('먹은 기억을 추가했어요');
    });
    const stopWhenGone=setInterval(()=>{if(!host.isConnected){clearInterval(stopWhenGone);try{offPhotos&&offPhotos()}catch(e){}try{offCustom&&offCustom()}catch(e){}}},1500);
  }});

  /* ------------------------------------------------------------------
     NUMBERS — V1-style statistics and Relationship Pulse together
     ------------------------------------------------------------------ */
  function pulseSvg(rows){
    const W=760,H=300,P=36,max=Math.max(1,...rows.flatMap(r=>[r[1],r[2]]))*1.12,step=rows.length>1?(W-P*2)/(rows.length-1):0;
    const pt=(i,v)=>[P+i*step,H-P-(v/max)*(H-P*2)];
    const path=idx=>rows.map((r,i)=>{const [x,y]=pt(i,r[idx]);return `${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`}).join(' ');
    const dots=(idx,color)=>rows.map((r,i)=>{const[x,y]=pt(i,r[idx]);return `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`}).join('');
    const labels=rows.map((r,i)=>{const[x]=pt(i,0);return `<text x="${x}" y="${H-9}" text-anchor="middle" font-size="9" fill="#6b5f4f">${esc(String(r[0]).slice(2))}</text>`}).join('');
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block"><path d="${path(1)}" fill="none" stroke="#a5372c" stroke-width="2.4"/>${dots(1,'#a5372c')}<path d="${path(2)}" fill="none" stroke="#3f5a72" stroke-width="2"/>${dots(2,'#3f5a72')}${labels}</svg>`;
  }
  Router.registerSpecial('numbers',{render(host){
    let live=null,off=null;
    const draw=()=>{
      const stats=live||window.BASELINE_STATS,words=stats.words||{},total=stats.total||0;
      const tiles=[[dayNumber(todayISO()),'days together'],[Object.keys(window.EVENTS||{}).length,'recorded days'],[(window.FIRSTS||[]).length,'firsts'],[total,'kakao messages'],[words['사랑해']||0,'“사랑해”'],[words['고마워']||0,'“고마워”']];
      const wordRows=['사랑해','보고싶어','고마워','여보','아가'].map(k=>[k,words[k]||0]);const maxWord=Math.max(1,...wordRows.map(x=>x[1]));
      host.innerHTML=subHeader('US, BY THE NUMBERS')+`<div class="v3-numbers-hero"><h2>Our relationship, in numbers.</h2><div class="section-note">${esc(stats.asOf||'')} 기준 실제 카톡/기록 데이터</div></div><div class="v3-number-grid">${tiles.map(([v,l])=>`<div class="v3-number-tile"><div class="v">${Number(v).toLocaleString()}</div><div class="l">${esc(l)}</div></div>`).join('')}</div><div class="v3-number-chart"><div class="section-title" style="font-size:18px">RELATIONSHIP PULSE</div><div class="v3-chart-legend"><span class="love">● 애정 표현</span><span class="tension">● 긴장 표현</span><span class="section-note">1,000 messages 당 빈도</span></div>${pulseSvg(window.PULSE_BASELINE||[])}<div class="v3-word-bars">${wordRows.map(([k,n])=>`<div class="v3-word-bar"><span>${esc(k)}</span><div class="v3-word-track"><div class="v3-word-fill" style="width:${n/maxWord*100}%"></div></div><b>${n}</b></div>`).join('')}</div><div style="margin-top:14px"><button class="btn btn-sm btn-outline" data-action="special" data-target="kakao">최신 카톡 통계로 갱신 →</button></div></div>`;
    };
    draw(); if(DB.onKakaoStats)off=DB.onKakaoStats(d=>{live=d||null;draw()});
    const stop=setInterval(()=>{if(!host.isConnected){clearInterval(stop);try{off&&off()}catch(e){}}},1500);
  }});

  /* ------------------------------------------------------------------
     MINI AWARDS — V1 card/plaque design, V2 voting preserved
     ------------------------------------------------------------------ */
  Router.registerSpecial('awards',{render(host){
    const ny=window.MOST_NY_DAY;
    host.innerHTML=subHeader('OUR MINI AWARDS','진짜 기록에서 뽑은 우리만의 시상식.')+`<div class="v3-awards-grid">${(window.AWARDS||[]).map(a=>`<div class="v3-award-card" data-award-card="${a.id}"><div class="v3-award-trophy">${a.trophy}</div><div class="v3-award-title">${esc(a.title)}</div><button class="v3-award-winner" style="border:0;background:none" data-action="memory" data-date="${a.date}">${esc((window.EVENTS[a.date]||{}).title||a.date)}</button><div class="v3-award-date">${a.date}</div><div class="v3-award-agree" data-award-agree="${a.id}"><button class="btn btn-sm btn-outline" data-award-vote="${a.id}">나도 동의해</button></div></div>`).join('')}</div><button class="v3-most-ny" data-action="memory" data-date="${ny.date}"><div class="stamp">THE MOST NEW YORK DAY</div><p>${ny.date} · ${esc(ny.note)}</p></button>`;
    $$('[data-award-vote]',host).forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();DB.setAwardVote(b.dataset.awardVote,me(),'agree')}));
    let off=DB.onAwardVotes(rows=>{(window.AWARDS||[]).forEach(a=>{const users=rows.filter(r=>r.awardId===a.id&&r.candidate==='agree').map(r=>r.user),el=$(`[data-award-agree="${a.id}"]`,host);if(!el)return;const both=users.includes(Identity.displayName('sihyun'))&&users.includes(Identity.displayName('gangwon'));el.innerHTML=both?'<span class="section-note">💛 둘 다 동의했어요</span>':`<button class="btn btn-sm btn-outline" data-award-vote="${a.id}">나도 동의해${users.length?` · ${users.join(', ')}`:''}</button>`;const b=$('[data-award-vote]',el);if(b)b.onclick=e=>{e.stopPropagation();DB.setAwardVote(a.id,me(),'agree')}})});
    const stop=setInterval(()=>{if(!host.isConnected){clearInterval(stop);try{off&&off()}catch(e){}}},1500);
  }});

  /* ------------------------------------------------------------------
     THANK-YOU JAR — merge former 15/18, classify actual Kakao by situation
     ------------------------------------------------------------------ */
  const THANK_CATS=[
    ['care','배려와 돌봄',/기다|데려|챙겨|와줘|와 줘|도와|수고|고생|걱정|약|아프|조심|태워|마중/i],
    ['together','함께 있어줘서',/같이|함께|만나|보러|와서|시간|놀아|여행|걸어|데이트/i],
    ['support','응원과 힘',/공부|시험|과제|응원|힘내|믿어|축하|합격|수업|일/i],
    ['food','먹는 행복',/밥|먹|맛있|요리|사줘|사 줘|카페|커피|국밥|라쿠|raku|hotpot/i],
    ['gift','선물과 기억',/선물|꽃|사진|편지|티켓|사다|사와|준비/i],
    ['understand','이해와 화해',/이해|들어줘|들어 줘|미안|대화|말해|솔직|기다려줘/i],
    ['love','사랑을 표현해줘서',/사랑|좋아|행복|보고싶|보고 싶|예쁘|귀엽|다정/i],
    ['little','작은 고마움',/.*/],
  ];
  function thankCat(text){for(const [k,l,re] of THANK_CATS){if(re.test(text||''))return[k,l]}return['little','작은 고마움']}
  function renderThankJar(host){
    host.innerHTML=subHeader('OUR THANK-YOU JAR','실제 카톡의 고마움과 우리가 매일 직접 남긴 감사를 한곳에서 봐요.')+`<div class="v3-thank-hero"><div class="v3-thank-copy"><h2>So many little thank-yous.</h2><p>예전 화면에서 나뉘어 있던 ‘300 DAYS OF 고마워’와 ‘카톡 속 고마워’를 하나로 합쳤어요. 실제 카톡은 상황별로 자동 분류하고, Daily Gratitude는 별도 탭에서 그대로 보존합니다.</p></div><div class="v3-thank-jar"><div class="count" id="v3ThankCount">${(window.BASELINE_STATS?.words?.['고마워']||0).toLocaleString()}</div><div class="section-note">“고마워” baseline</div><div class="flowers">🌷 🌷 🌷 🌷</div></div></div><div class="v3-thank-tabs"><button class="is-active" data-thank-mode="kakao">실제 카톡</button><button data-thank-mode="daily">DAILY GRATITUDE</button></div><input class="field" id="v3ThankSearch" placeholder="고마운 순간 검색…" style="margin-bottom:10px"><div id="v3ThankCats"></div><div id="v3ThankResults" class="v3-thank-results"><div class="empty-frame">불러오는 중…</div></div>`;
    let mode='kakao',cat='all',q='',kakao=[],daily=[];
    const catLabel=k=>THANK_CATS.find(x=>x[0]===k)?.[1]||k;
    const draw=()=>{
      if(!host.isConnected)return;
      let rows=mode==='kakao'?kakao:daily;
      const count=$('#v3ThankCount',host);if(count)count.textContent=rows.length.toLocaleString();
      if(q)rows=rows.filter(r=>[r.text,r.speaker,r.from,r.date].join(' ').toLowerCase().includes(q.toLowerCase()));
      if(cat!=='all')rows=rows.filter(r=>thankCat(r.text)[0]===cat);
      const cats={};(mode==='kakao'?kakao:daily).forEach(r=>{const k=thankCat(r.text)[0];cats[k]=(cats[k]||0)+1});
      const catHost=$('#v3ThankCats',host);if(catHost)catHost.innerHTML=`<div class="v3-thank-category-summary">${THANK_CATS.filter(x=>x[0]!=='little'||cats.little).map(([k,l])=>`<button data-thank-cat="${k}"><b>${cats[k]||0}</b><span>${esc(l)}</span></button>`).join('')}</div><div class="v3-thank-cats"><button data-thank-cat="all" class="${cat==='all'?'is-active':''}">전체</button>${THANK_CATS.map(([k,l])=>`<button data-thank-cat="${k}" class="${cat===k?'is-active':''}">${esc(l)}</button>`).join('')}</div>`;
      $$('[data-thank-cat]',catHost||document).forEach(b=>b.addEventListener('click',()=>{cat=b.dataset.thankCat;draw()}));
      const out=$('#v3ThankResults',host);if(!out)return;
      const shown=rows.slice(0,180);
      out.innerHTML=shown.length?shown.map(r=>`<button class="v3-thank-item" data-action="memory" data-date="${r.date}"><div class="meta">${esc(r.date||'')} · ${esc(r.speaker||r.from||'')} · ${esc(thankCat(r.text)[1])}</div><div class="text">${esc(r.text||'')}</div></button>`).join(''):'<div class="empty-frame">조건에 맞는 감사 기록이 없어요.</div>';
      if(rows.length>shown.length)out.insertAdjacentHTML('beforeend',`<div class="section-note">+ ${rows.length-shown.length}개 더 있어요. 검색이나 상황 필터로 좁혀보세요.</div>`);
    };
    $$('[data-thank-mode]',host).forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.thankMode;cat='all';$$('[data-thank-mode]',host).forEach(x=>x.classList.toggle('is-active',x===b));draw()}));
    $('#v3ThankSearch',host).addEventListener('input',e=>{q=e.target.value.trim();draw()});
    let off=DB.onAllGratitude(rows=>{daily=(rows||[]).filter(r=>r.text&&r.text.trim()).sort((a,b)=>(b.date||'').localeCompare(a.date||''));draw()});
    if(window.FullChat)FullChat.load().then(()=>{kakao=FullChat.allMessages().filter(m=>/고마워|감사/.test(m.text||'')).sort((a,b)=>b.date.localeCompare(a.date));draw()});
    const stop=setInterval(()=>{if(!host.isConnected){clearInterval(stop);try{off&&off()}catch(e){}}},1500);
  }
  const thankImpl={render:renderThankJar};
  Router.registerSpecial('thankyoujar',thankImpl);
  Router.registerSpecial('thanksarchive',thankImpl);
  Router.registerSpecial('thankskakao',thankImpl);

  /* old duplicate/joke routes are intentionally no longer part of navigation */

  /* ------------------------------------------------------------------
     FUTURE — categorized bucket list + V1 letter treatment
     ------------------------------------------------------------------ */
  const FUTURE_CATS=[
    {key:'food',icon:'🍽',title:'먹고 싶은 것',sub:'함께 먹어보고 싶은 메뉴와 맛집',placeholder:'먹고 싶은 것 추가',items:['동네 구석구석 우리만의 비밀 카페 발굴하기']},
    {key:'near',icon:'🚗',title:'가고 싶은 곳',sub:'가까운 데이트 장소',placeholder:'가고 싶은 곳 추가',items:['평일 낮에 한적한 바다 보러 떠나기','밤 드라이브 가서 야경 보기']},
    {key:'travel',icon:'✈️',title:'여행 가고 싶은 곳',sub:'도시·나라·휴양지',placeholder:'여행 가고 싶은 곳 추가',items:['Tokyo 가기']},
    {key:'try',icon:'✦',title:'해보고 싶은 것',sub:'둘이 처음 해볼 경험',placeholder:'해보고 싶은 것 추가',items:['서로의 어린 시절 앨범 흑역사 사진 보며 TMI 대방출하기']},
    {key:'little',icon:'♡',title:'소소한 일상',sub:'평범하지만 함께 하고 싶은 일',placeholder:'소소한 일 추가',items:['MoMA 다시 가기','오로라 보러 가기','같이 장보기','크리스마스 트리 같이 꾸미기','밤늦게 차 끌고 가서 자동차 극장 보기','1년 뒤 서로에게 보내는 타임캡슐 쓰기','분위기 좋은 바, 특히 재즈바 가서 첫인상 다시 얘기하기','실내 클라이밍이나 테니스 원데이 클래스 같이 가기']},
  ];
  const norm=s=>String(s||'').toLowerCase().replace(/aurora/g,'오로라').replace(/[^0-9a-z가-힣]+/gi,'');
  function legacyCat(text){text=String(text||'');if(/카페|먹|맛집|밥/.test(text))return'food';if(/바다|드라이브|야경/.test(text))return'near';if(/Tokyo|도쿄/.test(text))return'travel';if(/어린 시절|흑역사|클라이밍|테니스/.test(text))return'try';return'little'}
  function renderCategorizedBucket(panel){
    if(!panel||panel.dataset.productionBucket==='1')return;panel.dataset.productionBucket='1';
    panel.innerHTML='<div class="v3-bucket-categories" id="v3BucketCategories"></div>';
    let seeded=false,off=null;
    off=DB.onBucketItems(async rows=>{
      if(!panel.isConnected){try{off&&off()}catch(e){}return}
      rows=rows||[];
      if(!seeded){seeded=true;const have=new Set(rows.map(r=>norm(r.text)));const adds=[];FUTURE_CATS.forEach(c=>c.items.forEach(text=>{if(!have.has(norm(text))){have.add(norm(text));adds.push(DB.addBucketItem({type:'next300:'+c.key,text,done:false,author:me()}))}}));if(adds.length)await Promise.all(adds)}
      const host=$('#v3BucketCategories',panel);if(!host)return;
      host.innerHTML=FUTURE_CATS.map(c=>{
        const items=rows.filter(r=>r.type==='next300:'+c.key||(r.type==='next300'&&legacyCat(r.text)===c.key));
        return `<section class="v3-bucket-cat"><div class="v3-bucket-cat-head"><div><h3>${esc(c.title)}</h3><p>${esc(c.sub)}</p></div><div class="v3-bucket-cat-icon">${c.icon}</div></div><div class="v3-bucket-list">${items.map(it=>`<div class="v3-bucket-row ${it.done?'is-done':''}"><input type="checkbox" data-bucket-toggle="${it.id}" ${it.done?'checked':''}><div class="copy">${esc(it.text)}</div><div>${it.done?'<span class="stamp">WE DID IT</span>':''}<button class="icon-btn" data-bucket-delete="${it.id}" style="width:28px;height:28px;font-size:10px">×</button></div></div>`).join('')||'<div class="section-note">아직 없어요.</div>'}</div><div class="v3-bucket-add"><input class="field" data-bucket-input="${c.key}" placeholder="${esc(c.placeholder)}"><button class="btn btn-sm" data-bucket-add="${c.key}">+</button></div></section>`;
      }).join('');
      $$('[data-bucket-toggle]',host).forEach(x=>x.onchange=()=>{DB.updateBucketItem(x.dataset.bucketToggle,{done:x.checked});if(x.checked&&window.V2Anim)V2Anim.sparkleAt(x.closest('.v3-bucket-row'),5)});
      $$('[data-bucket-delete]',host).forEach(x=>x.onclick=()=>DB.deleteBucketItem(x.dataset.bucketDelete));
      $$('[data-bucket-add]',host).forEach(b=>b.onclick=()=>{const k=b.dataset.bucketAdd,input=$(`[data-bucket-input="${k}"]`,host),text=input?.value.trim();if(!text)return;DB.addBucketItem({type:'next300:'+k,text,done:false,author:me()});input.value=''});
      $$('[data-bucket-input]',host).forEach(input=>input.onkeydown=e=>{if(e.key==='Enter'){const b=$(`[data-bucket-add="${input.dataset.bucketInput}"]`,host);b?.click()}});
    });
  }

  function polishFuture(){
    const view=$('#view-future');if(!view)return;
    const next=view.querySelector('[data-panel="v3next300"]');if(next)renderCategorizedBucket(next);
    const letter=view.querySelector('[data-panel="letter"]');
    if(letter&&!letter.classList.contains('v3-letter-polished')){
      letter.classList.add('v3-letter-polished');
      letter.insertAdjacentHTML('afterbegin','<div class="v3-letter-heading"><div class="k">LETTER TO FUTURE US</div><h3>To the us we haven’t met yet.</h3><p>지금의 우리가 미래의 우리에게 남기는 편지예요. 열어볼 날짜를 정하고 봉인해두면 그날 다시 읽을 수 있어요.</p></div>');
    }
  }

  /* ------------------------------------------------------------------
     DOM observer: views are rendered dynamically by the router
     ------------------------------------------------------------------ */
  let queued=false;
  function polish(){
    queued=false;cleanProductCopy();installTopMetrics();polishHeroPlaceholder();homeMovieV1();albumSyncNote();addStreakHelp();polishFuture();
  }
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(polish)});
  observer.observe(document.body,{childList:true,subtree:true});
  polish();
})();
