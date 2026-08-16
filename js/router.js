/* ================================================================
   300 DAYS WITH YOU — SINGLE ROUTER
   The only place that owns click routing. No inline onclick, no
   duplicate pointerdown/pointerup/click layers anywhere else in the
   app (Section 78/91/92 of the spec). Every interactive element is a
   real <button> with data-action, delegated through one listener.
   ================================================================ */
(function(){
  const VIEWS = ['home','ourdays','diary','ourstory','album','special','future'];
  const registry = {}; // viewName -> { render(container) }
  const specialSub = {}; // special sub-feature key -> { render(container) }

  let currentView = 'home';

  function registerView(name, impl){ registry[name] = impl; }
  function registerSpecial(key, impl){ specialSub[key] = impl; }

  function openView(name, opts){
    opts = opts || {};
    if(!VIEWS.includes(name)) name = 'home';
    currentView = name;
    document.querySelectorAll('.view').forEach(el => el.classList.toggle('is-active', el.id === 'view-'+name));
    document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('is-active', el.dataset.nav === name));
    const container = document.getElementById('view-'+name);
    if(container && registry[name] && typeof registry[name].render === 'function'){
      registry[name].render(container, opts);
    }
    if(!opts.silent) location.hash = '#/view/' + name + (opts.hashExtra ? '/'+opts.hashExtra : '');
    window.scrollTo({top:0, behavior:'instant' in window ? 'instant' : 'auto'});
    closeAllOverlays({keepView:true});
  }

  function openSpecial(key, opts){
    openView('special', {silent:true, hashExtra:key});
    location.hash = '#/special/' + key;
    const host = document.getElementById('specialDetailHost');
    const hub = document.getElementById('specialHub');
    if(specialSub[key]){
      hub.style.display = 'none';
      host.style.display = 'block';
      host.innerHTML = '';
      specialSub[key].render(host, opts||{});
    } else {
      hub.style.display = '';
      host.style.display = 'none';
    }
  }
  function closeSpecialDetail(){
    const host = document.getElementById('specialDetailHost');
    const hub = document.getElementById('specialHub');
    if(host) host.style.display = 'none';
    if(hub) hub.style.display = '';
    location.hash = '#/view/special';
  }

  function openMemory(date){
    if(!window.EVENTS[date] && !window.MemoryView) return;
    closeAllOverlays(); // e.g. close Global Search / Upload before stacking Memory Detail on top
    location.hash = '#/memory/' + date;
    if(window.MemoryView) window.MemoryView.open(date);
  }
  function closeMemory(){
    if(window.MemoryView) window.MemoryView.close();
    if(location.hash.startsWith('#/memory/')) location.hash = '#/view/' + currentView;
  }

  function openLightbox(photoUrl, caption){
    if(window.AlbumView) window.AlbumView.openLightbox(photoUrl, caption);
  }
  function closeLightbox(){
    if(window.AlbumView) window.AlbumView.closeLightbox();
  }

  function closeAllOverlays(opts){
    opts = opts || {};
    document.querySelectorAll('.modal-backdrop.is-open').forEach(el => el.classList.remove('is-open'));
    document.body.classList.remove('modal-open');
  }

  function toast(msg){
    const host = document.getElementById('toastHost');
    if(!host) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(()=> el.classList.add('is-in'));
    setTimeout(()=>{ el.classList.remove('is-in'); setTimeout(()=>el.remove(), 300); }, 2400);
  }

  /* ---- ONE delegated handler for the whole app ---- */
  document.addEventListener('click', function(e){
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const action = el.dataset.action;

    switch(action){
      case 'view':
        openView(el.dataset.target);
        break;
      case 'memory':
        openMemory(el.dataset.date);
        break;
      case 'special':
        openSpecial(el.dataset.target);
        break;
      case 'special-back':
        closeSpecialDetail();
        break;
      case 'photo':
        openLightbox(el.dataset.url, el.dataset.caption || '');
        break;
      case 'close-modal': {
        const modal = el.closest('.modal-backdrop');
        if(modal) modal.classList.remove('is-open');
        document.body.classList.remove('modal-open');
        if(modal && modal.id === 'memoryModal') closeMemory();
        if(modal && modal.id === 'lightboxModal') closeLightbox();
        break;
      }
      case 'tab': {
        const group = el.dataset.group;
        const target = el.dataset.target;
        // Panels live as siblings of the tab bar, not inside it, so we scope to the
        // nearest ancestor that contains both — falling back to the active view.
        const scope = el.closest('.view') || document;
        scope.querySelectorAll(`[data-tabbtn="${group}"]`).forEach(b => b.classList.toggle('is-active', b===el));
        scope.querySelectorAll(`[data-tabpanel="${group}"]`).forEach(p => p.classList.toggle('is-active', p.dataset.panel===target));
        if(el.dataset.onTab && window[el.dataset.onTab]) window[el.dataset.onTab](target);
        break;
      }
      default:
        if(window.RouterActions && typeof window.RouterActions[action] === 'function'){
          window.RouterActions[action](el, e);
        }
    }
  });

  function parseHash(){
    const h = location.hash;
    let m;
    if((m = h.match(/^#\/memory\/([\d-]+)/))){
      const fallbackView = currentView === 'home' ? 'ourstory' : currentView;
      openView(fallbackView, {silent:true});
      openMemory(m[1]);
      return;
    }
    if((m = h.match(/^#\/special\/([\w-]+)/))){
      openSpecial(m[1]);
      return;
    }
    if((m = h.match(/^#\/view\/([\w-]+)/))){
      openView(m[1]);
      return;
    }
    openView('home', {silent:true});
  }

  window.addEventListener('hashchange', parseHash);

  window.Router = {
    registerView, registerSpecial,
    openView, openSpecial, closeSpecialDetail,
    openMemory, closeMemory,
    openLightbox, closeLightbox,
    closeAllOverlays, toast,
    init: parseHash,
    get currentView(){ return currentView; },
  };
})();
