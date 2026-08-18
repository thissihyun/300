/* 300 Days With You — user-facing refinement pass */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const me=()=>{try{return Identity.displayName(Identity.current())}catch(e){return ''}};
  const dbRaw=()=>{try{return window.firebase&&firebase.firestore?firebase.firestore():null}catch(e){return null}};
  let allPhotos=[];
  if(window.DB&&DB.onAllPhotos) DB.onAllPhotos(rows=>{allPhotos=rows||[]; refreshMovieSurfaces();});

  /* ------------------------ HOME HERO PHOTO PICKER ------------------------ */
  const HOME_HERO_MAX=8;
  function heroFileToDataUrl(file,maxDim=1600,quality=.82){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=reject;
      reader.onload=()=>{
        const img=new Image();
        img.onerror=()=>reject(new Error('image-decode-failed'));
        img.onload=()=>{
          let w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
          if(w>maxDim||h>maxDim){const s=maxDim/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s)}
          const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
          canvas.getContext('2d').drawImage(img,0,0,w,h);
          resolve(canvas.toDataURL('image/jpeg',quality));
        };
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function heroUpload(){
    const panel=$('#uploadPanel'); if(!panel)return;
    const today=typeof todayISO==='function'?todayISO():'2025-10-23';
    function paint(){
      const chosen=allPhotos.filter(p=>p.homeHero);
      const countEl=$('#v3HeroPickerCount',panel); if(countEl)countEl.textContent=`${chosen.length} / ${HOME_HERO_MAX} 선택됨`;
      const grid=$('#v3HeroPickerGrid',panel); if(!grid)return;
      const sorted=allPhotos.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      grid.innerHTML=sorted.length?sorted.map(p=>`
        <button type="button" class="v3-hero-pick-tile ${p.homeHero?'is-picked':''}" data-hero-pick="${esc(p.id)}">
          <img src="${esc(p.url)}" alt="" loading="lazy">
          <span class="v3-hero-pick-date">${esc((p.date||'').slice(5))}</span>
          <span class="v3-hero-pick-mark">${p.homeHero?'✓ 사용 중':'선택하기'}</span>
        </button>`).join('') : '<div class="empty-frame" style="grid-column:1/-1;">아직 앨범에 사진이 없어요. 아래에서 새 사진을 올려보세요.</div>';
      $$('[data-hero-pick]',grid).forEach(btn=>btn.addEventListener('click',async()=>{
        const id=btn.dataset.heroPick, p=allPhotos.find(x=>String(x.id)===id); if(!p)return;
        if(!p.homeHero && allPhotos.filter(x=>x.homeHero).length>=HOME_HERO_MAX){ Router.toast(`최대 ${HOME_HERO_MAX}장까지 고를 수 있어요`); return; }
        await DB.updatePhoto(id,{homeHero:!p.homeHero});
      }));
    }
    panel.innerHTML=`
      <div class="modal-top"><button class="icon-btn" data-action="close-modal">✕</button></div>
      <div class="v3-album-modal-k">HOME SCREEN</div>
      <h2 class="modal-title" style="font-size:22px;">첫 화면 사진</h2>
      <div class="section-note">홈 첫 화면에 사용할 사진을 직접 선택해요. 최대 ${HOME_HERO_MAX}장까지 고를 수 있고, 선택은 같은 링크를 여는 시현·강원에게 함께 보여요.</div>
      <div class="v3-hero-picker-count" id="v3HeroPickerCount"></div>
      <div class="v3-hero-picker-grid" id="v3HeroPickerGrid"></div>
      <div class="v3-hero-upload-block">
        <label class="section-note v3-album-field-label">새 사진 올리고 바로 사용하기</label>
        <input class="field" type="date" id="v3HeroUploadDate" value="${esc(today)}">
        <input class="v3-file-input" type="file" id="v3HeroUploadFiles" accept="image/*" multiple>
        <div id="v3HeroUploadProgress" class="section-note"></div>
      </div>`;
    paint();
    if(window.DB&&DB.onAllPhotos){
      const off=DB.onAllPhotos(rows=>{ allPhotos=rows||[]; if(panel.isConnected&&$('#v3HeroPickerGrid',panel))paint(); else off&&off(); });
    }
    $('#v3HeroUploadFiles',panel).addEventListener('change',async e=>{
      const files=Array.from(e.target.files||[]); if(!files.length)return;
      const date=$('#v3HeroUploadDate',panel).value||today;
      const progress=$('#v3HeroUploadProgress',panel);
      const room=HOME_HERO_MAX-allPhotos.filter(p=>p.homeHero).length;
      if(room<=0){ Router.toast(`최대 ${HOME_HERO_MAX}장까지 고를 수 있어요`); e.target.value=''; return; }
      const toUpload=files.slice(0,room);
      for(let i=0;i<toUpload.length;i++){
        progress.textContent=`업로드 중 ${i+1} / ${toUpload.length}`;
        try{
          const url=await heroFileToDataUrl(toUpload[i]);
          await DB.addPhoto({date,url,hero:false,homeHero:true,bookPick:false,place:'',food:'',type:'',moods:[],caption:'',author:me()});
        }catch(err){ console.warn('[home hero upload]',err); }
      }
      progress.textContent=`${toUpload.length}장 추가했어요`;
      e.target.value='';
    });
    $('#uploadModal').classList.add('is-open'); document.body.classList.add('modal-open');
  }
  function enhanceHero(){
    const wrap=$('#view-home #heroPhotoWrap'); if(!wrap)return;
    const imgs=$$('img',wrap);
    if(imgs.length){
      wrap.classList.add('v3-hero-carousel-ready');
      wrap.classList.remove('v3-hero-empty-state');
      let dots=$('.v3-hero-dots',wrap);
      if(!dots){ dots=document.createElement('div');dots.className='v3-hero-dots';wrap.appendChild(dots); }
      dots.innerHTML=imgs.map((_,i)=>`<i class="${i===0?'is-active':''}"></i>`).join('');
      imgs.forEach((img,i)=>{
        if(img.dataset.v3Observed)return; img.dataset.v3Observed='1';
        new MutationObserver(()=>{
          $$('.v3-hero-dots i',wrap).forEach((d,j)=>d.classList.toggle('is-active',j===i&&img.classList.contains('is-active')));
        }).observe(img,{attributes:true,attributeFilter:['class']});
      });
      if(!$('.v3-hero-edit',wrap)){
        const btn=document.createElement('button'); btn.type='button'; btn.className='v3-hero-edit'; btn.textContent='✎ 첫 화면 사진';
        btn.addEventListener('click',heroUpload); wrap.appendChild(btn);
      }
      return;
    }
    wrap.classList.remove('v3-hero-carousel-ready');
    if($('.v3-hero-add',wrap))return;
    // .hero-photo has its own z-index:0 stacking context (Section: cinematic hero),
    // so the add button — a child — can never paint above the text column sibling
    // just by raising its own z-index. Marking the wrap itself lifts the whole
    // stacking context instead; without this the button existed but every click
    // silently landed on the invisible text-column div on top of it.
    wrap.classList.add('v3-hero-empty-state');
    wrap.innerHTML=`<button class="v3-hero-add" type="button"><span class="plus">＋</span><strong>✎ 첫 화면 사진</strong><span>첫 화면에 보여줄 실제 사진을 골라요.</span><small>앨범 사진 중에서 직접 선택하거나, 새 사진을 바로 올릴 수 있어요.</small></button>`;
    $('.v3-hero-add',wrap).addEventListener('click',heroUpload);
  }

  /* ------------------------ V1 MOVIE FILMSTRIP ------------------------ */
  function chapterData(){
    const groups=[]; const map=new Map();
    Object.entries(window.EVENTS||{}).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([date,ev])=>{
      const raw=ev.chapter||'OUR STORY';
      if(!map.has(raw)){ const row={raw,title:raw.replace(/^CHAPTER\s*\d+\s*·\s*/i,''),dates:[],events:[]};map.set(raw,row);groups.push(row); }
      const row=map.get(raw); row.dates.push(date); row.events.push([date,ev]);
    });
    return groups;
  }
  const FILM_COLORS=['cream','red','olive','blue','gold','rose','sage','ink'];
  function chapterPhoto(ch){
    const set=new Set(ch.dates);
    const list=allPhotos.filter(p=>set.has(p.date));
    return list.find(p=>p.hero)||list[0]||null;
  }
  function movieHtml(compact){
    const chapters=chapterData();
    return `<div class="v1-movie-frame ${compact?'is-compact':''}"><div class="v1-film-track">${chapters.map((ch,i)=>{
      const p=chapterPhoto(ch), date=ch.dates[0], ev=ch.events[0]?.[1]||{};
      return `<button class="v1-film-card ${FILM_COLORS[i%FILM_COLORS.length]}" data-action="memory" data-date="${date}">
        <div class="v1-film-photo">${p?`<img src="${esc(p.url)}" alt="">`:`<span>REAL PHOTO<br>MEMORY FRAME</span>`}</div>
        <div class="v1-film-copy"><span class="v1-film-chapter">${String(i+1).padStart(2,'0')}</span><h3>${esc(ch.title)}</h3><div class="v1-film-date">${esc(date)}</div><p>${esc(ev.story||'')}</p><span class="v1-film-play">PLAY MEMORY →</span></div>
      </button>`;
    }).join('')}</div></div>`;
  }
  function renderOurStory(container){
    container.innerHTML=`<div class="v1-story-page"><div class="v1-story-head"><div><div class="v1-story-kicker">CHAPTER INDEX</div><h1>OUR STORY, AS A MOVIE</h1></div><p>사진과 카톡을 날짜순으로 넘기기 전에, 우리의 이야기를 영화 챕터처럼 먼저 훑어봐요.</p></div>${movieHtml(false)}<div class="v1-story-foot"><span>ARCHIVE ROUTES</span><button class="btn btn-sm btn-outline" data-action="view" data-target="ourdays">OUR DAYS →</button><button class="btn btn-sm btn-outline" data-action="view" data-target="album">PHOTO ALBUM →</button></div></div>`;
  }
  Router.registerView('ourstory',{render:renderOurStory});
  function renderHomeMovie(){
    const strip=$('#view-home #movieStrip'); if(!strip)return;
    strip.className='v1-home-movie'; strip.innerHTML=movieHtml(true);
  }
  function refreshMovieSurfaces(){ renderHomeMovie(); if(Router.currentView==='ourstory'){ const v=$('#view-ourstory'); if(v?.classList.contains('is-active'))renderOurStory(v); } }

  /* ------------------------ HOME HUB CLEANUP ------------------------ */
  function simplifyHomeHub(){
    const sections=$$('#view-home .section');
    const section=sections.find(s=>$('.section-title',s)?.textContent.trim()==='ENTER OUR STORY'); if(!section||section.dataset.v3Simple)return;
    section.dataset.v3Simple='1'; const grid=$('.grid',section); if(!grid)return;
    const keep=['firsts','places','words','seasons'];
    $$('[data-action="special"]',grid).forEach(b=>{ if(!keep.includes(b.dataset.target))b.remove(); });
    grid.insertAdjacentHTML('afterend','<div class="v3-more-archive"><span>나머지 아카이브는 SPECIAL에서 한 번에 볼 수 있어요.</span><button class="btn btn-sm btn-outline" data-action="view" data-target="special">MORE OF OUR ARCHIVE →</button></div>');
  }

  /* ------------------------ CALENDAR ------------------------ */
  function enhanceCalendar(){
    const host=$('#view-ourdays #calHost'); if(!host)return;
    const specials=window.SPECIAL_DAYS||{};
    Object.entries(specials).forEach(([date,info])=>{
      const cell=host.querySelector(`.cal-cell[data-date="${date}"]`); if(!cell)return;
      cell.classList.add('v3-special-date');
      if(/생일/.test(info.label||''))cell.classList.add('v3-birthday-date');
      if(date==='2025-12-20')cell.classList.add('v3-sihyun-birthday');
      let badge=$('.v3-calendar-special-label',cell);
      if(!badge){badge=document.createElement('div');badge.className='v3-calendar-special-label';cell.appendChild(badge);}
      badge.textContent=`${info.icon||'♥'} ${info.label||''}`;
    });
  }

  /* ------------------------ ALBUM MODES ------------------------ */
  const ALBUM_KEEP=new Set(['day','monthly','filmstrip','hero','photobooth','random']);
  function simplifyAlbum(){
    const bar=$('#view-album #v3AlbumToolbar'); if(!bar)return;
    $$('[data-v3-album-mode]',bar).forEach(b=>{ const k=b.dataset.v3AlbumMode;b.style.display=ALBUM_KEEP.has(k)?'':'none'; if(k==='filmstrip')b.textContent='FILM'; if(k==='photobooth')b.textContent='네컷'; if(k==='random')b.textContent='🎲 RANDOM'; });
  }

  /* ------------------------ DATES I'D LIVE AGAIN ANIMATION ------------------------ */
  let posterObserver=null;
  function enhancePosters(){
    const cards=$$('#specialDetailHost .poster-flip'); if(!cards.length)return;
    if(!posterObserver&&'IntersectionObserver' in window){
      posterObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('v1-poster-in');posterObserver.unobserve(e.target)}}),{threshold:.14});
    }
    cards.forEach((c,i)=>{if(c.dataset.v1Anim)return;c.dataset.v1Anim='1';c.classList.add('v1-poster-enter');c.style.setProperty('--v1-delay',`${i*70}ms`);posterObserver?.observe(c);if(!posterObserver)setTimeout(()=>c.classList.add('v1-poster-in'),30+i*70)});
  }

  /* ------------------------ SPECIAL HUB ------------------------ */
  const PRIMARY=[
    {key:'firsts',n:'01',t:'OUR FIRSTS',s:'처음들의 타임라인.'},
    {key:'liveagain',n:'02',t:"THE DATES I'D LIVE AGAIN",s:'다시 살고 싶은 날들.'},
    {key:'places',n:'03',t:'OUR NEW YORK',s:'장소로 다시 보는 우리.'},
    {key:'words',n:'04',t:'WORDS THAT BECAME OURS',s:'둘만의 단어와 말버릇.'},
    {key:'seasons',n:'05',t:'THE SEASONS WE SHARED',s:'사계절마다 달랐던 장면.'},
    {key:'thankyoujar',n:'06',t:'OUR THANK-YOU JAR',s:'카톡과 매일의 감사를 한곳에.'},
  ];
  const MORE=[
    {key:'constellation',t:'OUR CONSTELLATION',s:'중요한 날들을 별로 이은 밤하늘.'},
    {key:'food',t:'OUR LOVE LANGUAGE WAS “밥 먹자”',s:'함께 먹은 것과 더 채울 맛집.'},
    {key:'photobooth',t:'PHOTOBOOTH ARCHIVE',s:'네컷 모음.'},
    {key:'numbers',t:'US, BY THE NUMBERS',s:'숫자와 대화량으로 보는 우리.'},
    {key:'favorites',t:'OUR FAVORITES ♥',s:'즐겨찾기한 기억들.'},
    {key:'liked',t:'DAYS WE BOTH LOVED',s:'둘이 좋아한 날들.'},
    {key:'awards',t:'OUR MINI AWARDS',s:'둘만의 시상식.'},
    {key:'stats',t:'OUR STATS',s:'기록 streak · 감정 · 활동 통계.'},
    {key:'likedkakao',t:'LIKED KAKAO MESSAGES',s:'저장해둔 카톡 한 줄들.'},
  ];
  window.SPECIAL_HUB=PRIMARY.concat(MORE,[{key:'kakao',t:'KAKAO IMPORT',s:'새 카톡 내보내기로 숫자를 갱신.'}]);
  function specialHeader(title,sub){return `<button class="btn btn-sm btn-outline" data-action="special-back">← SPECIAL</button><div class="section-head" style="margin-top:14px"><div class="section-title">${esc(title)}</div>${sub?`<div class="section-note">${esc(sub)}</div>`:''}</div>`}
  function renderSpecialHub(){
    const hub=$('#specialHub'),detail=$('#specialDetailHost');if(!hub)return;if(detail)detail.style.display='none';hub.style.display='';
    hub.innerHTML=`<div class="v3-special-hero"><h1>SPECIAL FEATURES</h1><p>우리 관계를 여러 방식으로 다시 꺼내보는 작은 아카이브.</p></div><section class="v3-special-group"><div class="v3-special-group-title">OUR STORY COLLECTION</div><div class="v3-special-grid">${PRIMARY.map(x=>`<button class="card card-btn v3-special-card" data-action="special" data-target="${x.key}"><div class="n">${x.n}</div><div class="t">${esc(x.t)}</div><div class="s">${esc(x.s)}</div></button>`).join('')}</div></section><section class="v3-special-group v3-special-secondary"><div class="v3-special-group-title">MORE OF OUR ARCHIVE</div><div class="v3-special-grid">${MORE.map(x=>`<button class="card card-btn v3-special-card v3-special-secondary-card" data-action="special" data-target="${x.key}"><div class="t">${esc(x.t)}</div><div class="s">${esc(x.s)}</div></button>`).join('')}</div></section><section class="v3-special-group"><div class="v3-special-group-title">TOOLS</div><button class="btn btn-sm btn-outline" data-action="special" data-target="kakao">KAKAO IMPORT</button></section>`;
  }
  Router.registerView('special',{render:renderSpecialHub});

  /* ------------------------ THANK-YOU JAR ------------------------ */
  const THANK_CATS=[
    ['care','배려와 돌봄',/기다|데려|챙겨|와줘|와 줘|도와|수고|고생|걱정|약|아프|조심|태워|마중/i],
    ['together','함께 있어줘서',/같이|함께|만나|보러|와서|시간|놀아|여행|걸어|데이트/i],
    ['support','응원과 힘',/공부|시험|과제|응원|힘내|믿어|축하|합격|수업|일/i],
    ['food','먹는 행복',/밥|먹|맛있|요리|사줘|사 줘|카페|커피|국밥|라쿠|raku|hotpot/i],
    ['gift','선물과 기억',/선물|꽃|사진|편지|티켓|사다|사와|준비/i],
    ['understand','이해와 화해',/이해|들어줘|들어 줘|미안|대화|말해|솔직|기다려줘/i],
    ['love','사랑을 표현해줘서',/사랑|좋아|행복|보고싶|보고 싶|예쁘|귀엽|다정/i],
    ['little','작은 고마움',/.*/]
  ];
  function thankCat(text){for(const [k,l,re] of THANK_CATS)if(re.test(text||''))return[k,l];return['little','작은 고마움']}
  function thankId(m){let s=[m.date,m.speaker,m.text].join('|'),h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return 't'+(h>>>0).toString(36)}
  Router.registerSpecial('thankyoujar',{render(host){
    host.innerHTML=specialHeader('OUR THANK-YOU JAR','작은 고마움이 어떻게 쌓였는지 다시 보는 곳.')+`<div class="v3-thank-how"><div><b>실제 카톡</b><span>전체 대화에서 ‘고마워/감사’가 들어간 문장을 자동으로 모으고 상황별로 분류해요.</span></div><div><b>DAILY GRATITUDE</b><span>DIARY의 THANK YOU에 오늘 고마웠던 일을 적으면 여기에 자동으로 쌓여요.</span></div><div><b>삭제</b><span>카톡 항목의 삭제 버튼은 이 감사 코너에서만 숨깁니다. 원본 카톡 기록은 그대로 보존돼요.</span></div></div><div class="v3-thank-hero"><div><h2>So many little thank-yous.</h2><p>검색하거나 상황별로 골라서 다시 읽을 수 있어요.</p></div><div class="v3-thank-jar"><div class="count" id="v3ThankCount">0</div><div class="section-note">THANK-YOU MOMENTS</div></div></div><div class="v3-thank-tabs"><button class="is-active" data-thank-mode="kakao">실제 카톡</button><button data-thank-mode="daily">DAILY GRATITUDE</button></div><div class="v3-thank-tools"><input class="field" id="v3ThankSearch" placeholder="고마운 순간 검색…"><button class="btn btn-sm btn-outline" id="v3RestoreThanks" style="display:none"></button></div><div id="v3ThankCats"></div><div id="v3ThankResults"><div class="empty-frame">불러오는 중…</div></div>`;
    let mode='kakao',q='',cat='all',kakao=[],daily=[],hidden=new Set(),hiddenDocs=[];const raw=dbRaw();
    function draw(){
      if(!host.isConnected)return; const cats=$('#v3ThankCats',host),res=$('#v3ThankResults',host),restore=$('#v3RestoreThanks',host);
      if(mode==='kakao'){
        const visible=kakao.filter(m=>!hidden.has(thankId(m))); $('#v3ThankCount',host).textContent=visible.length.toLocaleString();
        const counts={};visible.forEach(m=>{const[k]=thankCat(m.text);counts[k]=(counts[k]||0)+1});
        cats.innerHTML=`<div class="v3-thank-cats"><button class="${cat==='all'?'is-active':''}" data-thank-cat="all">전체 ${visible.length}</button>${THANK_CATS.map(([k,l])=>`<button class="${cat===k?'is-active':''}" data-thank-cat="${k}">${esc(l)} ${counts[k]||0}</button>`).join('')}</div>`;
        let rows=visible.filter(m=>cat==='all'||thankCat(m.text)[0]===cat);if(q)rows=rows.filter(m=>`${m.date} ${m.speaker} ${m.text}`.toLowerCase().includes(q.toLowerCase()));rows=rows.slice(0,180);
        res.innerHTML=rows.length?`<div class="v3-thank-list">${rows.map(m=>`<div class="v3-thank-row"><button class="v3-thank-open" data-action="memory" data-date="${m.date}"><span>${esc(m.date)} · ${esc(m.speaker)}</span><p>${esc(m.text)}</p></button><button class="v3-thank-delete" data-thank-delete="${thankId(m)}" title="감사 코너에서 삭제">삭제</button></div>`).join('')}</div>`:'<div class="empty-frame">조건에 맞는 감사가 없어요.</div>';
        if(restore){restore.style.display=hiddenDocs.length?'':'none';restore.textContent=`삭제한 항목 ${hiddenDocs.length}개 복원`;}
      }else{
        cats.innerHTML='';let rows=daily;if(q)rows=rows.filter(r=>`${r.date} ${r.from} ${r.text}`.toLowerCase().includes(q.toLowerCase()));$('#v3ThankCount',host).textContent=rows.length.toLocaleString();
        res.innerHTML=rows.length?`<div class="v3-thank-list">${rows.map(r=>`<button class="v3-thank-open daily" data-action="memory" data-date="${r.date}"><span>${esc(r.date)} · FROM ${esc(r.from)}</span><p>${esc(r.text)}</p></button>`).join('')}</div>`:'<div class="empty-frame">DIARY의 THANK YOU에 고마운 일을 적으면 여기에 쌓여요.</div>';if(restore)restore.style.display='none';
      }
      $$('[data-thank-cat]',host).forEach(b=>b.onclick=()=>{cat=b.dataset.thankCat;draw()});
      $$('[data-thank-delete]',host).forEach(b=>b.onclick=async()=>{if(!raw)return;const id=b.dataset.thankDelete,m=kakao.find(x=>thankId(x)===id);if(!m)return;await raw.collection('thank_hidden').doc(id).set({date:m.date,speaker:m.speaker,text:m.text,hiddenBy:me(),createdAt:firebase.firestore.FieldValue.serverTimestamp()});Router.toast('이 감사 코너에서 숨겼어요')});
    }
    $$('[data-thank-mode]',host).forEach(b=>b.onclick=()=>{mode=b.dataset.thankMode;$$('[data-thank-mode]',host).forEach(x=>x.classList.toggle('is-active',x===b));cat='all';draw()});
    $('#v3ThankSearch',host).oninput=e=>{q=e.target.value.trim();draw()};
    let offGrat=DB.onAllGratitude(rows=>{daily=(rows||[]).filter(r=>r.text?.trim()).sort((a,b)=>(b.date||'').localeCompare(a.date||''));draw()});
    if(window.FullChat)FullChat.load().then(()=>{kakao=FullChat.allMessages().filter(m=>/고마워|감사/.test(m.text||'')).sort((a,b)=>b.date.localeCompare(a.date));draw()});
    let offHidden=null;if(raw)offHidden=raw.collection('thank_hidden').onSnapshot(s=>{hiddenDocs=s.docs.map(d=>({id:d.id,...d.data()}));hidden=new Set(hiddenDocs.map(x=>x.id));draw()});
    $('#v3RestoreThanks',host).onclick=async()=>{if(!raw||!hiddenDocs.length)return;const batch=raw.batch();hiddenDocs.forEach(x=>batch.delete(raw.collection('thank_hidden').doc(x.id)));await batch.commit();Router.toast('삭제한 감사 항목을 복원했어요')};
    const timer=setInterval(()=>{if(!host.isConnected){clearInterval(timer);try{offGrat&&offGrat()}catch(e){}try{offHidden&&offHidden()}catch(e){}}},1200);
  }});
  Router.registerSpecial('thanksarchive',Router); /* harmless old-key fallback overwritten below */
  Router.registerSpecial('thanksarchive',{render:host=>Router.openSpecial('thankyoujar')});
  Router.registerSpecial('thankskakao',{render:host=>Router.openSpecial('thankyoujar')});

  /* ------------------------ NUMBERS / CONVERSATION OVER TIME ------------------------ */
  function numbersPage(host,stats){
    stats=stats||window.BASELINE_STATS||{};const words=stats.words||{},monthly=stats.monthly||{};const months=Object.entries(monthly).sort((a,b)=>a[0].localeCompare(b[0]));const max=Math.max(1,...months.map(x=>x[1]));
    const tiles=[[typeof dayNumber==='function'?dayNumber(todayISO()):0,'days together'],[Object.keys(window.EVENTS||{}).length,'recorded days'],[(window.FIRSTS||[]).length,'firsts'],[stats.total||0,'kakao messages'],[words['사랑해']||0,'“사랑해”'],[words['고마워']||0,'“고마워”']];
    host.innerHTML=specialHeader('US, BY THE NUMBERS','실제 기록과 카톡으로 보는 우리.')+`<div class="v3-number-grid">${tiles.map(([v,l])=>`<div class="v3-number-tile"><div class="v">${Number(v).toLocaleString()}</div><div class="l">${esc(l)}</div></div>`).join('')}</div><section class="v1-conversation-chart"><div class="v1-chart-head"><div><div class="v1-story-kicker">CONVERSATION OVER TIME</div><h2>How much we talked</h2></div><p>실제 카톡 월별 메시지 수</p></div><div class="v1-month-bars">${months.map(([m,n])=>`<div class="v1-month-col"><div class="v1-month-value">${Number(n).toLocaleString()}</div><div class="v1-month-bar"><i style="height:${Math.max(5,n/max*100)}%"></i></div><div class="v1-month-label">${m.slice(2).replace('-','.')}</div></div>`).join('')}</div></section><section class="v3-word-frequency"><div class="section-title" style="font-size:18px">WORDS WE KEPT SAYING</div>${['사랑해','보고싶어','고마워','여보','아가'].map(k=>`<div class="v3-word-bar"><span>${k}</span><div class="v3-word-track"><div class="v3-word-fill" style="width:${Math.min(100,(words[k]||0)/Math.max(1,...['사랑해','보고싶어','고마워','여보','아가'].map(x=>words[x]||0))*100)}%"></div></div><b>${(words[k]||0).toLocaleString()}</b></div>`).join('')}<div style="margin-top:14px"><button class="btn btn-sm btn-outline" data-action="special" data-target="kakao">최신 카톡 통계로 갱신 →</button></div></section>`;
  }
  Router.registerSpecial('numbers',{render(host){let off=null;const draw=s=>numbersPage(host,s||window.BASELINE_STATS);draw();if(DB.onKakaoStats)off=DB.onKakaoStats(s=>draw(s||window.BASELINE_STATS));const t=setInterval(()=>{if(!host.isConnected){clearInterval(t);try{off&&off()}catch(e){}}},1200)}});
  Router.registerSpecial('pulse',{render(host){host.innerHTML=specialHeader('US, BY THE NUMBERS')+'<div class="empty-frame">이 내용은 US, BY THE NUMBERS의 대화량 그래프로 통합했어요.</div>'}});

  /* ------------------------ V1-LIKE MINI AWARDS ------------------------ */
  const AWARD_GROUPS=[
    {id:'chaotic',icon:'😂',title:'Most Chaotic Day',sub:'계획대로 안 됐는데 그래서 더 우리다웠던 날.',c:[['2025-11-01','Beacon — 20 KM'],['2025-11-30','SoHo gift mission'],['2025-12-10','Hollywood planning night']]},
    {id:'softest',icon:'🥹',title:'Softest Memory',sub:'다시 보면 마음이 제일 몽글해지는 순간.',c:[['2025-11-14','Central Park'],['2025-12-08',"Gangwon's birthday"],['2026-03-18','Busan reunion']]},
    {id:'usplace',icon:'🗽',title:'Most “Us” Place',sub:'장소 이름만 들어도 바로 우리가 떠오르는 곳.',c:[['2025-10-23','Governors Island'],['2025-12-11','Raku'],['2025-11-14','Central Park']]},
    {id:'fooddate',icon:'🍜',title:'Best Food Date',sub:'맛보다 그날의 기억 때문에 다시 먹고 싶은 한 끼.',c:[['2025-10-01','First NYU meal'],['2025-12-08','Birthday hotpot'],['2025-12-11','Raku · DAY 50']]},
    {id:'funnychat',icon:'💬',title:'Funniest Chat',sub:'아직도 읽으면 웃기는 우리의 대화.',c:[['2025-10-04','“정말…?”'],['2025-11-30','SoHo banter'],['2025-12-10','남자친구 있는거 아니야!!']]},
    {id:'rewatch',icon:'🎞️',title:'Most Rewatchable Day',sub:'한 번 더 처음부터 재생하고 싶은 날.',c:[['2025-10-23','DAY 1'],['2025-11-09','First 사랑해'],['2026-01-30','DAY 100']]},
  ];
  Router.registerSpecial('awards',{render(host){
    host.innerHTML=specialHeader('OUR MINI AWARDS','각자 하나씩 고르면 서로의 선택이 함께 보여요. 같은 날을 고르면 MATCH.')+`<div class="v1-awards-grid">${AWARD_GROUPS.map(a=>`<section class="v1-award-box"><div class="v1-award-head"><span>${a.icon}</span><div><h3>${esc(a.title)}</h3><p>${esc(a.sub)}</p></div></div><div class="v1-award-candidates">${a.c.map(([d,l])=>`<button data-award-choice="${a.id}" data-candidate="${d}"><b>${esc(l)}</b><span>${d}</span></button>`).join('')}</div><div class="v1-award-status" data-award-status="${a.id}"></div></section>`).join('')}</div>`;
    $$('[data-award-choice]',host).forEach(b=>b.onclick=()=>DB.setAwardVote(b.dataset.awardChoice,me(),b.dataset.candidate));
    let off=DB.onAwardVotes(rows=>{
      AWARD_GROUPS.forEach(a=>{const el=$(`[data-award-status="${a.id}"]`,host);if(!el)return;const s=rows.find(r=>r.awardId===a.id&&r.user===Identity.displayName('sihyun')),g=rows.find(r=>r.awardId===a.id&&r.user===Identity.displayName('gangwon'));const label=d=>a.c.find(x=>x[0]===d)?.[1]||'아직 선택 전';const match=s?.candidate&&g?.candidate&&s.candidate===g.candidate;el.innerHTML=`<span>시현 · ${esc(label(s?.candidate))}</span><span>강원 · ${esc(label(g?.candidate))}</span>${match?'<b>MATCH ♥</b>':''}`;$$(`[data-award-choice="${a.id}"]`,host).forEach(btn=>btn.classList.toggle('is-my-pick',btn.dataset.candidate===(me()===Identity.displayName('sihyun')?s?.candidate:g?.candidate)))});
    });const t=setInterval(()=>{if(!host.isConnected){clearInterval(t);try{off&&off()}catch(e){}}},1200);
  }});

  /* ------------------------ CONSOLIDATED FUTURE ------------------------ */
  let futureOff=[];function clearFuture(){futureOff.forEach(f=>{try{f&&f()}catch(e){}});futureOff=[]}
  const FUTURE_CATS=[
    {key:'food',icon:'🍽',title:'먹고 싶은 것',sub:'함께 먹어보고 싶은 메뉴와 맛집',items:['동네 구석구석 우리만의 비밀 카페 발굴하기']},
    {key:'near',icon:'🚗',title:'가고 싶은 곳',sub:'가까운 데이트 장소',items:['평일 낮에 한적한 바다 보러 떠나기','밤 드라이브 가서 야경 보기']},
    {key:'travel',icon:'✈️',title:'여행 가고 싶은 곳',sub:'도시·나라·휴양지',items:['Tokyo 가기']},
    {key:'try',icon:'✦',title:'해보고 싶은 것',sub:'둘이 처음 해볼 경험',items:['서로의 어린 시절 앨범 흑역사 사진 보며 TMI 대방출하기']},
    {key:'little',icon:'♡',title:'소소한 일상',sub:'평범하지만 함께 하고 싶은 일',items:['MoMA 다시 가기','오로라 보러 가기','같이 장보기','크리스마스 트리 같이 꾸미기','밤늦게 차 끌고 가서 자동차 극장 보기','1년 뒤 서로에게 보내는 타임캡슐 쓰기','분위기 좋은 바, 특히 재즈바 가서 첫인상 다시 얘기하기','실내 클라이밍이나 테니스 원데이 클래스 같이 가기']}
  ];
  const norm=s=>String(s||'').toLowerCase().replace(/aurora/g,'오로라').replace(/[^0-9a-z가-힣]+/gi,'');
  function bucketCat(r){const t=r.type||'',x=r.text||'';if(t.startsWith('next300:'))return t.split(':')[1];if(t==='newplaces')return'travel';if(t==='places')return'near';if(t==='try')return'try';if(t==='little'||t==='years')return'little';if(/카페|먹|맛집|밥/.test(x))return'food';if(/바다|드라이브|야경/.test(x))return'near';if(/Tokyo|도쿄|여행|오로라/.test(x))return'travel';if(/어린 시절|흑역사|클라이밍|테니스/.test(x))return'try';return'little'}
  function renderNextFuture(panel){
    panel.innerHTML=`<div class="v1-future-intro"><div><div class="v1-story-kicker">NEXT 300 DAYS</div><h2>Things we still want to do.</h2><p>다시 가고 싶은 곳, 처음 가볼 곳, 같이 해보고 싶은 소소한 일을 한 페이지에서 관리해요.</p></div></div><section class="v1-return-places"><div class="section-head"><div><div class="v1-story-kicker">WE'LL COME BACK FOR</div><div class="section-title" style="font-size:20px">다시 가고 싶은 곳</div></div></div><div class="v1-return-add"><input class="field" id="v1ReturnPlace" placeholder="다시 가고 싶은 장소"><button class="btn btn-sm" id="v1ReturnAdd">추가</button></div><div id="v1ReturnGrid" class="grid grid-2"></div></section><div id="v1FutureCats"></div>`;
    $('#v1ReturnAdd',panel).onclick=async()=>{const v=$('#v1ReturnPlace',panel).value.trim();if(!v)return;await DB.addPostcard({place:v,why:''});$('#v1ReturnPlace',panel).value=''};
    futureOff.push(DB.onPostcards(rows=>{const g=$('#v1ReturnGrid',panel);if(!g)return;g.innerHTML=rows.length?rows.map(r=>`<div class="v1-return-card"><b>${esc(r.place)}</b><textarea class="field" data-return-why="${r.id}" placeholder="왜 다시 가고 싶어?">${esc(r.why||'')}</textarea><button class="v1-text-delete" data-return-del="${r.id}">삭제</button></div>`).join(''):'<div class="empty-frame" style="grid-column:1/-1">다시 가고 싶은 장소를 추가해봐요.</div>';$$('[data-return-why]',g).forEach(ta=>{let t;ta.oninput=()=>{clearTimeout(t);t=setTimeout(()=>DB.updatePostcard(ta.dataset.returnWhy,{why:ta.value}),500)}});$$('[data-return-del]',g).forEach(b=>b.onclick=()=>DB.deletePostcard(b.dataset.returnDel))}));
    let seeded=false;futureOff.push(DB.onBucketItems(async rows=>{rows=rows||[];if(!seeded){seeded=true;const have=new Set(rows.map(r=>norm(r.text)));const jobs=[];FUTURE_CATS.forEach(c=>c.items.forEach(text=>{if(!have.has(norm(text))){have.add(norm(text));jobs.push(DB.addBucketItem({type:'next300:'+c.key,text,done:false,author:me()}))}}));if(jobs.length)await Promise.all(jobs)}const h=$('#v1FutureCats',panel);if(!h)return;h.innerHTML=FUTURE_CATS.map(c=>{const items=rows.filter(r=>r.type!=='promises'&&bucketCat(r)===c.key);return `<section class="v3-bucket-cat"><div class="v3-bucket-cat-head"><div><h3>${c.title}</h3><p>${c.sub}</p></div><div class="v3-bucket-cat-icon">${c.icon}</div></div><div class="v3-bucket-list">${items.map(it=>`<div class="v3-bucket-row ${it.done?'is-done':''}"><input type="checkbox" data-future-toggle="${it.id}" ${it.done?'checked':''}><div class="copy">${esc(it.text)}</div>${it.done?'<span class="stamp">WE DID IT</span>':''}<button class="icon-btn" data-future-del="${it.id}">×</button></div>`).join('')||'<div class="section-note">아직 없어요.</div>'}</div><div class="v3-bucket-add"><input class="field" data-future-input="${c.key}" placeholder="${c.title} 추가"><button class="btn btn-sm" data-future-add="${c.key}">+</button></div></section>`}).join('');$$('[data-future-toggle]',h).forEach(x=>x.onchange=()=>DB.updateBucketItem(x.dataset.futureToggle,{done:x.checked}));$$('[data-future-del]',h).forEach(x=>x.onclick=()=>DB.deleteBucketItem(x.dataset.futureDel));$$('[data-future-add]',h).forEach(b=>b.onclick=()=>{const inp=$(`[data-future-input="${b.dataset.futureAdd}"]`,h),v=inp?.value.trim();if(!v)return;DB.addBucketItem({type:'next300:'+b.dataset.futureAdd,text:v,done:false,author:me()});inp.value=''})}));
  }
  function renderPromisesFuture(panel){
    const seeds=['다투더라도 끝까지 대화하고 서로 맞춰가기','하루의 시작과 끝을 가능한 자주 함께 보내기','서로의 손을 쉽게 놓지 않기','불필요한 설명 없이도 편안한 사이로 남기','예쁘게 연애하다가 나중에 꼭 결혼하기'];
    panel.innerHTML=`<div class="v1-promise-sheet"><div class="v1-story-kicker">OUR SMALL PROMISES</div><h2>Things we want to keep.</h2><div class="v1-promise-add"><input class="field" id="v1PromiseInput" placeholder="우리의 작은 약속"><button class="btn btn-sm" id="v1PromiseAdd">추가</button></div><div class="v3-seed-cloud">${seeds.map(s=>`<button data-promise-seed="${esc(s)}">+ ${esc(s)}</button>`).join('')}</div><div id="v1PromiseList"></div></div>`;
    const add=t=>{t=(t||'').trim();if(t)DB.addBucketItem({type:'promises',text:t,done:false,author:me()})};$('#v1PromiseAdd',panel).onclick=()=>{add($('#v1PromiseInput',panel).value);$('#v1PromiseInput',panel).value=''};$$('[data-promise-seed]',panel).forEach(b=>b.onclick=()=>add(b.dataset.promiseSeed));futureOff.push(DB.onBucketItems(rows=>{const h=$('#v1PromiseList',panel);if(!h)return;const items=rows.filter(r=>r.type==='promises');h.innerHTML=items.length?items.map(it=>`<div class="v3-bucket-row ${it.done?'is-done':''}"><input type="checkbox" data-pr-toggle="${it.id}" ${it.done?'checked':''}><div class="copy">${esc(it.text)}</div>${it.done?'<span class="stamp">WE DID IT</span>':''}<button class="icon-btn" data-pr-del="${it.id}">×</button></div>`).join(''):'<div class="empty-frame">우리만의 약속을 하나 적어봐요.</div>';$$('[data-pr-toggle]',h).forEach(x=>x.onchange=()=>DB.updateBucketItem(x.dataset.prToggle,{done:x.checked}));$$('[data-pr-del]',h).forEach(x=>x.onclick=()=>DB.deleteBucketItem(x.dataset.prDel))}));
  }
  function renderLettersFuture(panel){
    const target=new Date(window.DAY1);target.setDate(target.getDate()+499);const targetISO=`${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(target.getDate()).padStart(2,'0')}`;const left=Math.max(0,500-(typeof dayNumber==='function'?dayNumber(todayISO()):0));
    panel.innerHTML=`<div class="v1-letter-layout"><section class="v1-letter-paper"><div class="v1-story-kicker">LETTER TO FUTURE US</div><h2>To the us we haven’t met yet.</h2><p>지금의 우리가 미래의 우리에게 남기는 편지예요. 열어볼 날짜를 정하면 그날까지 봉인됩니다.</p><textarea class="field" id="v1LetterText" placeholder="미래의 우리에게…"></textarea><div class="v1-letter-controls"><input class="field" type="date" id="v1LetterDate"><button class="btn btn-sm" id="v1SealLetter">편지 봉인</button></div><div id="v1LetterList"></div></section><section class="v1-day500"><div class="v1-story-kicker">OPEN ON DAY 500</div><h3>${targetISO}</h3><p>${left>0?`DAY 500까지 ${left}일 남았어요. 이 편지는 그때까지 계속 수정할 수 있어요.`:'이제 DAY 500 편지를 열어볼 수 있어요.'}</p><textarea class="field" id="v1Day500Text" placeholder="DAY 500의 우리에게…"></textarea><div class="section-note" id="v1Day500State">자동 저장돼요.</div></section></div>`;
    $('#v1SealLetter',panel).onclick=async()=>{const text=$('#v1LetterText',panel).value.trim(),openDate=$('#v1LetterDate',panel).value;if(!text||!openDate){Router.toast('편지와 여는 날짜를 모두 채워주세요');return}await DB.addLetter({text,openDate,author:me(),opened:false});$('#v1LetterText',panel).value='';$('#v1LetterDate',panel).value='';Router.toast('편지를 봉인했어요')};futureOff.push(DB.onLetters(rows=>{const h=$('#v1LetterList',panel);if(!h)return;const today=todayISO();h.innerHTML=rows.length?rows.map(r=>`<div class="v1-sealed-letter"><span>${esc(r.author||'')} · OPEN ON ${esc(r.openDate)}</span>${today>=r.openDate?`<p>${esc(r.text)}</p>`:`<p>🔒 Sealed until ${esc(r.openDate)}</p>`}</div>`).join(''):'<div class="section-note">아직 봉인한 편지가 없어요.</div>'}));const area=$('#v1Day500Text',panel),state=$('#v1Day500State',panel);futureOff.push(DB.onDay500Letter(d=>{if(document.activeElement!==area)area.value=d?.text||''}));let saveT;area.oninput=()=>{clearTimeout(saveT);state.textContent='저장 중…';saveT=setTimeout(async()=>{await DB.setDay500Letter(area.value);state.textContent='저장됨 ✓'},600)};
  }
  Router.registerView('future',{render(container){clearFuture();container.innerHTML=`<div class="v1-future-head"><div class="v1-story-kicker">OUR FUTURE</div><h1>Still becoming us.</h1><p>비슷한 기능은 합치고, 앞으로 할 일 · 약속 · 미래 편지만 남겼어요.</p></div><div class="future-tabs v1-future-tabs"><button data-action="tab" data-group="futurex" data-target="next" data-tabbtn="futurex" class="is-active">NEXT 300 DAYS</button><button data-action="tab" data-group="futurex" data-target="promises" data-tabbtn="futurex">OUR SMALL PROMISES</button><button data-action="tab" data-group="futurex" data-target="letters" data-tabbtn="futurex">LETTERS TO FUTURE US</button></div><div data-tabpanel="futurex" data-panel="next" class="tab-panel is-active"></div><div data-tabpanel="futurex" data-panel="promises" class="tab-panel"></div><div data-tabpanel="futurex" data-panel="letters" class="tab-panel"></div>`;renderNextFuture(container.querySelector('[data-panel="next"]'));renderPromisesFuture(container.querySelector('[data-panel="promises"]'));renderLettersFuture(container.querySelector('[data-panel="letters"]'))}});

  /* ------------------------ OBSERVER ------------------------ */
  let qd=false;function polish(){qd=false;enhanceHero();renderHomeMovie();simplifyHomeHub();enhanceCalendar();simplifyAlbum();enhancePosters()}
  const mo=new MutationObserver(()=>{if(qd)return;qd=true;requestAnimationFrame(polish)});mo.observe(document.body,{childList:true,subtree:true});polish();
})();