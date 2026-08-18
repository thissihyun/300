/* ================================================================
   V3 LEGACY PHOTO BRIDGE
   V1 stored photos in Firestore `memories` docs:
     photos:YYYY-MM-DD -> JSON array of URLs/dataURLs
     hero:YYYY-MM-DD   -> JSON hero URL
     photometa:DATE:HASH -> JSON metadata
   V2 stores one photo per doc in `photos`.
   This bridge makes V3 read BOTH stores without modifying the images.
   ================================================================ */
(function(){
  'use strict';
  if(!window.DB || !window.firebase || !firebase.firestore) return;

  const raw = firebase.firestore();
  const originalOnAllPhotos = DB.onAllPhotos.bind(DB);
  const originalUpdatePhoto = DB.updatePhoto.bind(DB);
  const originalDeletePhoto = DB.deletePhoto.bind(DB);
  let legacyCache = [];
  let legacyLoaded = false;
  let loading = null;
  const subscribers = new Set();

  function hashUrl(src){
    let h=2166136261;
    src=String(src||'');
    for(let i=0;i<src.length;i++){ h^=src.charCodeAt(i); h=Math.imul(h,16777619); }
    return (h>>>0).toString(36);
  }
  function parseValue(doc, fallback){
    try{
      const d=doc.data();
      return d && typeof d.value==='string' ? JSON.parse(d.value) : fallback;
    }catch(e){ return fallback; }
  }
  async function setLegacyValue(key,value){
    await raw.collection('memories').doc(key).set({
      value:JSON.stringify(value),
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
  }
  async function deleteLegacyValue(key){
    try{ await raw.collection('memories').doc(key).delete(); }catch(e){}
  }

  async function loadLegacy(){
    if(loading) return loading;
    loading=(async()=>{
      try{
        const snap=await raw.collection('memories').get();
        const photosByDate={}, heroByDate={}, metaByKey={};
        snap.forEach(doc=>{
          const id=doc.id;
          if(id.startsWith('photos:')){
            const date=id.slice(7), arr=parseValue(doc,[]);
            if(Array.isArray(arr)) photosByDate[date]=arr.filter(Boolean);
          }else if(id.startsWith('hero:')){
            heroByDate[id.slice(5)]=parseValue(doc,null);
          }else if(id.startsWith('photometa:')){
            const rest=id.slice(10); // DATE:HASH
            const cut=rest.lastIndexOf(':');
            if(cut>0){ const date=rest.slice(0,cut), hash=rest.slice(cut+1); metaByKey[date+':'+hash]=parseValue(doc,null)||{}; }
          }
        });
        const out=[];
        Object.entries(photosByDate).forEach(([date,urls])=>{
          const seen=new Set();
          urls.forEach(url=>{
            url=String(url||''); if(!url||seen.has(url))return; seen.add(url);
            const h=hashUrl(url), meta=metaByKey[date+':'+h]||{};
            out.push({
              id:`legacy:${date}:${h}`,
              date,url,
              hero:heroByDate[date]===url,
              bookPick:!!meta.bookPick,
              place:meta.place||'', food:meta.food||'', type:meta.type||'', moods:Array.isArray(meta.moods)?meta.moods:[], caption:meta.caption||'',
              author:'V1', legacy:true, legacyHash:h
            });
          });
        });
        legacyCache=out; legacyLoaded=true;
      }catch(e){
        console.warn('[V3 legacy photos] load failed',e); legacyCache=[]; legacyLoaded=true;
      }finally{ loading=null; }
      broadcast();
      return legacyCache;
    })();
    return loading;
  }

  function mergePhotos(modern,legacy){
    modern=modern||[]; legacy=legacy||[];
    const exactModern=new Set(modern.map(p=>(p.date||'')+'\n'+(p.url||'')));
    const modernHeroDates=new Set(modern.filter(p=>p.hero).map(p=>p.date));
    const legacyClean=legacy.filter(p=>!exactModern.has((p.date||'')+'\n'+(p.url||''))).map(p=>{
      if(modernHeroDates.has(p.date) && p.hero) return {...p,hero:false};
      return p;
    });
    return modern.concat(legacyClean);
  }
  function broadcast(){
    subscribers.forEach(s=>{ if(s.alive){ try{s.cb(mergePhotos(s.modern,legacyCache))}catch(e){} } });
  }
  async function reloadLegacy(){ legacyLoaded=false; return loadLegacy(); }

  DB.onAllPhotos = function(cb){
    const state={cb,modern:[],alive:true}; subscribers.add(state);
    const unsub=originalOnAllPhotos(rows=>{ state.modern=rows||[]; if(state.alive)cb(mergePhotos(state.modern,legacyCache)); });
    // Real Firestore's onSnapshot never fires synchronously on registration —
    // every caller across this codebase (correctly) assumes that guarantee,
    // often subscribing at the top of a file before defining the functions/
    // variables the callback touches further down. Once legacyLoaded flips to
    // true (after the first load), calling cb() immediately here broke that
    // contract for every subsequent subscription — i.e. every later view
    // render — causing "Cannot access '...' before initialization" crashes
    // that silently killed whatever ran after the crash point (home hero
    // painting, calendar decoration, etc.) on the second-and-later render of
    // whatever view had just been opened.
    if(legacyLoaded) Promise.resolve().then(()=>{ if(state.alive) cb(mergePhotos(state.modern,legacyCache)); });
    else loadLegacy();
    return ()=>{ state.alive=false; subscribers.delete(state); try{unsub&&unsub()}catch(e){} };
  };

  function legacyPhotoById(id){ return legacyCache.find(p=>String(p.id)===String(id)); }
  DB.updatePhoto = async function(id,data){
    if(!String(id).startsWith('legacy:')) return originalUpdatePhoto(id,data);
    if(!legacyLoaded) await loadLegacy();
    const p=legacyPhotoById(id); if(!p) return;
    const metaFields=['place','food','type','moods','caption','bookPick'];
    if(metaFields.some(k=>Object.prototype.hasOwnProperty.call(data,k))){
      const meta={
        date:p.date,
        place:Object.prototype.hasOwnProperty.call(data,'place')?data.place:p.place,
        food:Object.prototype.hasOwnProperty.call(data,'food')?data.food:p.food,
        type:Object.prototype.hasOwnProperty.call(data,'type')?data.type:p.type,
        moods:Object.prototype.hasOwnProperty.call(data,'moods')?data.moods:(p.moods||[]),
        caption:Object.prototype.hasOwnProperty.call(data,'caption')?data.caption:p.caption,
        bookPick:Object.prototype.hasOwnProperty.call(data,'bookPick')?!!data.bookPick:!!p.bookPick,
        updatedAt:Date.now()
      };
      await setLegacyValue(`photometa:${p.date}:${p.legacyHash||hashUrl(p.url)}`,meta);
    }
    // V1 hero is one URL per date. `false` is intentionally a no-op; a parallel
    // true update (or a modern V2 hero) decides the replacement hero.
    if(data.hero===true) await setLegacyValue(`hero:${p.date}`,p.url);
    await reloadLegacy();
  };

  DB.deletePhoto = async function(id){
    if(!String(id).startsWith('legacy:')) return originalDeletePhoto(id);
    if(!legacyLoaded) await loadLegacy();
    const p=legacyPhotoById(id); if(!p) return;
    const photosDoc=await raw.collection('memories').doc(`photos:${p.date}`).get();
    const arr=photosDoc.exists?parseValue(photosDoc,[]):[];
    const next=(Array.isArray(arr)?arr:[]).filter(url=>String(url)!==String(p.url));
    await setLegacyValue(`photos:${p.date}`,next);
    const heroDoc=await raw.collection('memories').doc(`hero:${p.date}`).get();
    const hero=heroDoc.exists?parseValue(heroDoc,null):null;
    if(String(hero||'')===String(p.url)) await setLegacyValue(`hero:${p.date}`,next[0]||null);
    await deleteLegacyValue(`photometa:${p.date}:${p.legacyHash||hashUrl(p.url)}`);
    await reloadLegacy();
  };

  // Start loading immediately so Home/Calendar/Album get V1 photos on first render.
  loadLegacy();
  window.V3LegacyPhotos={reload:reloadLegacy,get photos(){return legacyCache.slice();}};
})();
