/* ================================================================
   KAKAO IMPORT (Section 53) — client-side .txt parser + aggregator.
   Runs entirely in the browser. Only aggregate counts ever leave the
   device (see js/firebase.js DB.setKakaoStats) — raw message text is
   never uploaded anywhere.
   ================================================================ */
(function(){
  const DATE_HEADER_RE = /^-{3,}\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*-{3,}\s*$/;
  const BRACKET_MSG_RE = /^\[(.+?)\]\s*\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s?([\s\S]*)$/;
  const INLINE_MSG_RE = /^(\d{4})[.\s]+(\d{1,2})[.\s]+(\d{1,2})[.\s]+(오전|오후)\s*(\d{1,2}):(\d{2}),\s*(.+?)\s*:\s*([\s\S]*)$/;
  const SYSTEM_LINE_RE = /(님이 (들어왔습니다|나갔습니다)|채팅방 관리자|저장한 날짜|카카오톡 대화)/;

  function pad(n){ return String(n).padStart(2,'0'); }

  function parseKakaoExport(text){
    const lines = text.split(/\r?\n/);
    const messages = [];
    let curDate = null;
    let last = null;

    for(const raw of lines){
      const line = raw.replace(/​/g, '').trimEnd();
      if(!line.trim()) continue;

      const dm = line.match(DATE_HEADER_RE);
      if(dm){
        curDate = `${dm[1]}-${pad(+dm[2])}-${pad(+dm[3])}`;
        last = null;
        continue;
      }

      const bm = line.match(BRACKET_MSG_RE);
      if(bm && curDate){
        if(SYSTEM_LINE_RE.test(bm[5])) { last = null; continue; }
        const msg = {date: curDate, speaker: bm[1].trim(), text: bm[5]};
        messages.push(msg);
        last = msg;
        continue;
      }

      const im = line.match(INLINE_MSG_RE);
      if(im){
        if(SYSTEM_LINE_RE.test(im[8])) { last = null; continue; }
        const date = `${im[1]}-${pad(+im[2])}-${pad(+im[3])}`;
        const msg = {date, speaker: im[7].trim(), text: im[8]};
        messages.push(msg);
        last = msg;
        continue;
      }

      if(SYSTEM_LINE_RE.test(line)) { last = null; continue; }

      // continuation of a multi-line message
      if(last){ last.text += '\n' + line; }
    }
    return messages;
  }

  function aggregate(messages){
    const monthly = {}; // 'YYYY-MM' -> count
    const bySpeaker = {};
    const words = {};
    const affectionByMonth = {}, tensionByMonth = {};

    window.WORDS.forEach(w => words[w] = 0);

    messages.forEach(m=>{
      const month = m.date.slice(0,7);
      monthly[month] = (monthly[month]||0) + 1;
      bySpeaker[m.speaker] = (bySpeaker[m.speaker]||0) + 1;
      window.WORDS.forEach(w=>{ if(m.text.includes(w)) words[w]++; });
      if(window.AFFECTION_WORDS.some(w=>m.text.includes(w))) affectionByMonth[month] = (affectionByMonth[month]||0)+1;
      if(window.TENSION_WORDS.some(w=>m.text.includes(w))) tensionByMonth[month] = (tensionByMonth[month]||0)+1;
    });

    const months = Object.keys(monthly).sort();
    const pulse = months.map(mo=>{
      const total = monthly[mo] || 1;
      return [mo, +(1000*(affectionByMonth[mo]||0)/total).toFixed(1), +(1000*(tensionByMonth[mo]||0)/total).toFixed(1)];
    });

    const dates = messages.map(m=>m.date).sort();
    return {
      total: messages.length,
      byDays: new Set(dates).size,
      dateRange: dates.length ? [dates[0], dates[dates.length-1]] : null,
      monthly, bySpeaker, words, pulse,
      asOf: todayISO(),
    };
  }

  window.KakaoParse = {parseKakaoExport, aggregate};
})();
