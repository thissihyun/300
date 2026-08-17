/* Exact-text correction guard for bundled Kakao patch. */
(function(){
  const rows=window.V3_LATEST_CHAT_PATCH&&window.V3_LATEST_CHAT_PATCH['2026-08-17'];
  if(!Array.isArray(rows))return;
  const hit=rows.find(m=>m&&m.t==='신세계가면 배부를수도..!?' );
  if(hit)hit.t='신세계가면 배부를수도..!?';
})();
