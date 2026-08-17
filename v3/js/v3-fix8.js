/* 300 Days With You — richer representative Kakao conversations */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>window.escapeHtml?window.escapeHtml(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATS={
  '달달':['사랑해','사랑하','여보','자기','좋아해','좋아하','평생','결혼','뽀뽀','안아','귀여워','귀엽','보고싶'],
  '설렘':['데이트','만나','같이 가','같이 놀','기대','처음','보고싶','놀자','가자'],
  '위로':['괜찮아','들어줄게','걱정마','울지마','속상','힘들','곁에','미안해','다행'],
  '응원':['화이팅','힘내','응원','잘할','멋지','축하','고생했','잘하고','잘 보고','잘보고'],
  '웃김':['ㅋㅋㅋㅋ','개웃','웃기','킹받','드립','놀려','레전드','푸하하','크하하'],
  '서운함':['서운','속상','왜 안','왜 톡','왜 카톡','말뿐','피곤해','무시','싫어','미안'],
  '슬픔':['슬퍼','슬프','울었','눈물','아쉽','ㅠㅠ','🥲','보고싶다'],
  '보고싶음':['보고싶','그립','빨리 보고','언제 봐','만나고 싶']
};
const SYSTEM=/^(사진(?: \d+장)?|동영상|이모티콘|파일:|카카오톡 프로필)$/;
function clean(date){
  let rows=[];try{rows=FullChat.messagesForDate(date)||[]}catch(_e){}
  return rows.map((m,i)=>({...m,_i:i})).filter(m=>m.text&&!SYSTEM.test(String(m.text).trim())&&!/^https?:\/\//.test(String(m.text).trim())&&!/^\[(네이버지도|지도)\]/.test(String(m.text).trim())&&!/원을 (보냈어요|받았어요)/.test(String(m.text)));
}
function score(text,cat){let n=0,s=String(text||'');(CATS[cat]||[]).forEach(k=>{if(s.includes(k))n+=k.length>3?4:3});if(s.length>=8&&s.length<=100)n++;if(/사랑|평생|보고싶|고마워|미안|괜찮|ㅋㅋㅋㅋ/.test(s))n++;return n}
function windowAround(rows,center,count=20){
  if(rows.length<=count)return rows;
  let start=Math.max(0,center-Math.floor(count*.42));
  if(start+count>rows.length)start=Math.max(0,rows.length-count);
  return rows.slice(start,start+count);
}
function auto20(date,preferredCategory){
  const rows=clean(date);if(!rows.length)return{category:'일상',rows:[]};
  let best={score:-1,category:preferredCategory||'일상',idx:Math.floor(rows.length*.55)};
  const cats=preferredCategory&&CATS[preferredCategory]?[preferredCategory]:Object.keys(CATS);
  cats.forEach(cat=>rows.forEach((m,i)=>{const s=score(m.text,cat);if(s>best.score)best={score:s,category:cat,idx:i}}));
  if(best.score<=1){best.category=preferredCategory||'일상';best.idx=Math.min(rows.length-1,Math.floor(rows.length*.55));}
  return {category:best.category,rows:windowAround(rows,best.idx,20).map(m=>({speaker:m.speaker||m.s,text:m.text,index:m._i}))};
}
function expandedFromMeta(date,meta){
  const rows=clean(date);if(!rows.length)return{category:meta?.repChatCategory||'일상',rows:[]};
  const saved=Array.isArray(meta?.repChat)?meta.repChat:[];
  if(saved.length>=10)return{category:meta.repChatCategory||'우리의 말',rows:saved.slice(0,20)};
  if(saved.length){
    const idxs=saved.map(x=>Number(x.index)).filter(Number.isFinite);
    if(idxs.length){
      const avg=idxs.reduce((a,b)=>a+b,0)/idxs.length;
      let center=0,dist=Infinity;rows.forEach((r,i)=>{const d=Math.abs(r._i-avg);if(d<dist){dist=d;center=i}});
      return {category:meta.repChatCategory||'우리의 말',rows:windowAround(rows,center,20).map(m=>({speaker:m.speaker||m.s,text:m.text,index:m._i}))};
    }
  }
  return auto20(date,meta?.repChatCategory);
}
function currentDate(){const m=location.hash.match(/^#\/memory\/(\d{4}-\d{2}-\d{2})/);return m?m[1]:''}
function getMeta(date){return new Promise(resolve=>{if(!DB.onDayMeta)return resolve(null);let off=null,done=false;off=DB.onDayMeta(date,d=>{if(done)return;done=true;try{off&&off()}catch(_e){}resolve(d||null)});setTimeout(()=>{if(!done){done=true;try{off&&off()}catch(_e){}resolve(null)}},1200)})}
async function paintMemory(){
  const date=currentDate(),box=$('#memoryPanel .v6-representative-kakao');if(!date||!box||box.dataset.v8Painting==='1')return;
  box.dataset.v8Painting='1';
  try{await FullChat.load();const meta=await getMeta(date),rep=expandedFromMeta(date,meta);if(!rep.rows.length)return;
    box.innerHTML=`<div class="v6-rep-head"><div><span>TODAY'S KAKAO · ${rep.rows.length} MESSAGES</span><b>${esc(rep.category||'우리의 말')}</b></div><button type="button" data-v6-edit-day="${esc(date)}">대표카톡 수정</button></div><div class="v6-rep-bubbles">${rep.rows.map(x=>`<div class="v6-rep-msg ${String(x.speaker||'').includes('시현')?'sihyun':'gangwon'}"><small>${esc(x.speaker||'')}</small><p>${esc(x.text||'')}</p></div>`).join('')}</div>`;
  }finally{delete box.dataset.v8Painting}
}
async function enhanceEditor(){
  const panel=$('#uploadPanel'),k=$('.v3-album-modal-k',panel);if(!panel||!k||!/^OUR DAY/.test(k.textContent||''))return;
  const m=(k.textContent||'').match(/(\d{4}-\d{2}-\d{2})/);if(!m)return;const date=m[1],preview=$('.v6-auto-preview',panel);if(!preview||preview.dataset.v8==='1')return;
  preview.dataset.v8='1';await FullChat.load();const cat=$('#v6RepCat',panel)?.value||'',a=auto20(date,cat);preview.innerHTML=`<span>AUTO · ${esc(a.category)} · 최대 20개</span>${a.rows.map(x=>`<p><b>${esc(x.speaker)}</b> ${esc(x.text)}</p>`).join('')}`;
  const head=$('.v6-rep-editor-head span',panel);if(head)head.textContent='실제 카톡 원문에서 자동으로 약 20개를 추천해요. 직접 최대 20개까지 고를 수도 있어요.';
}
function closeEditor(){const m=$('#uploadModal');if(m)m.classList.remove('is-open');document.body.classList.remove('modal-open')}
document.addEventListener('change',e=>{
  const x=e.target.closest?.('[data-v6-chat-idx]');if(!x||!x.checked)return;const checked=$$('#uploadPanel [data-v6-chat-idx]:checked');if(checked.length>20){x.checked=false;Router.toast('대표카톡은 최대 20개까지 고를 수 있어요')}
},true);
document.addEventListener('click',async e=>{
  const btn=e.target.closest?.('#v6DaySave,#v6UseAuto');if(!btn)return;
  e.preventDefault();e.stopImmediatePropagation();
  const panel=$('#uploadPanel'),k=$('.v3-album-modal-k',panel),m=(k?.textContent||'').match(/(\d{4}-\d{2}-\d{2})/);if(!m||!DB.setDayMeta)return;const date=m[1];
  await FullChat.load();const title=$('#v6DayTitle',panel)?.value.trim()||'',cat=$('#v6RepCat',panel)?.value||'일상';let result;
  if(btn.id==='v6UseAuto')result=auto20(date,cat);else{
    const rows=clean(date),selected=$$('[data-v6-chat-idx]:checked',panel).slice(0,20).map(x=>rows.find(r=>r._i===Number(x.dataset.v6ChatIdx))).filter(Boolean).map(r=>({speaker:r.speaker||r.s,text:r.text,index:r._i}));
    result=selected.length?{category:cat,rows:selected}:auto20(date,cat);
  }
  await DB.setDayMeta(date,{title,repChatCategory:result.category,repChat:result.rows,updatedBy:(()=>{try{return Identity.displayName(Identity.current())}catch(_e){return''}})()});
  Router.toast(`대표카톡 ${result.rows.length}개를 저장했어요`);closeEditor();setTimeout(paintMemory,100);
},true);
let q=false;function run(){q=false;paintMemory();enhanceEditor()}
new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>setTimeout(paintMemory,80));run();
})();
