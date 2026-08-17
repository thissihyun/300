/* V3 FULL MERGE — restores V1-only surfaces on top of the V2 engine. */
(function(){
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>window.escapeHtml?escapeHtml(s):String(s==null?'':s);
  const display=id=>{ try{return Identity.displayName(id)}catch(e){return id||''} };
  const currentName=()=>{ try{return display(Identity.current())}catch(e){return ''} };
  const today=()=>typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10);
  const names=()=>[display('sihyun'),display('gangwon')];

  /* 1) V1 floating Memory Search — V2 search engine underneath */
  function installSearchFab(){
    if($('#v3MemorySearchFab')) return;
    const btn=document.createElement('button');
    btn.id='v3MemorySearchFab'; btn.className='v3-memory-search-fab'; btn.type='button';
    btn.title='추억 검색 · Ctrl/⌘ K'; btn.setAttribute('aria-label','추억 검색'); btn.textContent='⌕';
    btn.addEventListener('click',()=>window.SearchView&&SearchView.open());
    document.body.appendChild(btn);
    document.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
        e.preventDefault(); if(window.SearchView) SearchView.open();
      }
    });
  }

  /* 2) V1 OUR DIARY drawer + V2 quick navigation, fully combined */
  let archiveSubs=[];
  let archiveTab='today';
  function clearArchiveSubs(){ archiveSubs.forEach(fn=>{try{fn&&fn()}catch(e){}}); archiveSubs=[]; }
  function addSub(fn){ if(typeof fn==='function') archiveSubs.push(fn); return fn; }
  function rawDb(){ try{return window.firebase&&firebase.firestore?firebase.firestore():null}catch(e){return null} }
  function closeArchive(){
    $('#archiveDrawer')?.classList.remove('is-open','v3-stats-wide');
    $('#archiveDrawerScrim')?.classList.remove('is-open');
    clearArchiveSubs();
  }
  function fmtTime(row){
    const ms=row?.createdAt?.toMillis?row.createdAt.toMillis():(row?.clientTime||0);
    if(!ms) return '';
    try{return new Date(ms).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit'})}catch(e){return ''}
  }
  function streakForDates(dateSet){
    let cur=0,best=0,run=0;
    const sorted=[...dateSet].sort();
    let prev=null;
    sorted.forEach(ds=>{
      const d=new Date(ds+'T00:00:00');
      if(prev && Math.round((d-prev)/86400000)===1) run++; else run=1;
      best=Math.max(best,run); prev=d;
    });
    const d=new Date(today()+'T00:00:00');
    while(dateSet.has(d.toISOString().slice(0,10))){cur++;d.setDate(d.getDate()-1)}
    return {current:cur,best};
  }
  function mutualStreak(rows){
    const [a,b]=names();
    const by={}; rows.forEach(r=>{if(r.date&&r.user)(by[r.date]=by[r.date]||new Set()).add(r.user)});
    const set=new Set(Object.entries(by).filter(([,s])=>s.has(a)&&s.has(b)).map(([d])=>d));
    return streakForDates(set).current;
  }

  function archiveShell(){
    const drawer=$('#archiveDrawer'), body=$('#archiveDrawerBody');
    if(!drawer||!body) return;
    drawer.classList.add('v3-full-drawer');
    const title=$('.archive-drawer-head h3',drawer); if(title) title.textContent='OUR DIARY · ARCHIVE';
    body.innerHTML=`
      <div class="v3-archive-tabs">
        ${[['today','TODAY'],['goto','GO TO'],['records','기록'],['notes','메모'],['comments','댓글'],['chats','♥ 카톡'],['questions','질문'],['thanks','THANKS'],['stats','통계']].map(([k,l])=>`<button data-v3-archive-tab="${k}" class="${archiveTab===k?'is-active':''}">${l}</button>`).join('')}
      </div>
      <div class="v3-archive-panel" id="v3ArchivePanel"></div>`;
    $$('[data-v3-archive-tab]',body).forEach(btn=>btn.addEventListener('click',()=>showArchiveTab(btn.dataset.v3ArchiveTab)));
    body.addEventListener('click',e=>{ if(e.target.closest('[data-action]')) setTimeout(closeArchive,0); });
    showArchiveTab(archiveTab);
  }

  function setArchiveActive(tab){
    archiveTab=tab;
    const drawer=$('#archiveDrawer');
    if(drawer) drawer.classList.toggle('v3-stats-wide',tab==='stats');
    $$('[data-v3-archive-tab]',$('#archiveDrawerBody')||document).forEach(b=>b.classList.toggle('is-active',b.dataset.v3ArchiveTab===tab));
  }

  function showArchiveTab(tab){
    clearArchiveSubs(); setArchiveActive(tab);
    const host=$('#v3ArchivePanel'); if(!host) return;
    host.innerHTML='<div class="empty-frame">불러오는 중…</div>';
    if(tab==='today') renderArchiveToday(host);
    else if(tab==='goto') renderArchiveGoTo(host);
    else if(tab==='records') renderArchiveRecords(host);
    else if(tab==='notes') renderArchiveNotes(host);
    else if(tab==='comments') renderArchiveComments(host);
    else if(tab==='chats') renderArchiveChats(host);
    else if(tab==='questions') renderArchiveQuestions(host);
    else if(tab==='thanks') renderArchiveThanks(host);
    else if(tab==='stats') renderArchiveStats(host);
  }

  function renderArchiveToday(host){
    const date=today(); let rec=[],grat=[],ans=[],allRec=[],allGrat=[];
    const draw=()=>{
      if(!host.isConnected) return;
      const [s,g]=names();
      const person=n=>{
        const r=rec.some(x=>x.user===n), gr=grat.some(x=>x.from===n), q=ans.some(x=>x.user===n);
        return `<div class="v3-today-person"><div class="v3-today-name">${esc(n)}</div><div class="v3-today-checks">
          <div class="v3-today-check ${r?'is-done':''}"><i></i>OUR DAY ${r?'✓':''}</div>
          <div class="v3-today-check ${gr?'is-done':''}"><i></i>THANK YOU ${gr?'✓':''}</div>
          <div class="v3-today-check ${q?'is-done':''}"><i></i>QUESTION ${q?'✓':''}</div>
        </div></div>`;
      };
      const mutual=mutualStreak(allRec);
      const flowers=Math.min(24,Math.ceil(allGrat.length/5));
      host.innerHTML=`
        <div class="v3-archive-kicker">TODAY · ${esc(date)}</div><div class="v3-archive-title">Today, us.</div>
        <div class="section-note">V1의 Today Hub와 V2의 실시간 Daily US 상태를 한곳에 모았어요.</div>
        <div class="v3-today-grid">${person(s)}${person(g)}</div>
        <div class="v3-today-actions"><button class="btn btn-sm" data-action="view" data-target="diary">✎ 오늘 기록하기</button><button class="btn btn-sm btn-outline" data-action="memory" data-date="${date}">오늘 카드 열기</button></div>
        <div class="v3-today-streak">🔥 ${mutual}일째 둘 다 OUR DAY 기록 중</div>
        <div class="v3-gratitude-garden">${flowers?'🌷'.repeat(flowers):'<span class="section-note">감사가 쌓이면 이 정원이 자라요.</span>'}</div>
        <div class="v3-gratitude-caption">THANK-YOU JAR · ${allGrat.length.toLocaleString()} thank-yous</div>`;
    };
    addSub(DB.onDailyRecordsForDate(date,r=>{rec=r;draw()}));
    addSub(DB.onGratitudeForDate(date,r=>{grat=r;draw()}));
    addSub(DB.onAnswersForDate(date,r=>{ans=r;draw()}));
    addSub(DB.onAllDailyRecords(r=>{allRec=r;draw()}));
    addSub(DB.onAllGratitude(r=>{allGrat=r;draw()}));
  }

  function renderArchiveGoTo(host){
    const links=[['home','HOME','오늘의 우리'],['ourdays','OUR DAYS','달력 · 리스트'],['diary','OUR DIARY','기록 · 감사 · 질문'],['ourstory','OUR STORY','챕터 타임라인'],['album','ALBUM','모든 실제 사진'],['future','OUR FUTURE','다음 계절의 우리']];
    host.innerHTML=`<div class="v3-archive-kicker">V2 QUICK NAVIGATION</div><div class="v3-archive-title">Go to</div>
      <div class="v3-archive-navgrid">${links.map(([k,t,s])=>`<button class="card card-btn" data-action="view" data-target="${k}"><div class="eyebrow">${t}</div><div class="section-note">${s}</div></button>`).join('')}</div>
      <div class="v3-archive-kicker">SPECIAL FEATURES</div>
      <div class="v3-archive-navgrid">${(window.SPECIAL_HUB||[]).map(x=>`<button class="card card-btn" data-action="special" data-target="${x.key}"><div class="eyebrow">${esc(x.t)}</div></button>`).join('')}</div>`;
  }

  function renderArchiveRecords(host){
    addSub(DB.onAllDailyRecords(rows=>{
      if(!host.isConnected)return;
      rows=[...rows].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      host.innerHTML=`<div class="v3-archive-kicker">LIVING DIARY</div><div class="v3-archive-title">기록</div>${rows.length?rows.map(r=>`<button class="v3-archive-item" data-action="memory" data-date="${esc(r.date)}"><div class="meta">${esc(r.date)} · ${esc(r.user)}</div><div class="text">${esc(r.mood||'감정 미선택')}${r.line?` · ${esc(r.line)}`:''}</div><div class="v3-archive-tags">${(r.activities||[]).map(a=>`<span class="v3-archive-tag">${esc(a)}</span>`).join('')}</div></button>`).join(''):'<div class="empty-frame">아직 저장한 하루 기록이 없어요.</div>'}`;
    }));
  }

  function renderArchiveNotes(host){
    addSub(DB.onAllNotes(rows=>{
      if(!host.isConnected)return;
      rows=rows.filter(r=>r.text&&r.text.trim()).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      host.innerHTML=`<div class="v3-archive-kicker">MEMOS</div><div class="v3-archive-title">메모</div>${rows.length?rows.map(r=>`<button class="v3-archive-item" data-action="memory" data-date="${esc(r.date)}"><div class="meta">${esc(r.date)}</div><div class="text">${esc(r.text)}</div></button>`).join(''):'<div class="empty-frame">저장된 메모가 없어요.</div>'}`;
    }));
  }

  function renderArchiveComments(host){
    const db=rawDb();
    if(!db){host.innerHTML='<div class="empty-frame">Firebase 연결이 필요해요.</div>';return;}
    const unsub=db.collection('comments').orderBy('createdAt','desc').limit(120).onSnapshot(snap=>{
      if(!host.isConnected)return;
      const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
      const mine=currentName();
      host.innerHTML=`<div class="v3-archive-kicker">COMMENTS</div><div class="v3-archive-title">댓글</div>${rows.length?rows.map(r=>`<div class="v3-archive-item" data-comment-date="${esc(r.date||'')}">${r.author===mine?`<button class="v3-archive-delete" data-v3-delete-comment="${r.id}">삭제</button>`:''}<div class="meta">${esc(r.author||'')} · ${esc(r.date||'')} · ${esc(fmtTime(r))}</div><div class="text">${esc(r.text||'')}</div></div>`).join(''):'<div class="empty-frame">저장된 댓글이 없어요.</div>'}`;
      $$('[data-v3-delete-comment]',host).forEach(btn=>btn.addEventListener('click',async e=>{e.stopPropagation();await db.collection('comments').doc(btn.dataset.v3DeleteComment).delete();Router.toast('댓글을 삭제했어요')}));
      $$('[data-comment-date]',host).forEach(el=>el.addEventListener('click',()=>{const d=el.dataset.commentDate;if(d){closeArchive();Router.openMemory(d)}}));
    },()=>{host.innerHTML='<div class="empty-frame">댓글을 불러오지 못했어요.</div>'});
    addSub(unsub);
  }

  function renderArchiveChats(host){
    let rows=[], filter='best', q='';
    const draw=()=>{
      if(!host.isConnected)return;
      let list=rows;
      if(filter==='best')list=list.filter(x=>x.best);
      else if(filter!=='all')list=list.filter(x=>x.speaker===filter);
      if(q)list=list.filter(x=>[x.text,x.speaker,x.date].join(' ').toLowerCase().includes(q.toLowerCase()));
      host.innerHTML=`<div class="v3-archive-kicker">LIKED KAKAO</div><div class="v3-archive-title">♥ 카톡</div>
        <input class="field v3-archive-search" id="v3ChatSearch" placeholder="저장 카톡 검색…" value="${esc(q)}">
        <div class="v3-archive-filterrow">${[['best','★ BEST'],['all','전체'],[display('sihyun'),display('sihyun')],[display('gangwon'),display('gangwon')]].map(([k,l])=>`<button data-v3-chat-filter="${esc(k)}" class="${filter===k?'is-active':''}">${esc(l)}</button>`).join('')}</div>
        ${list.length?list.map(r=>`<button class="v3-archive-item" data-action="memory" data-date="${esc(r.date)}"><div class="meta">${esc(r.date||'')} · ${esc(r.speaker||'')} ${r.best?'· ★ BEST':''}</div><div class="text">${esc(r.text||'')}</div></button>`).join(''):'<div class="empty-frame">조건에 맞는 저장 카톡이 없어요.</div>'}`;
      $('#v3ChatSearch',host)?.addEventListener('input',e=>{q=e.target.value;draw()});
      $$('[data-v3-chat-filter]',host).forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.v3ChatFilter;draw()}));
    };
    addSub(DB.onAllChatLikes(r=>{rows=[...r].sort((a,b)=>(b.date||'').localeCompare(a.date||''));draw()}));
  }

  function renderArchiveQuestions(host){
    addSub(DB.onAllAnswers(rows=>{
      if(!host.isConnected)return;
      const [s,g]=names(); const by={};
      rows.forEach(r=>{if(r.date)(by[r.date]=by[r.date]||{})[r.user]=r});
      const dates=Object.keys(by).sort((a,b)=>b.localeCompare(a));
      host.innerHTML=`<div class="v3-archive-kicker">TODAY'S QUESTION</div><div class="v3-archive-title">질문</div>${dates.length?dates.map(date=>{
        const pair=by[date],a=pair[s],b=pair[g],qi=(a||b)?.questionIndex||0,q=(window.QUESTIONS||[])[qi]||'';
        return `<button class="v3-archive-item" data-action="memory" data-date="${date}"><div class="meta">${date} · QUESTION #${String(qi+1).padStart(2,'0')} ${a&&b?'· 둘 다 답함 ✓':'· 답변 기다리는 중'}</div><div class="text"><b>${esc(q)}</b></div><div class="v3-archive-tags"><span class="v3-archive-tag">${esc(s)} ${a?'✓':'🔒'}</span><span class="v3-archive-tag">${esc(g)} ${b?'✓':'🔒'}</span></div>${a&&b?`<div class="text" style="margin-top:9px;border-top:1px dashed var(--line);padding-top:8px"><span class="meta">${esc(s)}</span>${esc(a.text)}<br><br><span class="meta">${esc(g)}</span>${esc(b.text)}</div>`:''}</button>`;
      }).join(''):'<div class="empty-frame">아직 답한 질문이 없어요.</div>'}`;
    }));
  }

  function renderArchiveThanks(host){
    let rows=[],q='';
    const draw=()=>{
      if(!host.isConnected)return;
      const list=q?rows.filter(r=>(r.text||'').includes(q)||(r.from||'').includes(q)||(r.date||'').includes(q)):rows;
      host.innerHTML=`<div class="v3-archive-kicker">THANK-YOU JAR</div><div class="v3-archive-title">THANKS</div><div class="section-note">실제 카톡 속 감사는 SPECIAL → 고마워, 우리의 카톡에서 따로 보존돼요.</div><input class="field v3-archive-search" id="v3ThanksDrawerSearch" placeholder="감사 검색…" value="${esc(q)}">${list.length?list.map(r=>`<button class="v3-archive-item" data-action="memory" data-date="${esc(r.date)}"><div class="meta">${esc(r.date)} · FROM ${esc(r.from)}</div><div class="text">${esc(r.text)}</div></button>`).join(''):'<div class="empty-frame">아직 저장된 감사가 없어요.</div>'}`;
      $('#v3ThanksDrawerSearch',host)?.addEventListener('input',e=>{q=e.target.value;draw()});
    };
    addSub(DB.onAllGratitude(r=>{rows=r.filter(x=>x.text&&x.text.trim()).sort((a,b)=>(b.date||'').localeCompare(a.date||''));draw()}));
  }

  function renderArchiveStats(host){
    addSub(DB.onAllDailyRecords(rows=>{
      if(!host.isConnected)return;
      const [s,g]=names();
      const sd=new Set(rows.filter(r=>r.user===s).map(r=>r.date)), gd=new Set(rows.filter(r=>r.user===g).map(r=>r.date));
      const ss=streakForDates(sd),gs=streakForDates(gd);
      const mood={},act={}; rows.forEach(r=>{if(r.mood)mood[r.mood]=(mood[r.mood]||0)+1;(r.activities||[]).forEach(a=>act[a]=(act[a]||0)+1)});
      const topMood=Object.entries(mood).sort((a,b)=>b[1]-a[1]).slice(0,6), topAct=Object.entries(act).sort((a,b)=>b[1]-a[1]).slice(0,6); const maxAct=Math.max(1,...topAct.map(x=>x[1]));
      const by={}; rows.forEach(r=>{if(r.date)(by[r.date]=by[r.date]||new Set()).add(r.user)});
      const heat=[]; const d=new Date(today()+'T00:00:00'); d.setDate(d.getDate()-29); for(let i=0;i<30;i++){const k=d.toISOString().slice(0,10);heat.push([k,by[k]?.size||0]);d.setDate(d.getDate()+1)}
      host.innerHTML=`<div class="v3-archive-kicker">VISUAL STATS</div><div class="v3-archive-title">우리 기록 통계</div><div class="v3-stats-grid">
        <div class="v3-stat-card"><div class="v3-stat-title">RECORDING STREAK</div><div class="v3-stat-pairs"><div class="v3-stat-mini"><b>${ss.current}</b><span>${esc(s)} 현재 연속 · best ${ss.best}</span></div><div class="v3-stat-mini"><b>${gs.current}</b><span>${esc(g)} 현재 연속 · best ${gs.best}</span></div></div></div>
        <div class="v3-stat-card"><div class="v3-stat-title">TOTAL ARCHIVE</div><div class="v3-stat-pairs"><div class="v3-stat-mini"><b>${sd.size}</b><span>${esc(s)} 기록일</span></div><div class="v3-stat-mini"><b>${gd.size}</b><span>${esc(g)} 기록일</span></div></div></div>
        <div class="v3-stat-card"><div class="v3-stat-title">OUR MOOD MIX</div>${topMood.length?topMood.map(([m,n])=>`<div class="v3-stat-bar"><span>${esc(m)}</span><div class="v3-stat-track"><div class="v3-stat-fill" style="width:${n/Math.max(1,topMood[0][1])*100}%"></div></div><b>${n}</b></div>`).join(''):'<div class="section-note">기록이 쌓이면 보여요.</div>'}</div>
        <div class="v3-stat-card"><div class="v3-stat-title">FAVORITE DATE TYPES</div>${topAct.length?topAct.map(([a,n])=>`<div class="v3-stat-bar"><span>${esc(a)}</span><div class="v3-stat-track"><div class="v3-stat-fill" style="width:${n/maxAct*100}%"></div></div><b>${n}</b></div>`).join(''):'<div class="section-note">활동 기록이 없어요.</div>'}</div>
        <div class="v3-stat-card full"><div class="v3-stat-title">LAST 30 DAYS · 둘이 기록한 날</div><div class="v3-heatmap">${heat.map(([k,c])=>`<div class="v3-heat ${c===1?'one':c>=2?'two':''}" title="${k} · ${c}명 기록"></div>`).join('')}</div><div class="section-note" style="margin-top:8px">연한 칸 = 한 명 · 진한 칸 = 둘 다 기록.</div><div style="margin-top:12px"><button class="btn btn-sm btn-outline" data-action="special" data-target="stats">SPECIAL의 전체 통계 열기 →</button></div></div>
      </div>`;
    }));
  }

  function installArchiveOverride(){
    if(!window.RouterActions||typeof RouterActions['toggle-archive']!=='function') return;
    if(RouterActions['toggle-archive']._v3Full) return;
    const base=RouterActions['toggle-archive'];
    const wrapped=function(el,e){
      base(el,e);
      const drawer=$('#archiveDrawer');
      if(drawer?.classList.contains('is-open')) archiveShell(); else clearArchiveSubs();
    };
    wrapped._v3Full=true; RouterActions['toggle-archive']=wrapped;
  }

  /* 3) V1 NEXT 300 DAYS + final V1 promise copy inside V2 Future */
  const NEXT300_SEEDS=['MoMA 다시 가기','Tokyo','Aurora 보러 가기','같이 장보기','크리스마스 트리 같이 꾸미기','평범한 날도 함께','한적한 바다','우리만의 비밀 카페','재즈바','운동 데이트','타임캡슐'];
  const PROMISE_SEEDS=['다투더라도 끝까지 대화하고 서로 맞춰가기','하루의 시작과 끝을 가능한 자주 함께 보내기','서로의 손을 쉽게 놓지 않기','불필요한 설명 없이도 편안한 사이로 남기','예쁘게 연애하다가 나중에 꼭 결혼하기'];
  let next300Unsub=null;
  function clearNext300(){try{next300Unsub&&next300Unsub()}catch(e){} next300Unsub=null}

  function renderNext300(panel){
    if(!panel)return; clearNext300();
    panel.innerHTML=`<div class="v3-next300-intro"><div class="v3-next300-note"><div class="v3-archive-kicker">NEXT 300 DAYS</div><h3>다음 계절에도, 그 다음 계절에도.</h3><p>거창한 계획보다 같이 해보고 싶은 평범한 일들을 모아두는 페이지. 해낸 날에는 WE DID IT 도장을 찍어요.</p></div><div class="v3-next300-ticket"><div class="v3-archive-kicker">THINGS WE WANT TO REMEMBER TO DO</div><p>평범한 날도 함께 · 한적한 바다 · 우리만의 비밀 카페 · 재즈바 · 운동 데이트 · 타임캡슐</p></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><input class="field" id="v3Next300Input" placeholder="다음 300일에 같이 하고 싶은 것" style="flex:1"><button class="btn btn-sm" id="v3Next300Add">추가</button></div>
      <div class="v3-seed-cloud">${NEXT300_SEEDS.map(s=>`<button data-v3-next-seed="${esc(s)}">+ ${esc(s)}</button>`).join('')}</div><div id="v3Next300List" class="v3-next300-list"></div>`;
    const add=async text=>{text=(text||'').trim();if(!text)return;await DB.addBucketItem({type:'next300',text,done:false,author:currentName()});const inp=$('#v3Next300Input',panel);if(inp)inp.value=''};
    $('#v3Next300Add',panel)?.addEventListener('click',()=>add($('#v3Next300Input',panel)?.value));
    $('#v3Next300Input',panel)?.addEventListener('keydown',e=>{if(e.key==='Enter')add(e.target.value)});
    $$('[data-v3-next-seed]',panel).forEach(b=>b.addEventListener('click',()=>add(b.dataset.v3NextSeed)));
    next300Unsub=DB.onBucketItems(rows=>{
      const host=$('#v3Next300List',panel);if(!host)return;
      const items=rows.filter(r=>r.type==='next300');
      host.innerHTML=items.length?items.map(it=>`<div class="v3-next300-item ${it.done?'is-done':''}"><input type="checkbox" data-v3-next-toggle="${it.id}" ${it.done?'checked':''}><div class="copy">${esc(it.text)}</div>${it.done?'<span class="stamp">WE DID IT</span>':''}<button class="icon-btn" data-v3-next-del="${it.id}" style="width:30px;height:30px">✕</button></div>`).join(''):'<div class="empty-frame">아직 적어둔 일이 없어요. 위의 작은 아이디어부터 하나 골라도 좋아요.</div>';
      $$('[data-v3-next-toggle]',host).forEach(c=>c.addEventListener('change',()=>{DB.updateBucketItem(c.dataset.v3NextToggle,{done:c.checked});if(c.checked&&window.V2Anim)V2Anim.sparkleAt(c.closest('.v3-next300-item'),6)}));
      $$('[data-v3-next-del]',host).forEach(b=>b.addEventListener('click',()=>DB.deleteBucketItem(b.dataset.v3NextDel)));
    });
  }

  function enhanceFutureFull(view){
    const tabs=$('.future-tabs',view);if(!tabs)return;
    if(!tabs.querySelector('[data-target="v3next300"]')){
      tabs.insertAdjacentHTML('afterbegin','<button data-action="tab" data-group="future" data-target="v3next300" data-tabbtn="future">NEXT 300 DAYS</button>');
      const firstPanel=view.querySelector('[data-tabpanel="future"]');
      const panel=document.createElement('div');panel.className='tab-panel';panel.dataset.tabpanel='future';panel.dataset.panel='v3next300';
      if(firstPanel)firstPanel.parentNode.insertBefore(panel,firstPanel);else tabs.insertAdjacentElement('afterend',panel);
      renderNext300(panel);
    }
    const promisePanel=view.querySelector('[data-panel="promises"]');
    if(promisePanel&&!promisePanel.querySelector('.v3-promise-note')){
      const seeds=promisePanel.querySelector('#prSeeds');
      const note=document.createElement('div');note.className='v3-promise-note';note.innerHTML='<b>V1 · OUR SMALL PROMISES</b><br>다투더라도 끝까지 대화하고 서로 맞춰가기 · 하루의 시작과 끝을 가능한 자주 함께 보내기 · 서로의 손을 쉽게 놓지 않기 · 불필요한 설명 없이도 편안한 사이로 남기 · 예쁘게 연애하다가 나중에 꼭 결혼하기';
      if(seeds)seeds.insertAdjacentElement('afterend',note);else promisePanel.prepend(note);
      const cloud=document.createElement('div');cloud.className='v3-seed-cloud';cloud.innerHTML=PROMISE_SEEDS.map(s=>`<button data-v3-promise-seed="${esc(s)}">+ ${esc(s)}</button>`).join('');note.insertAdjacentElement('afterend',cloud);
      $$('[data-v3-promise-seed]',cloud).forEach(b=>b.addEventListener('click',()=>DB.addBucketItem({type:'promises',text:b.dataset.v3PromiseSeed,done:false,author:currentName()})));
    }
  }

  function observeFuture(){
    const view=$('#view-future');if(!view)return;
    let queued=false;
    const run=()=>{queued=false;try{enhanceFutureFull(view)}catch(e){console.warn('[V3 full future]',e)}};
    new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(run)}).observe(view,{childList:true,subtree:true});
    run();
  }

  installSearchFab();
  installArchiveOverride();
  observeFuture();
  window.addEventListener('hashchange',()=>{ if(!location.hash.includes('/view/future')) clearNext300(); });
})();
