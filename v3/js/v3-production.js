/* Final production behavior fixes */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>window.escapeHtml?escapeHtml(s):String(s==null?'':s);
  const me=()=>{try{return Identity.displayName(Identity.current())}catch(e){return ''}};
  const rawDb=()=>{try{return window.firebase&&firebase.firestore?firebase.firestore():null}catch(e){return null}};

  function cleanVisibleTechCopy(){
    const replacements=[
      ['V1 + V2 · COMPLETE PHOTO ARCHIVE','OUR DIGITAL PHOTOBOOK'],
      ['V1 · OUR SMALL PROMISES','OUR SMALL PROMISES'],
      ['V2 QUICK NAVIGATION','QUICK NAVIGATION'],
      ['FILM STRIP · V1','FILM STRIP'],
      ['FILM VIEWER · V2','FILM VIEWER'],
      ['V3 · V2 engine, V1 memories restored',''],
    ];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let n;while((n=walker.nextNode())){
      let t=n.nodeValue||'',next=t;
      replacements.forEach(([a,b])=>{next=next.split(a).join(b)});
      if(next!==t)n.nodeValue=next;
    }
    const note=$('.v3-photo-sync-note');
    if(note)note.innerHTML='<b>공유 앨범</b> · 여기 올린 사진은 같은 링크에서 시현과 강원이 함께 볼 수 있어요. 이 기기에만 저장되는 사진첩이 아닙니다.';
  }

  /* Food archive is re-registered with safe card markup (no nested buttons). */
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
  const foodKey=x=>[x.date||'',x.food||'',x.place||''].join('|').toLowerCase();
  const subHeader=(title,sub)=>`<button class="btn btn-sm btn-outline" data-action="special-back">← SPECIAL</button><div class="section-head" style="margin-top:14px"><div class="section-title">${esc(title)}</div>${sub?`<div class="section-note">${esc(sub)}</div>`:''}</div>`;

  Router.registerSpecial('food',{render(host){
    host.innerHTML=subHeader('OUR LOVE LANGUAGE WAS “밥 먹자”')+`<div class="v3-food-head"><div class="v3-food-note"><h2>It started with lunch.</h2><p>첫 학식부터 생일 Hotpot, Raku, 국밥, 즉떡까지. 사진에 음식 태그를 달면 이곳에도 자동으로 모이고, 기억나는 메뉴와 맛집은 직접 더할 수 있어요.</p></div><div class="v3-food-add"><div class="v3-food-form"><input class="field" id="v3FoodName" placeholder="메뉴 / 맛집"><input class="field" id="v3FoodPlace" placeholder="장소"><input class="field" type="date" id="v3FoodDate"><button class="btn btn-sm" id="v3FoodAdd">추가</button></div></div></div><div id="v3FoodGrid" class="v3-food-grid"></div>`;
    let photos=[],custom=[];const db=rawDb();
    const draw=()=>{
      if(!host.isConnected)return;
      const fromPhotos=photos.filter(p=>p.food).map(p=>({icon:'🍽',food:p.food,place:p.place||'',date:p.date,source:'PHOTO'}));
      const all=[],seen=new Set();
      FOOD_SEEDS.concat(fromPhotos,custom.map(x=>({...x,icon:'🍴',source:'ADDED'}))).forEach(x=>{const k=foodKey(x);if(!seen.has(k)){seen.add(k);all.push(x)}});
      const grid=$('#v3FoodGrid',host);if(!grid)return;
      grid.innerHTML=all.map(x=>`<div class="v3-food-card" ${x.date?`data-action="memory" data-date="${x.date}"`:''}>${x.source?`<span class="source">${esc(x.source)}</span>`:''}<div class="icon">${x.icon||'🍽'}</div><h3>${esc(x.food)}</h3><div class="meta">${esc(x.place||'')}${x.date?` · ${x.date}`:''}</div>${x.id?`<button class="v3-food-delete" data-food-del="${x.id}">삭제</button>`:''}</div>`).join('');
      $$('[data-food-del]',grid).forEach(b=>b.onclick=async e=>{e.stopPropagation();if(db)await db.collection('foodMemories').doc(b.dataset.foodDel).delete()});
    };
    let offPhotos=DB.onAllPhotos(r=>{photos=r||[];draw()}),offCustom=null;
    if(db)offCustom=db.collection('foodMemories').orderBy('createdAt','desc').onSnapshot(s=>{custom=s.docs.map(d=>({id:d.id,...d.data()}));draw()},draw);
    $('#v3FoodAdd',host).onclick=async()=>{
      const food=$('#v3FoodName',host).value.trim(),place=$('#v3FoodPlace',host).value.trim(),date=$('#v3FoodDate',host).value;
      if(!food){Router.toast('메뉴나 맛집 이름을 적어주세요');return}
      if(!db){Router.toast('공유 저장소 연결을 확인해주세요');return}
      await db.collection('foodMemories').add({food,place,date,author:me(),createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      $('#v3FoodName',host).value='';$('#v3FoodPlace',host).value='';$('#v3FoodDate',host).value='';Router.toast('먹은 기억을 추가했어요');
    };
    const stop=setInterval(()=>{if(!host.isConnected){clearInterval(stop);try{offPhotos&&offPhotos()}catch(e){}try{offCustom&&offCustom()}catch(e){}}},1500);
  }});

  let queued=false;
  const run=()=>{queued=false;cleanVisibleTechCopy()};
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true});
  run();
})();
