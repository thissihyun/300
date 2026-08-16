/* ================================================================
   300 DAYS WITH YOU — LOCAL STORE + IDENTITY
   Everything here is per-device (localStorage/sessionStorage) except
   the PIN hash itself, which lives in Firestore so either phone can
   verify it. See Section 4 / 81 of the spec.
   ================================================================ */
(function(){
  const USERS = [
    {id:'sihyun', name:'시현'},
    {id:'gangwon', name:'강원'},
  ];

  const LS = {
    get(key, fallback){ try{ const v = localStorage.getItem(key); return v===null ? fallback : JSON.parse(v); }catch(e){ return fallback; } },
    set(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} },
  };

  function bufToHex(buf){ return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''); }
  function hexToBuf(hex){ const arr = new Uint8Array(hex.length/2); for(let i=0;i<arr.length;i++) arr[i]=parseInt(hex.substr(i*2,2),16); return arr; }
  function randomSaltHex(){ const arr = new Uint8Array(16); crypto.getRandomValues(arr); return bufToHex(arr); }

  async function derivePin(pin, saltHex){
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), {name:'PBKDF2'}, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      {name:'PBKDF2', salt: hexToBuf(saltHex), iterations: 100000, hash: 'SHA-256'},
      keyMaterial, 256
    );
    return bufToHex(bits);
  }

  const Identity = {
    users: USERS,
    current(){ return LS.get('user300_identity', null); },
    setCurrent(userId){ LS.set('user300_identity', userId); },
    displayName(userId){ const u = USERS.find(x=>x.id===userId); return u ? u.name : ''; },

    async hasPin(userId){
      const doc = await DB.getPinDoc(userId);
      return !!doc;
    },
    async createPin(userId, pin){
      const salt = randomSaltHex();
      const hash = await derivePin(pin, salt);
      await DB.setPinDoc(userId, {salt, hash});
    },
    async verifyPin(userId, pin){
      const doc = await DB.getPinDoc(userId);
      if(!doc) return false;
      const hash = await derivePin(pin, doc.salt);
      return hash === doc.hash;
    },
  };

  const Prefs = {
    get reminderEnabled(){ return LS.get('user300_reminderEnabled', true); },
    set reminderEnabled(v){ LS.set('user300_reminderEnabled', v); },
    get reminderTime(){ return LS.get('user300_reminderTime', '21:30'); },
    set reminderTime(v){ LS.set('user300_reminderTime', v); },
    get partnerActivityNotif(){ return LS.get('user300_partnerNotif', true); },
    set partnerActivityNotif(v){ LS.set('user300_partnerNotif', v); },
    get musicMuted(){ return LS.get('user300_musicMuted', false); },
    set musicMuted(v){ LS.set('user300_musicMuted', v); },
    get lastReadNotifAt(){ return LS.get('user300_lastReadNotifAt', 0); },
    set lastReadNotifAt(v){ LS.set('user300_lastReadNotifAt', v); },
  };

  window.Identity = Identity;
  window.Prefs = Prefs;
})();
