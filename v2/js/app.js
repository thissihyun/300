/* ================================================================
   300 DAYS WITH YOU — BOOTSTRAP
   Lock screen → identity/PIN → app shell → router.
   ================================================================ */
(function(){

  function isoDate(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  window.todayISO = isoDate;
  window.dayNumber = function(dateStr){
    const d = new Date(dateStr+'T00:00:00');
    return Math.floor((d - window.DAY1)/86400000) + 1;
  };
  window.fmtDate = function(dateStr){
    const d = new Date(dateStr+'T00:00:00');
    const wd = ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()];
    return `${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()]} ${d.getDate()}, ${wd}`;
  };
  window.escapeHtml = function(s){
    return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  };

  /* ---------- LOCK ---------- */
  function tryUnlock(){
    const val = document.getElementById('lockInput').value.trim();
    if(val === window.PASSCODE || sessionStorage.getItem('unlocked')==='1'){
      sessionStorage.setItem('unlocked','1');
      document.getElementById('lockScreen').style.display='none';
      afterUnlock();
    } else {
      document.getElementById('lockErr').textContent = '날짜가 맞지 않아요.';
    }
  }
  document.getElementById('lockBtn').addEventListener('click', tryUnlock);
  document.getElementById('lockInput').addEventListener('keydown', e=>{ if(e.key==='Enter') tryUnlock(); });

  function afterUnlock(){
    const uid = Identity.current();
    if(uid){ startApp(); }
    else { showIdentityPicker(); }
  }

  /* ---------- IDENTITY / PIN ---------- */
  function showIdentityPicker(){
    document.getElementById('identityScreen').style.display='flex';
    document.getElementById('identityTitle').textContent = 'Who are you?';
    const stage = document.getElementById('identityStage');
    stage.innerHTML = `<div class="identity-cards">${Identity.users.map(u=>`
      <button class="identity-card card-btn" data-pick-user="${u.id}">${u.name}으로<br>기록하기</button>
    `).join('')}</div>`;
    stage.querySelectorAll('[data-pick-user]').forEach(btn=>{
      btn.addEventListener('click', ()=> showPinStage(btn.dataset.pickUser));
    });
  }

  async function showPinStage(userId){
    const stage = document.getElementById('identityStage');
    document.getElementById('identityTitle').textContent = Identity.displayName(userId);
    const hasPin = await Identity.hasPin(userId);
    stage.innerHTML = `
      <div class="lock-sub">${hasPin ? '4자리 PIN을 입력해주세요' : '처음이네요 — 사용할 4자리 PIN을 만들어주세요'}</div>
      <div class="pin-pad">
        <input id="pinInput" class="lock-input" type="password" inputmode="numeric" maxlength="4" placeholder="••••">
        <button class="btn" id="pinConfirmBtn">${hasPin ? '확인' : 'PIN 만들기'}</button>
        <button class="btn btn-outline btn-sm" id="pinBackBtn">다른 사람으로</button>
      </div>
      <div class="err-text" id="pinErr"></div>`;
    document.getElementById('pinBackBtn').addEventListener('click', showIdentityPicker);
    const submit = async ()=>{
      const pin = document.getElementById('pinInput').value.trim();
      if(!/^\d{4}$/.test(pin)){ document.getElementById('pinErr').textContent='4자리 숫자를 입력해주세요.'; return; }
      if(hasPin){
        const ok = await Identity.verifyPin(userId, pin);
        if(!ok){ document.getElementById('pinErr').textContent='PIN이 맞지 않아요.'; return; }
      } else {
        await Identity.createPin(userId, pin);
      }
      Identity.setCurrent(userId);
      document.getElementById('identityScreen').style.display='none';
      startApp();
    };
    document.getElementById('pinConfirmBtn').addEventListener('click', submit);
    document.getElementById('pinInput').addEventListener('keydown', e=>{ if(e.key==='Enter') submit(); });
  }

  /* ---------- USER PILL / SWITCH ---------- */
  function refreshUserPill(){
    const uid = Identity.current();
    document.getElementById('userPillBtn').textContent = 'WRITING AS · ' + (uid ? Identity.displayName(uid) : '—');
  }
  window.RouterActions = window.RouterActions || {};
  window.RouterActions['switch-user'] = function(){
    document.getElementById('app').classList.remove('is-visible');
    showIdentityPicker();
  };

  /* ---------- MUSIC (Section 73) ---------- */
  const bgm = document.getElementById('bgm');
  const musicToggle = document.getElementById('musicToggle');
  let musicMuted = Prefs.musicMuted;
  function updateMusicUI(){ musicToggle.classList.toggle('muted', musicMuted); }
  musicToggle.addEventListener('click', ()=>{
    musicMuted = !musicMuted;
    Prefs.musicMuted = musicMuted;
    if(musicMuted) bgm.pause(); else bgm.play().catch(()=>{});
    updateMusicUI();
  });
  updateMusicUI();

  /* ---------- NOTIFICATIONS BELL ---------- */
  window.RouterActions['toggle-notif'] = function(){
    const panel = document.getElementById('notifPanel');
    panel.classList.toggle('is-open');
    if(panel.classList.contains('is-open') && window.NotificationsView) window.NotificationsView.render(panel);
    if(panel.classList.contains('is-open')) Prefs.lastReadNotifAt = Date.now();
  };
  document.addEventListener('click', (e)=>{
    const panel = document.getElementById('notifPanel');
    if(panel.classList.contains('is-open') && !panel.contains(e.target) && !e.target.closest('[data-action="toggle-notif"]')){
      panel.classList.remove('is-open');
    }
  });

  /* ---------- PWA (Section 70) ---------- */
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js').catch(()=>{}));
  }

  /* ---------- ADD TO HOME SCREEN ---------- */
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredInstallPrompt = e;
    const btn = document.getElementById('installBtn');
    if(btn) btn.style.display = '';
  });
  window.RouterActions['install-app'] = async function(){
    if(!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    document.getElementById('installBtn').style.display = 'none';
  };
  window.addEventListener('appinstalled', ()=>{
    const btn = document.getElementById('installBtn');
    if(btn) btn.style.display = 'none';
  });

  /* ---------- DAILY REMINDER (Section 71) — best-effort while the app/tab is open ---------- */
  let reminderFiredFor = null;
  function checkReminder(){
    if(!Prefs.reminderEnabled) return;
    const now = new Date();
    const hhmm = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    if(hhmm !== Prefs.reminderTime) return;
    const today = todayISO();
    if(reminderFiredFor === today) return;
    const uid = Identity.current();
    if(!uid) return;
    reminderFiredFor = today;
    if('Notification' in window && Notification.permission === 'granted'){
      new Notification('300 Days With You', {body: '오늘 우리 하루가 아직 열려 있어요 ♡ 오늘 기록 · 감사를 남기면 Daily Card가 완성돼요.'});
    }
  }
  setInterval(checkReminder, 30000);

  /* ---------- START ---------- */
  function startApp(){
    document.getElementById('identityScreen').style.display='none';
    document.getElementById('app').classList.add('is-visible');
    refreshUserPill();
    if(!musicMuted) bgm.play().catch(()=>{});
    if(window.NotificationsView) window.NotificationsView.watch();
    Router.init();
    const tw = document.getElementById('togetherWidget');
    if(tw) setTimeout(()=> tw.classList.add('is-close'), 300);
  }

  if(sessionStorage.getItem('unlocked')==='1'){
    document.getElementById('lockScreen').style.display='none';
    afterUnlock();
  }
})();
