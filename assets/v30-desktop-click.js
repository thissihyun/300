/* 300 DAYS WITH YOU — V30 DESKTOP CLICK BRIDGE */
(function(){
'use strict';
function gv(expr){try{return Function('return ('+expr+')')()}catch(e){return undefined}}
function dateFor(hit){let d=hit?.dataset?.v28Date||hit?.dataset?.d||'';if(!d&&hit?.classList?.contains('v26-landmark')){try{const pins=gv('NYC_PINS')||[],all=[...document.querySelectorAll('.v26-landmark')],i=all.indexOf(hit);d=pins[i]?.dates?.[0]||''}catch(e){}}return d==='2026-08-18'?'2026-08-19':d}
function openDate(d){if(!d)return;if(typeof window.V28OpenMemory==='function'){window.V28OpenMemory(d);return}const f=gv('openModal');if(typeof f==='function')f(d)}
document.addEventListener('pointerdown',function(e){if(window.innerWidth<=720)return;const hit=e.target?.closest?.('.v26-landmark,.v26-star[data-d],.v26-season-links [data-d]');if(!hit)return;const d=dateFor(hit);if(!d)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();openDate(d)},true);
})();