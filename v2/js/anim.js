/* ================================================================
   ANIMATION UTILITIES — shared helpers ported over from the v1 app
   (ripple/glow press feedback, count-up numbers, scroll-in reveal).
   Pure visual polish: never touches data, never blocks a click.
   ================================================================ */
(function(){

  /* ---- ripple/glow on any button or card-btn ---- */
  const RIPPLE_SELECTOR = 'button, .card-btn';
  document.addEventListener('pointerdown', (e)=>{
    const el = e.target.closest(RIPPLE_SELECTOR);
    if(!el || el.disabled) return;
    const cs = getComputedStyle(el);
    if(cs.position === 'static') el.classList.add('v2-ripple-host');
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const span = document.createElement('span');
    span.className = 'v2-ripple';
    span.style.width = span.style.height = size+'px';
    span.style.left = (e.clientX - rect.left - size/2)+'px';
    span.style.top = (e.clientY - rect.top - size/2)+'px';
    el.appendChild(span);
    span.addEventListener('animationend', ()=> span.remove());
    setTimeout(()=> span.remove(), 700); // safety net if animationend never fires
  }, {passive:true});

  /* ---- count-up: animates a number from 0 (or current) to target ---- */
  function countUp(el, target, opts){
    opts = opts || {};
    const duration = opts.duration || 900;
    const suffix = opts.suffix || '';
    const start = 0;
    const startTime = performance.now();
    if(opts.once && el.dataset.countedTo === String(target)) { el.textContent = target.toLocaleString()+suffix; return; }
    el.dataset.countedTo = String(target);
    function tick(now){
      const p = Math.min(1, (now-startTime)/duration);
      const eased = 1 - Math.pow(1-p, 3); // ease-out cubic
      const val = Math.round(start + (target-start)*eased);
      el.textContent = val.toLocaleString()+suffix;
      if(p < 1) requestAnimationFrame(tick);
    }
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      el.textContent = target.toLocaleString()+suffix;
      return;
    }
    requestAnimationFrame(tick);
  }

  /* ---- reveal-on-scroll: adds .is-in when an element enters the viewport ---- */
  function observeReveal(els){
    if(!('IntersectionObserver' in window)){
      els.forEach(el=>el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, {threshold:0.25});
    els.forEach(el=>io.observe(el));
  }

  /* ---- sparkle burst at an element's center (favorites, jar milestones) ---- */
  function sparkleAt(el, count){
    count = count || 8;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    const chars = ['✦','·','♡','✧'];
    for(let i=0;i<count;i++){
      const s = document.createElement('span');
      s.className = 'v2-spark';
      s.textContent = chars[i % chars.length];
      s.style.left = cx+'px'; s.style.top = cy+'px';
      const a = (Math.PI*2*i/count) + (Math.random()-0.5)*0.4;
      const dist = 22 + Math.random()*30;
      s.style.setProperty('--dx', (Math.cos(a)*dist)+'px');
      s.style.setProperty('--dy', (Math.sin(a)*dist)+'px');
      document.body.appendChild(s);
      setTimeout(()=> s.remove(), 750);
    }
  }

  /* ---- stagger helper: adds .is-in to a NodeList with incremental delay ---- */
  function staggerIn(els, stepMs){
    const step = stepMs || 60;
    [...els].forEach((el,i)=>{
      el.style.animationDelay = Math.min(i*step, 600)+'ms';
      requestAnimationFrame(()=> el.classList.add('is-in'));
    });
  }

  window.V2Anim = {countUp, observeReveal, sparkleAt, staggerIn};
})();
