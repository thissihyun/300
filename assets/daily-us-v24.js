/* 300 DAYS WITH YOU — V24 DAILY US / OUR DIARY EXPERIENCE */
(function(){
  'use strict';

  const ICONS = {
    today:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h16v14H4z"/><path d="M8 3v5M16 3v5M4 10h16"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></svg>`,
    days:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M6 7h8a4 4 0 0 1 0 8H6"/><path d="M10 11h4"/></svg>`,
    heart:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/></svg>`,
    question:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.1 9a3 3 0 1 1 5.2 2c-1.2 1.2-2.3 1.6-2.3 3"/><path d="M12 18h.01"/><circle cx="12" cy="12" r="9"/></svg>`,
    archive:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16v13H4z"/><path d="M3 4h18v3H3zM9 11h6"/></svg>`,
    pen:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m13.8 7.2 3 3"/></svg>`,
    bell:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`,
    sparkle:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3Z"/><path d="m19 15 .6 2.1 1.9.9-1.9 1-.6 2-.6-2-1.9-1 1.9-.9L19 15ZM5 2l.5 1.7L7 4.5l-1.5.8L5 7l-.5-1.7L3 4.5l1.5-.8L5 2Z"/></svg>`
  };

  const CSS = `
  :root{--v24-card:#fffdf8;--v24-cream:#fbf6ea;--v24-soft:#f2eadb;--v24-rose:#b25c61;--v24-ink:#332b22;--v24-muted:#786c5e;}
  #v10ArchiveDrawer{width:min(470px,96vw);background:linear-gradient(180deg,#fbf7ed 0%,#f5ede0 100%);box-shadow:-18px 0 55px rgba(49,38,28,.22);}
  .v10-drawer-head{padding:20px 20px 13px!important;align-items:flex-start!important;background:rgba(255,253,248,.72);backdrop-filter:blur(16px);position:sticky;top:0;z-index:5;}
  .v10-drawer-head h3{font-size:24px!important;letter-spacing:-.02em;line-height:1.05;}
  .v24-diary-sub{font:11px/1.4 'Cormorant Garamond','Nanum Myeongjo',serif;color:var(--ink-soft);font-style:italic;margin-top:4px;letter-spacing:.05em;}
  .v10-drawer-head button{width:40px;height:40px;border-radius:50%!important;display:grid;place-items:center;background:#fffdf8!important;border:1px solid var(--line)!important;color:var(--ink)!important;transition:.2s;}
  .v10-drawer-head button:active{transform:scale(.92)}
  .v10-drawer-tabs{padding:9px 12px 10px!important;gap:4px!important;background:rgba(255,253,248,.78);backdrop-filter:blur(12px);position:sticky;top:74px;z-index:4;scrollbar-width:none;}
  .v10-drawer-tabs::-webkit-scrollbar{display:none}
  .v10-drawer-tabs button{display:flex;align-items:center;justify-content:center;gap:5px;min-height:38px;padding:6px 10px!important;font-size:10.5px!important;border:none!important;background:transparent!important;color:var(--ink-soft)!important;transition:.2s!important;}
  .v10-drawer-tabs button svg{width:15px;height:15px;flex:none}
  .v10-drawer-tabs button.active{background:var(--ink)!important;color:#fff!important;box-shadow:0 7px 18px rgba(51,43,34,.13);}
  .v10-drawer-body{padding:15px 16px 34px!important;}

  .v24-today{display:flex;flex-direction:column;gap:12px;padding-bottom:18px;}
  .v24-kicker{font:700 10px/1.2 'Gaegu','Nanum Myeongjo',sans-serif;letter-spacing:.14em;color:var(--rose-deep);text-transform:uppercase;}
  .v24-date-title{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:4px 2px 0;}
  .v24-date-title h4{font:italic 600 23px/1.05 'Playfair Display','Nanum Myeongjo',serif;margin:2px 0;color:var(--ink);}
  .v24-day-pill{font:11px/1 'Cormorant Garamond','Nanum Myeongjo',serif;border:1px solid var(--line);border-radius:999px;padding:7px 10px;color:var(--clay);background:rgba(255,255,255,.7);white-space:nowrap;}

  .v24-progress-card{position:relative;overflow:hidden;background:linear-gradient(135deg,#fffdf8,#f8efe4);border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:0 12px 28px rgba(51,43,34,.08);}
  .v24-progress-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px;}
  .v24-progress-head strong{font:600 15px/1.2 'Nanum Myeongjo',serif;}
  .v24-progress-head span{font:11px/1.2 'Cormorant Garamond','Nanum Myeongjo',serif;color:var(--ink-soft)}
  .v24-progress-track{height:8px;background:#eadfce;border-radius:999px;overflow:hidden;}
  .v24-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#b25c61,#c99086,#b8923f);transition:width .55s cubic-bezier(.22,.9,.25,1);box-shadow:0 0 12px rgba(178,92,97,.26);}
  .v24-couple-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;}
  .v24-person{background:rgba(255,255,255,.66);border:1px solid rgba(217,203,176,.8);border-radius:13px;padding:10px;}
  .v24-person-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;font:700 11px/1 'Gaegu','Nanum Myeongjo',sans-serif;color:var(--ink)}
  .v24-dotrow{display:flex;gap:5px;align-items:center;}
  .v24-dot{width:8px;height:8px;border-radius:50%;background:#ddd1bf;box-shadow:inset 0 0 0 1px rgba(0,0,0,.03)}
  .v24-dot.done{background:var(--rose);box-shadow:0 0 0 3px rgba(178,92,97,.11)}
  .v24-person small{display:block;color:var(--ink-soft);font:10px/1.35 'Cormorant Garamond','Nanum Myeongjo',serif;}

  .v24-card{background:rgba(255,253,248,.92);border:1px solid var(--line);border-radius:18px;padding:15px;box-shadow:0 10px 24px rgba(51,43,34,.07);position:relative;overflow:hidden;}
  .v24-card::after{content:"";position:absolute;inset:auto -35px -55px auto;width:105px;height:105px;border-radius:50%;background:radial-gradient(circle,rgba(178,92,97,.06),transparent 66%);pointer-events:none;}
  .v24-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}
  .v24-card-title{display:flex;align-items:center;gap:8px;}
  .v24-icon{width:31px;height:31px;border-radius:10px;display:grid;place-items:center;background:#f6eadf;color:var(--rose-deep);flex:none;}
  .v24-icon svg{width:17px;height:17px}
  .v24-card-title b{font:700 12px/1.2 'Gaegu','Nanum Myeongjo',sans-serif;color:var(--ink)}
  .v24-card-title span{display:block;font:10.5px/1.3 'Cormorant Garamond','Nanum Myeongjo',serif;color:var(--ink-soft);margin-top:2px;}
  .v24-state{font:700 9px/1 'Gaegu','Nanum Myeongjo',sans-serif;padding:5px 8px;border-radius:999px;background:#eee5d6;color:var(--ink-soft);white-space:nowrap;}
  .v24-state.done{background:#edf0e7;color:#657154}.v24-state.wait{background:#f8e9e6;color:#9a5b60}
  .v24-inline-users{display:flex;gap:6px;margin:4px 0 10px;}
  .v24-userbtn{flex:1;border:1px solid var(--line);background:#fff;border-radius:12px;min-height:38px;font:700 11px/1 'Gaegu','Nanum Myeongjo',sans-serif;color:var(--ink-soft);cursor:pointer;}
  .v24-userbtn.active{background:var(--ink);color:#fff;border-color:var(--ink);}
  .v24-textarea{width:100%;min-height:74px;resize:vertical;border:1px solid #dfd2bd;border-radius:13px;background:#fffefb;padding:11px 12px;color:var(--ink);font:13px/1.55 'Nanum Myeongjo',serif;outline:none;transition:.2s;}
  .v24-textarea:focus{border-color:var(--rose);box-shadow:0 0 0 3px rgba(178,92,97,.1)}
  .v24-line-input{width:100%;border:1px solid #dfd2bd;border-radius:12px;background:#fffefb;padding:10px 12px;color:var(--ink);font:12.5px/1.4 'Nanum Myeongjo',serif;outline:none;}
  .v24-help{display:flex;justify-content:space-between;gap:10px;align-items:center;color:var(--ink-soft);font:10.5px/1.4 'Cormorant Garamond','Nanum Myeongjo',serif;margin-top:6px;}
  .v24-help .saved{color:#6d785c;font-weight:600}
  .v24-action-row{display:flex;gap:8px;margin-top:10px;}
  .v24-btn{border:0;border-radius:12px;min-height:42px;padding:0 13px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font:700 11px/1 'Gaegu','Nanum Myeongjo',sans-serif;cursor:pointer;transition:.18s;}
  .v24-btn svg{width:15px;height:15px}.v24-btn:active{transform:scale(.96)}
  .v24-btn.primary{background:var(--rose);color:#fff;box-shadow:0 7px 16px rgba(178,92,97,.18)}
  .v24-btn.secondary{background:#fff;color:var(--ink);border:1px solid var(--line)}
  .v24-btn.ghost{background:#f6f0e6;color:var(--ink-soft)}

  .v24-lock{background:#f8f0e1;border:1px dashed #c9a96a;border-radius:13px;padding:12px;text-align:center;color:#826b3d;font:12px/1.5 'Nanum Myeongjo',serif;margin-top:10px;}
  .v24-lock small{display:block;font:10.5px/1.4 'Cormorant Garamond','Nanum Myeongjo',serif;margin-top:3px;opacity:.8}
  .v24-reveal{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;}
  .v24-letter{background:#fff;border:1px solid var(--line);border-radius:13px;padding:11px;box-shadow:0 5px 14px rgba(51,43,34,.05);animation:v24LetterIn .45s cubic-bezier(.22,.9,.25,1) both;}
  .v24-letter:nth-child(2){animation-delay:.12s}.v24-letter .from{font:700 9px/1 'Gaegu','Nanum Myeongjo',sans-serif;color:var(--rose-deep);letter-spacing:.05em;margin-bottom:5px}.v24-letter .txt{font:11.5px/1.55 'Nanum Myeongjo',serif;white-space:pre-wrap;}
  @keyframes v24LetterIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}

  .v24-jar-wrap{display:grid;grid-template-columns:92px 1fr;gap:14px;align-items:center;}
  .v24-jar{width:82px;height:92px;margin:auto;position:relative;border:2px solid rgba(112,92,65,.28);border-top-width:7px;border-radius:9px 9px 25px 25px;background:linear-gradient(120deg,rgba(255,255,255,.72),rgba(255,255,255,.2));box-shadow:inset 11px 0 16px rgba(255,255,255,.55),0 8px 18px rgba(51,43,34,.08);overflow:hidden;}
  .v24-jar::before{content:"";position:absolute;left:10px;top:8px;width:8px;height:60px;border-radius:999px;background:rgba(255,255,255,.58);transform:rotate(5deg)}
  .v24-stars{position:absolute;inset:15px 7px 7px;display:flex;align-content:flex-end;align-items:flex-end;justify-content:center;gap:2px;flex-wrap:wrap;transform:rotate(-1deg)}
  .v24-star{font-size:10px;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.08));animation:v24StarDrop .45s cubic-bezier(.2,1.3,.4,1) both;}
  @keyframes v24StarDrop{from{opacity:0;transform:translateY(-22px) rotate(-20deg)}to{opacity:1;transform:none}}
  .v24-jar-copy strong{display:block;font:italic 600 20px/1.1 'Playfair Display','Nanum Myeongjo',serif;color:var(--ink)}
  .v24-jar-copy p{margin:5px 0 9px;font:11px/1.45 'Nanum Myeongjo',serif;color:var(--ink-soft)}
  .v24-milestone{display:inline-flex;align-items:center;gap:5px;border-radius:999px;background:#f4ead5;border:1px solid #d8bf87;color:#7b6537;padding:5px 8px;font:700 9px/1 'Gaegu','Nanum Myeongjo',sans-serif;}
  .v24-milestone svg{width:12px;height:12px}

  .v24-reminder{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px dashed var(--line);margin-top:12px;padding-top:11px;}
  .v24-reminder-copy{display:flex;align-items:center;gap:8px;font:10.5px/1.35 'Nanum Myeongjo',serif;color:var(--ink-soft)}.v24-reminder-copy svg{width:16px;height:16px;color:var(--gold);}
  .v24-time{border:1px solid var(--line);background:#fff;border-radius:9px;padding:6px 7px;font-size:11px;color:var(--ink);}
  .v24-toggle{border:0;background:var(--ink);color:#fff;border-radius:999px;padding:7px 10px;font:700 9px/1 'Gaegu','Nanum Myeongjo',sans-serif;cursor:pointer;}
  .v24-toggle.on{background:var(--sage)}

  .v24-archive-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
  .v24-archive-card{border:1px solid var(--line);background:#fffdf8;border-radius:15px;padding:14px 12px;text-align:left;cursor:pointer;min-height:104px;transition:.2s;box-shadow:0 7px 18px rgba(51,43,34,.05);}
  .v24-archive-card:hover{transform:translateY(-2px);border-color:var(--rose)}.v24-archive-card:active{transform:scale(.97)}
  .v24-archive-card .ico{width:30px;height:30px;border-radius:10px;background:#f6eadf;color:var(--rose);display:grid;place-items:center;margin-bottom:10px}.v24-archive-card .ico svg{width:16px;height:16px}.v24-archive-card b{display:block;font:700 12px/1.2 'Gaegu','Nanum Myeongjo',sans-serif}.v24-archive-card span{display:block;font:10.5px/1.4 'Cormorant Garamond','Nanum Myeongjo',serif;color:var(--ink-soft);margin-top:3px}

  .v24-home{background:linear-gradient(135deg,rgba(255,253,248,.9),rgba(247,236,225,.9));border:1px solid var(--line);border-radius:17px;padding:14px 15px;box-shadow:0 10px 26px rgba(51,43,34,.08);position:relative;overflow:hidden;}
  .v24-home::after{content:"♡";position:absolute;right:-2px;top:-19px;font:70px/1 'Playfair Display',serif;color:rgba(178,92,97,.055);transform:rotate(12deg)}
  .v24-home-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.v24-home-kicker{font:700 9.5px/1 'Gaegu','Nanum Myeongjo',sans-serif;color:var(--rose-deep);letter-spacing:.11em}.v24-home-date{font:10px/1 'Cormorant Garamond','Nanum Myeongjo',serif;color:var(--ink-soft)}
  .v24-home-main{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:8px}.v24-home-main strong{font:italic 600 17px/1.2 'Playfair Display','Nanum Myeongjo',serif}.v24-home-main button{border:0;background:var(--ink);color:#fff;border-radius:999px;padding:8px 11px;font:700 9px/1 'Gaegu','Nanum Myeongjo',sans-serif;cursor:pointer;z-index:1}.v24-home-sub{font:11px/1.45 'Nanum Myeongjo',serif;color:var(--ink-soft);margin-top:5px}.v24-home-mini{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.v24-home-chip{border:1px solid var(--line);background:rgba(255,255,255,.7);border-radius:999px;padding:5px 8px;font:9.5px/1 'Gaegu','Nanum Myeongjo',sans-serif;color:var(--ink-soft)}.v24-home-chip.done{color:#657154;background:#edf0e7;border-color:#ced5c3}

  .v24-spark{position:fixed;left:0;top:0;z-index:9999;pointer-events:none;font-size:13px;animation:v24Spark .7s ease-out forwards;transform:translate(-50%,-50%)}
  @keyframes v24Spark{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}22%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.1) rotate(var(--rot))}}
  .v24-toast{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translate(-50%,14px);opacity:0;z-index:900;background:rgba(44,37,30,.94);color:#fff;border-radius:999px;padding:9px 14px;font:11px/1.25 'Nanum Myeongjo',serif;box-shadow:0 10px 30px rgba(0,0,0,.22);transition:.25s;pointer-events:none;white-space:nowrap}.v24-toast.show{opacity:1;transform:translate(-50%,0)}
  .v24-section-intro{margin-bottom:12px;padding:2px 2px 8px}.v24-section-intro b{font:italic 600 18px/1.15 'Playfair Display','Nanum Myeongjo',serif}.v24-section-intro p{margin:5px 0 0;font:11px/1.5 'Nanum Myeongjo',serif;color:var(--ink-soft)}
  .v24-back{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;font:700 9px/1 'Gaegu','Nanum Myeongjo',sans-serif;color:var(--ink-soft);cursor:pointer;margin-bottom:10px}

  @media(max-width:520px){.v24-reveal{grid-template-columns:1fr}.v24-archive-grid{grid-template-columns:1fr 1fr}.v24-couple-grid{grid-template-columns:1fr 1fr}.v24-jar-wrap{grid-template-columns:82px 1fr}.v10-drawer-tabs button{padding:6px 8px!important}.v10-drawer-body{padding-left:13px!important;padding-right:13px!important}}
  @media(prefers-reduced-motion:reduce){.v24-letter,.v24-star,.v24-spark{animation:none!important}.v24-progress-fill{transition:none!important}}
  `;

  function addStyles(){
    const s=document.createElement('style'); s.id='v24DailyUsStyles'; s.textContent=CSS; document.head.appendChild(s);
  }
  function isoDate(){ try{return v9ISODate();}catch(e){ return new Date().toISOString().slice(0,10); } }
  function me(){ try{return v8CommentUser||'시현';}catch(e){return localStorage.getItem('v8CommentUser')||'시현';} }
  function other(name=me()){ return name==='시현'?'강원':'시현'; }
  function esc(s){ try{return escapeHtml(s||'');}catch(e){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));} }
  function formatDate(d){
    const dt=new Date(d+'T12:00:00');
    try{return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',weekday:'short'}).format(dt).toUpperCase();}catch(e){return d;}
  }
  function dayNo(d){
    const start=new Date('2025-10-23T00:00:00'); const cur=new Date(d+'T00:00:00');
    return Math.floor((cur-start)/86400000)+1;
  }
  function toast(msg){
    try{ if(typeof v8Toast==='function') return v8Toast(msg); }catch(e){}
    let el=document.getElementById('v24Toast'); if(!el){el=document.createElement('div');el.id='v24Toast';el.className='v24-toast';document.body.appendChild(el);} el.textContent=msg; requestAnimationFrame(()=>el.classList.add('show')); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),1800);
  }
  function sparkleAt(x,y,count=8){
    const chars=['✦','·','♡','✧'];
    for(let i=0;i<count;i++){
      const el=document.createElement('span'); el.className='v24-spark'; el.textContent=chars[i%chars.length]; el.style.left=x+'px'; el.style.top=y+'px';
      const a=(Math.PI*2*i/count)+(Math.random()-.5)*.35, dist=24+Math.random()*34;
      el.style.setProperty('--dx',(Math.cos(a)*dist)+'px'); el.style.setProperty('--dy',(Math.sin(a)*dist)+'px'); el.style.setProperty('--rot',((Math.random()*90)-45)+'deg'); el.style.color=i%3===0?'#b8923f':'#b25c61';
      document.body.appendChild(el); setTimeout(()=>el.remove(),760);
    }
  }
  function sparkleEl(el){ if(!el)return; const r=el.getBoundingClientRect(); sparkleAt(r.left+r.width/2,r.top+r.height/2,10); }

  async function safeGet(key){ try{const r=await window.storage.get(key,true); return r?JSON.parse(r.value):null;}catch(e){return null;} }
  async function safeSet(key,obj){ try{await window.storage.set(key,JSON.stringify(obj),true);return true}catch(e){return false} }
  async function dailyLineGet(date,user){ return await safeGet('dailyline:'+date+':'+user); }
  async function dailyLineSet(date,user,text){ return await safeSet('dailyline:'+date+':'+user,{author:user,text,savedAt:Date.now()}); }

  async function gratitudeStats(){
    const map={}; let entries=0;
    try{
      const l=await window.storage.list('gratitude:',true);
      for(const key of (l.keys||[])){
        try{
          const r=await window.storage.get(key,true), v=JSON.parse(r.value);
          if(!v?.text?.trim()) continue;
          const m=key.match(/^gratitude:(\d{4}-\d{2}-\d{2}):(시현|강원)$/); if(!m)continue;
          entries++; map[m[1]] ||= {}; map[m[1]][m[2]]=true;
        }catch(e){}
      }
    }catch(e){}
    const completeDates=Object.keys(map).filter(d=>map[d].시현&&map[d].강원).sort();
    let streak=0; let cursor=new Date(isoDate()+'T12:00:00');
    if(!completeDates.includes(isoDate())) cursor.setDate(cursor.getDate()-1);
    const complete=new Set(completeDates);
    for(let i=0;i<1000;i++){ const d=cursor.toISOString().slice(0,10); if(!complete.has(d))break; streak++; cursor.setDate(cursor.getDate()-1); }
    return {entries,days:completeDates.length,completeDates,streak};
  }
  function milestone(days){
    const levels=[300,200,150,100,50,30,14,7]; const hit=levels.find(x=>days>=x)||0;
    if(!hit) return {n:0,label:'FIRST STARS'};
    const labels={7:'ONE WEEK OF THANKS',14:'TWO WEEKS OF THANKS',30:'30 DAYS OF NOTICING',50:'50 DAYS OF THANKS',100:'100 DAYS OF GRATITUDE',150:'150 DAYS TOGETHER',200:'200 DAYS OF THANKS',300:'LOOK HOW MUCH LOVE WE NOTICED'};
    return {n:hit,label:labels[hit]||`${hit} DAYS OF THANKS`};
  }
  function jarHTML(stats){
    const count=Math.min(30,Math.max(0,stats.days)); let stars='';
    for(let i=0;i<count;i++) stars+=`<span class="v24-star" style="animation-delay:${Math.min(i*18,250)}ms">${i%5===0?'✦':i%3===0?'♡':'★'}</span>`;
    const ms=milestone(stats.days);
    return `<div class="v24-jar-wrap"><div class="v24-jar"><div class="v24-stars">${stars}</div></div><div class="v24-jar-copy"><strong>${stats.days} days of thanks</strong><p>둘 다 감사를 남긴 하루마다 별 하나가 쌓여요.<br>${stats.streak?`지금 ${stats.streak}일째 이어지는 중.`:'오늘부터 다시 한 칸 채워도 좋아요.'}</p><span class="v24-milestone">${ICONS.sparkle}${esc(ms.label)}</span></div></div>`;
  }

  async function statusFor(date,user){
    const [g,c,q,line]=await Promise.all([
      (async()=>{try{return await getGratitude(date,user)}catch(e){return safeGet('gratitude:'+date+':'+user)}})(),
      (async()=>{try{return await v10GetCheckin(date,user)}catch(e){return safeGet('checkin:'+date+':'+user)}})(),
      (async()=>{try{return await v9AnswerGet(date,user)}catch(e){return safeGet('qanswer:'+date+':'+user)}})(),
      dailyLineGet(date,user)
    ]);
    return {gratitude:!!g?.text?.trim(),record:!!((c&&(c.mood||(c.activities||[]).length))||line?.text?.trim()),question:!!q?.text?.trim(),g,c,q,line};
  }

  function personHTML(name,s){
    const done=[s.record,s.gratitude,s.question].filter(Boolean).length;
    return `<div class="v24-person"><div class="v24-person-top"><span>${name}</span><span>${done}/3</span></div><div class="v24-dotrow"><i class="v24-dot ${s.record?'done':''}" title="기록"></i><i class="v24-dot ${s.gratitude?'done':''}" title="감사"></i><i class="v24-dot ${s.question?'done':''}" title="질문"></i></div><small>기록 · 감사 · 질문</small></div>`;
  }

  async function renderToday(body){
    const date=isoDate(), current=me(), partner=other(current);
    const [s,g,stats,myG,otherG,myLine]=await Promise.all([statusFor(date,'시현'),statusFor(date,'강원'),gratitudeStats(),(async()=>{try{return await getGratitude(date,current)}catch(e){return safeGet('gratitude:'+date+':'+current)}})(),(async()=>{try{return await getGratitude(date,partner)}catch(e){return safeGet('gratitude:'+date+':'+partner)}})(),dailyLineGet(date,current)]);
    const total=[s.record,s.gratitude,s.question,g.record,g.gratitude,g.question].filter(Boolean).length;
    const pct=Math.round(total/6*100), bothG=!!myG?.text?.trim()&&!!otherG?.text?.trim();
    const notifyOn=localStorage.getItem('v24_gratitude_notify')==='1'; const notifyTime=localStorage.getItem('v24_gratitude_notify_time')||'21:30';

    body.innerHTML=`<div class="v24-today">
      <div class="v24-date-title"><div><div class="v24-kicker">OUR DIARY · TODAY</div><h4>${formatDate(date)}</h4></div><div class="v24-day-pill">DAY ${dayNo(date)}</div></div>
      <div class="v24-progress-card" id="v24ProgressCard"><div class="v24-progress-head"><strong>오늘 우리 둘 다 ${total} / 6 완료</strong><span>${pct===100?'TODAY COMPLETE ✓':'one day, two hearts.'}</span></div><div class="v24-progress-track"><div class="v24-progress-fill" style="width:${pct}%"></div></div><div class="v24-couple-grid">${personHTML('시현',s)}${personHTML('강원',g)}</div></div>

      <section class="v24-card" id="v24RecordCard"><div class="v24-card-head"><div class="v24-card-title"><i class="v24-icon">${ICONS.pen}</i><div><b>TODAY'S RECORD</b><span>오늘 기억하고 싶은 한 줄</span></div></div><span class="v24-state ${s.record&&g.record?'done':'wait'}">${s.record&&g.record?'둘 다 기록 ✓':'기록 중'}</span></div>
        <div class="v24-inline-users"><button class="v24-userbtn ${current==='시현'?'active':''}" data-user="시현">시현</button><button class="v24-userbtn ${current==='강원'?'active':''}" data-user="강원">강원</button></div>
        <input class="v24-line-input" id="v24DailyLine" maxlength="240" placeholder="오늘 우리에게 있었던 일, 한 줄만 남겨도 돼요." value="${esc(myLine?.text||'')}">
        <div class="v24-help"><span>기분·활동 기록은 기존 OUR TODAY와 함께 저장돼요.</span><span id="v24LineSaved"></span></div>
        <div class="v24-action-row"><button class="v24-btn secondary" id="v24OpenCheckin">${ICONS.pen} 기분·활동 기록하기</button></div>
      </section>

      <section class="v24-card" id="v24GratCard"><div class="v24-card-head"><div class="v24-card-title"><i class="v24-icon">${ICONS.heart}</i><div><b>TODAY'S THANK YOU</b><span>오늘 ${partner}에게 고마웠던 순간</span></div></div><span class="v24-state ${myG?.text?.trim()?'done':'wait'}">${myG?.text?.trim()?'작성 완료 ✓':'아직'}</span></div>
        <textarea class="v24-textarea" id="v24GratitudeInput" maxlength="800" placeholder="오늘 ${partner}에게 고마웠던 순간 하나를 적어보세요.">${esc(myG?.text||'')}</textarea>
        <div class="v24-help"><span>둘 다 작성한 뒤 서로의 감사가 열려요.</span><span id="v24GratSaved"></span></div>
        <div id="v24GratReveal">${bothG?`<div class="v24-reveal"><div class="v24-letter"><div class="from">FROM ${current}</div><div class="txt">${esc(myG.text)}</div></div><div class="v24-letter"><div class="from">FROM ${partner}</div><div class="txt">${esc(otherG.text)}</div></div></div>`:(otherG?.text?.trim()?`<div class="v24-lock">💌 ${partner}의 감사가 도착했어요<small>내가 오늘의 감사를 남기면 함께 열 수 있어요.</small></div>`:'')}</div>
      </section>

      <section class="v24-card"><div class="v24-card-head"><div class="v24-card-title"><i class="v24-icon">${ICONS.question}</i><div><b>TODAY'S QUESTION</b><span>하루에 하나, 서로를 더 알아가는 질문</span></div></div><span class="v24-state ${s.question&&g.question?'done':'wait'}">${s.question&&g.question?'둘 다 답변 ✓':'답변 중'}</span></div><div class="v24-action-row"><button class="v24-btn primary" id="v24OpenQuestion">오늘의 질문 열기 →</button></div></section>

      <section class="v24-card"><div class="v24-card-head"><div class="v24-card-title"><i class="v24-icon">${ICONS.sparkle}</i><div><b>OUR THANK-YOU JAR</b><span>큰 사건보다 오래 남는 작은 고마움들</span></div></div></div>${jarHTML(stats)}
        <div class="v24-reminder"><div class="v24-reminder-copy">${ICONS.bell}<span>매일 감사 리마인드<br><small>브라우저가 열려 있을 때 알림</small></span></div><input class="v24-time" id="v24NotifyTime" type="time" value="${notifyTime}"><button class="v24-toggle ${notifyOn?'on':''}" id="v24NotifyToggle">${notifyOn?'ON':'OFF'}</button></div>
      </section>
    </div>`;

    body.querySelectorAll('.v24-userbtn').forEach(btn=>btn.addEventListener('click',()=>{ try{v8SetCommentUser(btn.dataset.user)}catch(e){} renderToday(body); }));

    const line=body.querySelector('#v24DailyLine'), lineSaved=body.querySelector('#v24LineSaved'); let lt;
    line?.addEventListener('input',()=>{clearTimeout(lt); lineSaved.textContent='저장 중…'; lt=setTimeout(async()=>{await dailyLineSet(date,current,line.value.trim()); lineSaved.textContent='저장됨 ✓'; lineSaved.classList.add('saved'); refreshHomeTeaser();},550)});

    body.querySelector('#v24OpenCheckin')?.addEventListener('click',()=>openHomeTarget('v10MoodCard'));
    body.querySelector('#v24OpenQuestion')?.addEventListener('click',()=>openHomeTarget('v9QuestionWrap'));

    const gi=body.querySelector('#v24GratitudeInput'), gs=body.querySelector('#v24GratSaved'); let gt;
    gi?.addEventListener('input',()=>{clearTimeout(gt);gs.textContent='저장 중…';gt=setTimeout(async()=>{
      const before=!!myG?.text?.trim(); const text=gi.value.trim();
      try{await setGratitude(date,current,text)}catch(e){await safeSet('gratitude:'+date+':'+current,{text,savedAt:Date.now()})}
      gs.textContent='저장됨 ✓';gs.classList.add('saved');
      const pg=await (async()=>{try{return await getGratitude(date,partner)}catch(e){return safeGet('gratitude:'+date+':'+partner)}})(); const reveal=body.querySelector('#v24GratReveal');
      if(text&&pg?.text?.trim()){
        reveal.innerHTML=`<div class="v24-reveal"><div class="v24-letter"><div class="from">FROM ${current}</div><div class="txt">${esc(text)}</div></div><div class="v24-letter"><div class="from">FROM ${partner}</div><div class="txt">${esc(pg.text)}</div></div></div>`;
        if(!before){sparkleEl(body.querySelector('#v24GratCard'));toast('오늘의 감사가 함께 열렸어요 ♡');}
      }else if(pg?.text?.trim()) reveal.innerHTML=`<div class="v24-lock">💌 ${partner}의 감사가 도착했어요<small>내가 오늘의 감사를 남기면 함께 열 수 있어요.</small></div>`;
      else reveal.innerHTML='';
      refreshHomeTeaser();
    },650)});

    const timeInput=body.querySelector('#v24NotifyTime'); timeInput?.addEventListener('change',()=>localStorage.setItem('v24_gratitude_notify_time',timeInput.value||'21:30'));
    body.querySelector('#v24NotifyToggle')?.addEventListener('click',async e=>{
      let on=localStorage.getItem('v24_gratitude_notify')==='1';
      if(!on && 'Notification' in window && Notification.permission!=='granted'){try{await Notification.requestPermission()}catch(err){}}
      on=!on; localStorage.setItem('v24_gratitude_notify',on?'1':'0'); e.currentTarget.classList.toggle('on',on); e.currentTarget.textContent=on?'ON':'OFF'; toast(on?'매일 감사 리마인드를 켰어요 ♡':'감사 리마인드를 껐어요');
    });

    if(pct===100){setTimeout(()=>{const el=body.querySelector('#v24ProgressCard'); if(el && sessionStorage.getItem('v24_complete_'+date)!=='1'){sparkleEl(el);sessionStorage.setItem('v24_complete_'+date,'1');}},180)}
  }

  function openHomeTarget(id){
    document.getElementById('v10ArchiveDrawer')?.classList.remove('open');
    try{switchView('home')}catch(e){}
    setTimeout(()=>{const el=document.getElementById(id); if(el){el.scrollIntoView({behavior:'smooth',block:'center'}); el.animate?.([{boxShadow:'0 0 0 0 rgba(178,92,97,0)'},{boxShadow:'0 0 0 8px rgba(178,92,97,.12)'},{boxShadow:'0 0 0 0 rgba(178,92,97,0)'}],{duration:700});}},180);
  }

  async function refreshHomeTeaser(){
    const wrap=document.getElementById('v22HomeTeaser'); if(!wrap)return;
    const date=isoDate(); const [s,g,stats]=await Promise.all([statusFor(date,'시현'),statusFor(date,'강원'),gratitudeStats()]);
    const total=[s.record,s.gratitude,s.question,g.record,g.gratitude,g.question].filter(Boolean).length;
    wrap.innerHTML=`<div class="v24-home"><div class="v24-home-top"><span class="v24-home-kicker">DAILY US · TODAY</span><span class="v24-home-date">${formatDate(date)} · DAY ${dayNo(date)}</span></div><div class="v24-home-main"><div><strong>${total===6?'Today complete ♡':'오늘 우리 하루를 같이 저장해요.'}</strong><div class="v24-home-sub">감사 ${s.gratitude&&g.gratitude?'2/2 ✓':`${Number(s.gratitude)+Number(g.gratitude)}/2`} · 기록 ${Number(s.record)+Number(g.record)}/2 · 질문 ${Number(s.question)+Number(g.question)}/2</div></div><button id="v24OpenDiary">Open Diary →</button></div><div class="v24-home-mini"><span class="v24-home-chip ${s.gratitude&&g.gratitude?'done':''}">♡ THANKS ${stats.days}</span>${stats.streak?`<span class="v24-home-chip done">🔥 ${stats.streak} DAY STREAK</span>`:''}<span class="v24-home-chip ${total===6?'done':''}">${total}/6 TODAY</span></div></div>`;
    wrap.querySelector('#v24OpenDiary')?.addEventListener('click',()=>openDiary('today'));
  }

  async function renderThanksWithIntro(body,originalRender){
    await originalRender('thanks');
    const stats=await gratitudeStats();
    const intro=document.createElement('div'); intro.innerHTML=`<div class="v24-section-intro"><b>All the things we thanked each other for.</b><p>작은 고마움들이 쌓인 기록. 검색해서 다시 꺼내볼 수도 있어요.</p></div><div class="v24-card" style="margin-bottom:12px">${jarHTML(stats)}<div class="v24-action-row"><button class="v24-btn secondary" id="v24RandomThanks">${ICONS.sparkle} Remind me why ♡</button></div></div>`;
    body.prepend(...intro.children);
    body.querySelector('#v24RandomThanks')?.addEventListener('click',async e=>{
      const items=[]; try{const l=await window.storage.list('gratitude:',true); for(const k of(l.keys||[])){try{const r=await window.storage.get(k,true),v=JSON.parse(r.value);if(v?.text?.trim()){const m=k.match(/^gratitude:(\d{4}-\d{2}-\d{2}):(시현|강원)$/);if(m)items.push({date:m[1],user:m[2],text:v.text});}}catch(err){}}}catch(err){}
      if(!items.length)return toast('아직 꺼내볼 감사가 없어요.'); const pick=items[Math.floor(Math.random()*items.length)]; sparkleEl(e.currentTarget); toast(`${pick.date} · ${pick.user}: ${pick.text.slice(0,40)}${pick.text.length>40?'…':''}`);
    });
  }

  function renderArchiveMenu(body,originalRender){
    body.innerHTML=`<div class="v24-section-intro"><b>Archive</b><p>매일의 기록 밖에 남겨둔 메모, 댓글, 좋아한 카톡과 통계를 한곳에 모았어요.</p></div><div class="v24-archive-grid">
      <button class="v24-archive-card" data-legacy="notes"><i class="ico">${ICONS.pen}</i><b>메모</b><span>날짜별로 남긴 자유 메모</span></button>
      <button class="v24-archive-card" data-legacy="comments"><i class="ico">${ICONS.heart}</i><b>댓글</b><span>서로 주고받은 짧은 이야기</span></button>
      <button class="v24-archive-card" data-legacy="chats"><i class="ico">${ICONS.heart}</i><b>♥ 카톡</b><span>다시 보고 싶은 대화</span></button>
      <button class="v24-archive-card" data-legacy="stats"><i class="ico">${ICONS.sparkle}</i><b>Our Rhythm</b><span>우리의 기록 리듬과 통계</span></button>
    </div>`;
    body.querySelectorAll('[data-legacy]').forEach(btn=>btn.addEventListener('click',async()=>{
      const tab=btn.dataset.legacy; await originalRender(tab); const back=document.createElement('button');back.className='v24-back';back.textContent='← ARCHIVE';back.onclick=()=>renderArchiveMenu(body,originalRender);body.prepend(back);
    }));
  }

  let _originalRender=null;
  async function renderDiaryTab(tab){
    const body=document.getElementById('v10ArchiveBody'); if(!body||!_originalRender)return;
    document.querySelectorAll('.v10-drawer-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    if(tab==='today') return renderToday(body);
    if(tab==='thanks') return renderThanksWithIntro(body,_originalRender);
    if(tab==='archive') return renderArchiveMenu(body,_originalRender);
    if(tab==='records'){
      await _originalRender('records'); body.insertAdjacentHTML('afterbegin','<div class="v24-section-intro"><b>Days we kept.</b><p>날짜별로 남긴 기분과 활동 기록을 시간순으로 모았어요.</p></div>'); return;
    }
    if(tab==='questions'){
      await _originalRender('questions'); body.insertAdjacentHTML('afterbegin','<div class="v24-section-intro"><b>Questions for us.</b><p>하루에 하나씩, 서로를 조금 더 알아간 답변들.</p></div>'); return;
    }
    return _originalRender(tab);
  }

  function openDiary(tab='today'){
    const drawer=document.getElementById('v10ArchiveDrawer'); if(!drawer)return; drawer.classList.add('open'); renderDiaryTab(tab);
  }

  function rebuildDiaryNav(){
    const head=document.querySelector('#v10ArchiveDrawer .v10-drawer-head h3'); if(head && !document.querySelector('.v24-diary-sub')) head.insertAdjacentHTML('afterend','<div class="v24-diary-sub">one day, two hearts.</div>');
    const tabs=document.querySelector('#v10ArchiveDrawer .v10-drawer-tabs'); if(!tabs)return;
    tabs.innerHTML=`<button data-tab="today" class="active">${ICONS.today}<span>TODAY</span></button><button data-tab="records">${ICONS.days}<span>DAYS</span></button><button data-tab="thanks">${ICONS.heart}<span>THANKS</span></button><button data-tab="questions">${ICONS.question}<span>QUESTIONS</span></button><button data-tab="archive">${ICONS.archive}<span>ARCHIVE</span></button>`;
    tabs.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>renderDiaryTab(b.dataset.tab)));
    const openBtn=document.getElementById('v10ArchiveBtn'); if(openBtn){openBtn.textContent='OUR DIARY'; openBtn.onclick=(e)=>{e.preventDefault();e.stopPropagation();openDiary('today');};}
  }

  async function reminderTick(){
    if(localStorage.getItem('v24_gratitude_notify')!=='1') return;
    const date=isoDate(); const time=localStorage.getItem('v24_gratitude_notify_time')||'21:30'; const [hh,mm]=time.split(':').map(Number); const now=new Date();
    if(now.getHours()<hh || (now.getHours()===hh&&now.getMinutes()<mm)) return;
    const last=localStorage.getItem('v24_gratitude_last_notify'); if(last===date)return;
    const current=me(); let g=null; try{g=await getGratitude(date,current)}catch(e){g=await safeGet('gratitude:'+date+':'+current)}; if(g?.text?.trim())return;
    const partner=other(current); let pg=null; try{pg=await getGratitude(date,partner)}catch(e){pg=await safeGet('gratitude:'+date+':'+partner)};
    const title=pg?.text?.trim()?`${partner}의 감사가 기다리고 있어요 💌`:'오늘의 감사를 아직 안 남겼어요 ♡'; const msg=pg?.text?.trim()?'나도 오늘의 감사를 남기면 함께 열 수 있어요.':'오늘 고마웠던 순간 하나만 기록해볼까요?';
    toast(title); if('Notification' in window&&Notification.permission==='granted'){try{new Notification(title,{body:msg})}catch(e){}}
    localStorage.setItem('v24_gratitude_last_notify',date);
  }

  window.addEventListener('load',()=>{
    try{
      addStyles();
      _originalRender = typeof v10RenderArchive==='function' ? v10RenderArchive : null;
      rebuildDiaryNav();
      refreshHomeTeaser();
      setInterval(reminderTick,60000); setTimeout(reminderTick,2400);
      const identity=document.querySelector('.v8-identity'); if(identity) identity.addEventListener('click',()=>setTimeout(()=>{refreshHomeTeaser(); if(document.getElementById('v10ArchiveDrawer')?.classList.contains('open')) renderDiaryTab('today');},120));
      document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshHomeTeaser();reminderTick();}});
    }catch(err){console.warn('[V24 Daily Us]',err);}
  });
})();
