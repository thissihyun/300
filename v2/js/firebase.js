/* ================================================================
   300 DAYS WITH YOU — SHARED DATA LAYER (Firebase)
   One module. Every screen reads/writes through DB, never through
   firebase.* directly. Keeps the whole app on one data contract.
   ================================================================ */
(function(){
  const firebaseConfig = {
    apiKey: "AIzaSyD9r3fextuHYAQR3SWI6XlJ5WuB4iQeMtc",
    authDomain: "days-with-you.firebaseapp.com",
    projectId: "days-with-you",
    storageBucket: "days-with-you.firebasestorage.app",
    messagingSenderId: "140527182407",
    appId: "1:140527182407:web:09eb9b6b7c5b9dd6fac762"
  };

  let db = null, ready = false;
  try {
    if (window.firebase) {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      ready = true;
    }
  } catch (e) { console.warn('[300 Days] Firebase init failed', e); }

  function col(name){ return db.collection(name); }
  function serverTime(){ return ready ? firebase.firestore.FieldValue.serverTimestamp() : Date.now(); }

  async function setDoc(collection, id, data){
    if(!ready) return;
    await col(collection).doc(id).set({...data, updatedAt: serverTime()}, {merge:true});
  }
  async function getDoc(collection, id){
    if(!ready) return null;
    const snap = await col(collection).doc(id).get();
    return snap.exists ? snap.data() : null;
  }
  async function addDoc(collection, data){
    if(!ready) return null;
    const ref = await col(collection).add({...data, createdAt: serverTime()});
    return ref.id;
  }
  function onCollection(collection, cb, opts){
    if(!ready) return () => {};
    let q = col(collection);
    if(opts && opts.orderBy) q = q.orderBy(opts.orderBy, opts.dir || 'asc');
    if(opts && opts.limit) q = q.limit(opts.limit);
    return q.onSnapshot(snap => {
      const rows = [];
      snap.forEach(d => rows.push({id:d.id, ...d.data()}));
      cb(rows);
    }, err => console.warn('[300 Days] onSnapshot error', collection, err));
  }
  function onDoc(collection, id, cb){
    if(!ready) return () => {};
    return col(collection).doc(id).onSnapshot(snap => cb(snap.exists ? snap.data() : null));
  }
  async function deleteDoc(collection, id){
    if(!ready) return;
    await col(collection).doc(id).delete();
  }

  /* ---- domain helpers (thin, so views never touch raw collection names) ---- */
  const DB = {
    ready: () => ready,

    // Diary: mood + one-line record, one doc per date+user
    setDailyRecord: (date, user, data) => setDoc('diary', `${date}_${user}`, {date, user, ...data}),
    onDailyRecordsForDate: (date, cb) => onCollection('diary', rows => cb(rows.filter(r=>r.date===date))),
    onAllDailyRecords: (cb) => onCollection('diary', cb),

    // Gratitude: "thank you" letters, one doc per date+author
    setGratitude: (date, from, text) => setDoc('gratitude', `${date}_${from}`, {date, from, text}),
    onGratitudeForDate: (date, cb) => onCollection('gratitude', rows => cb(rows.filter(r=>r.date===date))),
    onAllGratitude: (cb) => onCollection('gratitude', cb),

    // Question answers: one doc per date+user
    setAnswer: (date, user, questionIndex, text) => setDoc('answers', `${date}_${user}`, {date, user, questionIndex, text}),
    onAnswersForDate: (date, cb) => onCollection('answers', rows => cb(rows.filter(r=>r.date===date))),
    onAllAnswers: (cb) => onCollection('answers', cb),

    // Comments per memory date
    addComment: (date, author, text) => addDoc('comments', {date, author, text}),
    onCommentsForDate: (date, cb) => onCollection('comments', rows => cb(rows.filter(r=>r.date===date).sort((a,b)=> (a.createdAt?.seconds||0)-(b.createdAt?.seconds||0)))),

    // Individual like per date+user, favorite (mutual-independent) per date
    setLiked: (date, user, liked) => setDoc('reactions', `${date}_${user}`, {date, user, liked}),
    onAllReactions: (cb) => onCollection('reactions', cb),
    setFavorite: (date, value) => setDoc('favorites', date, {date, value}),
    onAllFavorites: (cb) => onCollection('favorites', cb),
    onFavorite: (date, cb) => onDoc('favorites', date, cb),

    // Free-form note per date (Memory Detail "나의 한 줄")
    setNote: (date, text) => setDoc('notes', date, {date, text}),
    onNote: (date, cb) => onDoc('notes', date, cb),

    // Photos
    addPhoto: (data) => addDoc('photos', data),
    updatePhoto: (id, data) => setDoc('photos', id, data),
    deletePhoto: (id) => deleteDoc('photos', id),
    onAllPhotos: (cb) => onCollection('photos', cb),

    // Future: postcards / bucket list / letters
    addPostcard: (data) => addDoc('future_postcards', data),
    updatePostcard: (id, data) => setDoc('future_postcards', id, data),
    deletePostcard: (id) => deleteDoc('future_postcards', id),
    onPostcards: (cb) => onCollection('future_postcards', cb),

    addBucketItem: (data) => addDoc('future_bucket', data),
    updateBucketItem: (id, data) => setDoc('future_bucket', id, data),
    deleteBucketItem: (id) => deleteDoc('future_bucket', id),
    onBucketItems: (cb) => onCollection('future_bucket', cb),

    addLetter: (data) => addDoc('future_letters', data),
    onLetters: (cb) => onCollection('future_letters', cb, {orderBy:'createdAt', dir:'asc'}),

    // Mini awards votes
    setAwardVote: (awardId, user, candidate) => setDoc('awards', `${awardId}_${user}`, {awardId, user, candidate}),
    onAwardVotes: (cb) => onCollection('awards', cb),

    // Book picks live on the photo doc itself (bookPick: bool) — no extra collection needed.

    // Activity feed (Section 69 / Notifications)
    logActivity: (type, date, author, text) => addDoc('activity', {type, date, author, text, clientTime: Date.now()}),
    onActivity: (cb) => onCollection('activity', rows => cb(rows.sort((a,b)=>(b.clientTime||0)-(a.clientTime||0)).slice(0,50))),

    // PIN hashes (Section 4) — salted PBKDF2, never the raw PIN
    getPinDoc: (userId) => getDoc('pins', userId),
    setPinDoc: (userId, data) => setDoc('pins', userId, data),

    // Kakao import aggregates (Section 53/54) — counts only, never raw text
    setKakaoStats: (data) => setDoc('kakao_stats', 'summary', data),
    onKakaoStats: (cb) => onDoc('kakao_stats', 'summary', cb),
  };

  window.DB = DB;
})();
