/* 300 DAYS WITH YOU — V25 DEVICE IDENTITY + PIN */
(function(){
'use strict';
const DEVICE_KEY='v25_identity_user';
const LEGACY_KEY='v8CommentUser';
const PIN_PREFIX='identitypin:';
const USERS=['시현','강원'];

const css=`
#v25IdentityGate{position:fixed;inset:0;z-index:190;background:rgba(35,29,23,.56);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:18px}
#v25IdentityGate.open{display:flex}
.v25-id-card{width:min(420px,94vw);background:linear-gradient(180deg,#fffdf8,#f6efe3);border:1px solid rgba(217,203,176,.9);border-radius:24px;padding:24px 20px 20px;box-shadow:0 28px 70px rgba(36,28,20,.34);position:relative;overflow:hidden;animation:v25Pop .36s cubic-bezier(.2,.9,.25,1)}
.v25-id-card:before{content:"";position:absolute;width:180px;height:180px;border-radius:50%;right:-80px;top:-90px;background:radial-gradient(circle,rgba(178,92,97,.14),transparent 68%);pointer-events:none}
@keyframes v25Pop{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
.v25-id-kicker{font:700 10px/1 'Gaegu','Nanum Myeongjo',sans-serif;letter-spacing:.14em;color:var(--rose-deep);text-align:center;margin-bottom:7px}
.v25-id-title{font:italic 600 27px/1.08 'Playfair Display','Nanum Myeongjo',serif;text-align:center;color:var(--ink);margin:0}
.v25-id-desc{font:12px/1.6 'Nanum Myeongjo',serif;color:var(--ink-soft);text-align:center;margin:9px auto 18px;max-width:320px}
.v25-id-users{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.v25-id-user{border:1px solid var(--line);background:rgba(255,255,255,.8);border-radius:18px;padding:16px 10px 14px;cursor:pointer;min-height:122px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--ink);transition:.2s;position:relative}
.v25-id-user:hover{transform:translateY(-2px);border-color:var(--rose);box-shadow:0 10px 24px rgba(51,43,34,.09)}
.v25-id-user:active{transform:scale(.97)}
.v25-avatar{width:48px;height:48px;border-radius:17px;display:grid;place-items:center;background:#f5e9df;color:var(--rose-deep);font:700 18px/1 'Gaegu','Nanum Myeongjo',sans-serif;box-shadow:inset 0 0 0 1px rgba(178,92,97,.13)}
.v25-id-user[data-user="강원"] .v25-avatar{background:#eee4d5;color:#8b6a44}
.v25-id-name{font:700 14px/1 'Gaegu','Nanum Myeongjo',sans-serif}
.v25-id-hint{font:10.5px/1.35 'Cormorant Garamond','Nanum Myeongjo',serif;color:var(--ink-soft);text-align:center}
.v25-pin-stage{display:none;margin-top:2px}.v25-pin-stage.open{display:block}
.v25-pin-user{display:flex;align-items:center;justify-content:center;gap:8px;margin:5px 0 14px;font:700 13px/1 'Gaegu','Nanum Myeongjo',sans-serif}
.v25-pin-user .mini{width:29px;height:29px;border-radius:10px;background:#f3e7dc;display:grid;place-items:center;color:var(--rose-deep)}
.v25-pin-input{width:100%;height:52px;border:1px solid var(--line);border-radius:15px;background:#fff;text-align:center;font:600 22px/1 'Cormorant Garamond',serif;letter-spacing:.38em;padding-left:.38em;color:var(--ink);outline:none}
.v25-pin-input:focus{border-color:var(--rose);box-shadow:0 0 0 4px rgba(178,92,97,.1)}
.v25-pin-actions{display:flex;gap:8px;margin-top:10px}.v25-pin-actions button{flex:1;height:44px;border-radius:13px;border:1px solid var(--line);font:700 11px/1 'Gaegu','Nanum Myeongjo',sans-serif;cursor:pointer}.v25-pin-back{background:#fff;color:var(--ink-soft)}.v25-pin-go{background:var(--rose);color:#fff;border-color:var(--rose)!important}
.v25-pin-error{min-height:18px;text-align:center;margin-top:8px;color:#a14f56;font:11px/1.4 'Nanum Myeongjo',serif}
.v25-id-note{text-align:center;margin-top:14px;font:10px/1.45 'Cormorant Garamond','Nanum Myeongjo',serif;color:var(--ink-soft)}
#v25IdentityPill{position:absolute;top:2px;right:2px;z-index:35;border:1px solid rgba(217,203,176,.9);background:rgba(255,253,248,.86);backdrop-filter:blur(10px);border-radius:999px;padding:6px 9px 6px 7px;display:none;align-items:center;gap:7px;cursor:pointer;color:var(--ink);box-shadow:0 6px 18px rgba(51,43,34,.08);transition:.18s}
#v25IdentityPill.show{display:flex}#v25IdentityPill:active{transform:scale(.96)}
#v25IdentityPill .dot{width:24px;height:24px;border-radius:9px;display:grid;place-items:center;background:#f4e8dd;color:var(--rose-deep);font:700 10px/1 'Gaegu','Nanum Myeongjo',sans-serif}
#v25IdentityPill .txt{display:flex;flex-direction:column;text-align:left;line-height:1.05}#v25IdentityPill .txt small{font:8.5px/1 'Cormorant Garamond',serif;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.06em}#v25IdentityPill .txt b{font:700 10px/1.2 'Gaegu','Nanum Myeongjo',sans-serif}
.v25-switch-list{display:flex;flex-direction:column;gap:8px}.v25-switch-row{display:flex;align-items:center;gap:10px;width:100%;border:1px solid var(--line);background:#fff;border-radius:14px;padding:10px 12px;cursor:pointer;text-align:left;color:var(--ink)}.v25-switch-row.current{border-color:#b8c19d;background:#f4f6ee}.v25-switch-row .mini{width:35px;height:35px;border-radius:12px;background:#f3e7dc;display:grid;place-items:center;font:700 12px/1 'Gaegu','Nanum Myeongjo',sans-serif}.v25-switch-row .meta{flex:1}.v25-switch-row .meta b{display:block;font:700 12px/1.2 'Gaegu','Nanum Myeongjo',sans-serif}.v25-switch-row .meta span{display:block;font:10px/1.3 'Cormorant Garamond','Nanum Myeongjo',serif;color:var(--ink-soft);margin-top:2px}.v25-current-badge{font:700 8px/1 'Gaegu',sans-serif;background:#e7ecd9;color:#647052;border-radius:999px;padding:5px 7px}
@media(max-width:640px){#v25IdentityPill{top:4px;right:4px;padding:5px 7px 5px 5px}#v25IdentityPill .txt small{display:none}.v25-id-card{border-radius:22px;padding:23px 16px 18px}.v25-id-title{font-size:24px}}
@media(prefers-reduced-motion:reduce){.v25-id-card{animation:none!important}.v25-id-user{transition:none!important}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function getDeviceUser(){try{return localStorage.getItem(DEVICE_KEY)||''}catch(e){return ''}}
function saveDeviceUser(user){try{localStorage.setItem(DEVICE_KEY,user);localStorage.setItem(LEGACY_KEY,user)}catch(e){}}
function validPin(pin){return /^\d{4}$/.test(pin)}
function bytesToHex(buf){return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')}
function randomSalt(){const b=new Uint8Array(16);crypto.getRandomValues(b);return bytesToHex(b)}
async function pinHash(pin,salt){
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:120000,hash:'SHA-256'},material,256);
  return bytesToHex(bits);
}
async function getPinRecord(user){try{const r=await window.storage.get(PIN_PREFIX+user,true);return r?JSON.parse(r.value):null}catch(e){return null}}
async function createPin(user,pin){const salt=randomSalt();const hash=await pinHash(pin,salt);await window.storage.set(PIN_PREFIX+user,JSON.stringify({salt,hash,createdAt:Date.now()}),true)}
async function verifyPin(user,pin){const rec=await getPinRecord(user);if(!rec)return false;return (await pinHash(pin,rec.salt))===rec.hash}

function mainReady(){return typeof window.v8SetCommentUser==='function'&&window.storage&&document.getElementById('app')&&document.getElementById('lockScreen')}
async function waitMain(){for(let i=0;i<160;i++){if(mainReady())return true;await sleep(100)}return false}
async function waitUnlocked(){for(let i=0;i<600;i++){const l=document.getElementById('lockScreen'),app=document.getElementById('app');if(l&&getComputedStyle(l).display==='none'&&app&&getComputedStyle(app).display!=='none')return true;await sleep(150)}return false}

let gate,card,chosen='';
function makeGate(){
  gate=document.createElement('div');gate.id='v25IdentityGate';gate.innerHTML=`<div class="v25-id-card" id="v25IdentityCard"></div>`;document.body.appendChild(gate);card=gate.firstElementChild;
}
function avatarLetter(user){return user==='시현'?'시':'강'}
function renderChoose(mode='first'){
  chosen='';
  const current=getDeviceUser();
  card.innerHTML=`<div class="v25-id-kicker">300 DAYS WITH YOU</div><h2 class="v25-id-title">${mode==='switch'?'Who is writing?':'Who are you?'}</h2><div class="v25-id-desc">${mode==='switch'?'기록을 남길 사람을 선택해 주세요. 다른 사람으로 전환할 때는 그 사람의 PIN을 확인해요.':'이 기기에서 기록을 남길 사람을 한 번만 선택해 주세요. 다음 접속부터 기억할게요.'}</div><div class="${mode==='switch'?'v25-switch-list':'v25-id-users'}">${USERS.map(u=>mode==='switch'?`<button class="v25-switch-row ${current===u?'current':''}" data-user="${u}"><span class="mini">${avatarLetter(u)}</span><span class="meta"><b>${u}</b><span>${current===u?'이 기기의 현재 사용자':'PIN 확인 후 전환'}</span></span>${current===u?'<span class="v25-current-badge">CURRENT</span>':''}</button>`:`<button class="v25-id-user" data-user="${u}"><span class="v25-avatar">${avatarLetter(u)}</span><span class="v25-id-name">${u}</span><span class="v25-id-hint">${u==='시현'?'시현으로 기록하기':'강원으로 기록하기'}</span></button>`).join('')}</div><div class="v25-id-note">PIN은 작성자 구분을 위한 간단한 확인용이에요. 이 기기에는 선택한 사용자만 기억됩니다.</div>`;
  card.querySelectorAll('[data-user]').forEach(b=>b.onclick=()=>selectUser(b.dataset.user,mode));
  gate.classList.add('open');
}
async function selectUser(user,mode){
  const current=getDeviceUser();
  if(mode==='switch'&&current===user){gate.classList.remove('open');return}
  chosen=user;
  let rec=await getPinRecord(user);
  renderPin(user,!!rec,mode);
}
function renderPin(user,hasPin,mode){
  card.innerHTML=`<div class="v25-id-kicker">${hasPin?'IDENTITY CHECK':'FIRST SETUP'}</div><h2 class="v25-id-title">${hasPin?`${esc(user)} 맞나요?`:`${esc(user)} PIN 만들기`}</h2><div class="v25-id-desc">${hasPin?'이름이 섞이지 않도록 4자리 PIN을 입력해 주세요.':'이 PIN은 다른 기기에서 같은 이름으로 접속하거나 사용자를 바꿀 때 사용해요.'}</div><div class="v25-pin-stage open"><div class="v25-pin-user"><span class="mini">${avatarLetter(user)}</span>${esc(user)}</div><input class="v25-pin-input" id="v25PinInput" type="password" inputmode="numeric" maxlength="4" autocomplete="one-time-code" placeholder="••••" aria-label="4자리 PIN"><div class="v25-pin-actions"><button class="v25-pin-back" id="v25PinBack">뒤로</button><button class="v25-pin-go" id="v25PinGo">${hasPin?'확인':'PIN 저장'}</button></div><div class="v25-pin-error" id="v25PinError"></div></div><div class="v25-id-note">PIN 원문은 저장하지 않습니다.</div>`;
  const inp=card.querySelector('#v25PinInput'),err=card.querySelector('#v25PinError'),go=card.querySelector('#v25PinGo');
  card.querySelector('#v25PinBack').onclick=()=>renderChoose(mode);
  inp.focus();
  inp.addEventListener('input',()=>{inp.value=inp.value.replace(/\D/g,'').slice(0,4);err.textContent=''});
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')go.click()});
  go.onclick=async()=>{
    const pin=inp.value;
    if(!validPin(pin)){err.textContent='숫자 4자리로 입력해 주세요.';return}
    go.disabled=true;go.textContent='확인 중…';
    try{
      if(hasPin){if(!(await verifyPin(user,pin))){err.textContent='PIN이 맞지 않아요.';go.disabled=false;go.textContent='확인';return}}
      else{await createPin(user,pin)}
      saveDeviceUser(user);
      try{window.v8SetCommentUser(user)}catch(e){}
      gate.classList.remove('open');
      showPill(user);
      if(typeof window.v8Toast==='function')window.v8Toast(`${user}으로 기록할게요 ♡`);
      await sleep(180);
      location.reload();
    }catch(e){err.textContent='PIN을 저장하거나 확인하지 못했어요. 잠시 후 다시 시도해 주세요.';go.disabled=false;go.textContent=hasPin?'확인':'PIN 저장'}
  };
}
function makePill(){
  if(document.getElementById('v25IdentityPill'))return;
  const p=document.createElement('button');p.id='v25IdentityPill';p.type='button';
  const wrap=document.querySelector('.wrap')||document.body;wrap.appendChild(p);p.onclick=()=>renderChoose('switch');
}
function showPill(user){
  makePill();const p=document.getElementById('v25IdentityPill');if(!p)return;
  p.innerHTML=`<span class="dot">${avatarLetter(user)}</span><span class="txt"><small>Writing as</small><b>${esc(user)} ▾</b></span>`;p.classList.add('show');
}
async function boot(){
  if(!(await waitMain()))return;
  makeGate();
  const remembered=getDeviceUser();
  if(remembered&&USERS.includes(remembered)){
    try{window.v8SetCommentUser(remembered)}catch(e){}
    showPill(remembered);
  }
  await waitUnlocked();
  const now=getDeviceUser();
  if(!now||!USERS.includes(now))renderChoose('first');
  else showPill(now);
}
boot();
})();
