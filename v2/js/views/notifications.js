/* ================================================================
   NOTIFICATIONS / ACTIVITY INBOX (Section 68/69) + browser push
   for partner activity when enabled (Section 72).
   ================================================================ */
(function(){
  let lastRows = [];
  const TYPE_LABEL = {record:'하루 기록', gratitude:'감사', question:'질문 답변', photo:'사진 추가', comment:'댓글', future:'Future'};

  function updateBadge(){
    const badge = document.getElementById('notifBadge');
    if(!badge) return;
    const unread = lastRows.filter(r => (r.clientTime||0) > Prefs.lastReadNotifAt).length;
    badge.style.display = unread ? '' : 'none';
    badge.textContent = unread > 9 ? '9+' : String(unread);
  }

  function watch(){
    DB.onActivity(rows=>{
      const me = Identity.displayName(Identity.current());
      const prevLen = lastRows.length;
      lastRows = rows;
      updateBadge();
      if(Prefs.partnerActivityNotif && rows.length && rows[0].author !== me && rows.length > prevLen && prevLen>0){
        notifyBrowser(rows[0]);
      }
    });
  }

  function notifyBrowser(row){
    if(!('Notification' in window)) return;
    if(Notification.permission === 'granted'){
      new Notification('300 Days With You', {body: `${row.author} · ${TYPE_LABEL[row.type]||row.type}`});
    } else if(Notification.permission !== 'denied'){
      Notification.requestPermission();
    }
  }

  function settingsHtml(){
    return `<div style="padding:12px 14px; border-top:1px solid var(--line);">
      <label class="section-note" style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <input type="checkbox" id="notifSettingPartner" ${Prefs.partnerActivityNotif?'checked':''}> 상대방 활동 알림
      </label>
      <label class="section-note" style="display:flex; align-items:center; gap:8px;">
        <input type="checkbox" id="notifSettingReminder" ${Prefs.reminderEnabled?'checked':''}> Daily reminder
        <input type="time" id="notifSettingTime" value="${Prefs.reminderTime}" style="margin-left:auto; font-size:12px;">
      </label>
    </div>`;
  }

  function render(panel){
    const list = lastRows.length ? lastRows.slice(0,20).map(r=>`
      <button class="notif-item" data-action="${r.date?'memory':''}" ${r.date?`data-date="${r.date}"`:''}>
        <span class="notif-author">${escapeHtml(r.author||'')}</span>${escapeHtml(TYPE_LABEL[r.type]||r.type||'')}<br>
        <span class="section-note">${escapeHtml(r.date||'')} · ${escapeHtml(r.text||'')}</span>
      </button>`).join('') : '<div class="notif-empty">아직 새 활동이 없어요.</div>';
    panel.innerHTML = list + settingsHtml();
    panel.querySelector('#notifSettingPartner').addEventListener('change', e=>{
      Prefs.partnerActivityNotif = e.target.checked;
      if(e.target.checked && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    });
    panel.querySelector('#notifSettingReminder').addEventListener('change', e=>{
      Prefs.reminderEnabled = e.target.checked;
      if(e.target.checked && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    });
    panel.querySelector('#notifSettingTime').addEventListener('change', e=>{ Prefs.reminderTime = e.target.value; });
  }

  window.NotificationsView = {watch, render};
})();
