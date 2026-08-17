/* ================================================================
   FULL KAKAO ARCHIVE — lazy loader for the real 89,251-message export
   (../data/full-chat.js, shared with the v1 app). Not loaded until
   something actually needs it (Search, WORDS), since it's a multi-MB
   file most page views never touch.
   ================================================================ */
(function(){
  let loading = null;

  function load(){
    if(window.FULL_CHAT_DATA) return Promise.resolve(window.FULL_CHAT_DATA);
    if(loading) return loading;
    loading = new Promise((resolve)=>{
      const s = document.createElement('script');
      s.src = '../data/full-chat.js';
      s.onload = ()=> resolve(window.FULL_CHAT_DATA || {});
      s.onerror = ()=> resolve({});
      document.head.appendChild(s);
    });
    return loading;
  }

  function messagesForDate(date){
    const data = window.FULL_CHAT_DATA;
    if(!data || !data[date]) return [];
    return data[date].map(m=>({date, speaker:m.s, text:m.t}));
  }

  function allMessages(){
    const data = window.FULL_CHAT_DATA;
    if(!data) return [];
    const out = [];
    Object.keys(data).forEach(date=>{
      data[date].forEach(m=> out.push({date, speaker:m.s, text:m.t}));
    });
    return out;
  }

  window.FullChat = {load, allMessages, messagesForDate, get ready(){ return !!window.FULL_CHAT_DATA; }};
})();
