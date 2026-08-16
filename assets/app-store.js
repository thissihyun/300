const firebaseConfig = {
  apiKey: 'AIzaSyD9r3fextuHYAQR3SWI6XlJ5WuB4iQeMtc',
  authDomain: 'days-with-you.firebaseapp.com',
  projectId: 'days-with-you',
  storageBucket: 'days-with-you.firebasestorage.app',
  messagingSenderId: '140527182407',
  appId: '1:140527182407:web:09eb9b6b7c5b9dd6fac762'
};

let db=null, fbStorage=null, online=false;
try{
  if(window.firebase){
    if(!firebase.apps?.length) firebase.initializeApp(firebaseConfig);
    db=firebase.firestore();
    fbStorage=firebase.storage();
    online=true;
  }
}catch(err){ console.warn('[300 Days] Firebase init failed, using local fallback.',err); }

const LOCAL_PREFIX='clean300:';
const parse=v=>{try{return JSON.parse(v)}catch{return v}};
const stringify=v=>typeof v==='string'?v:JSON.stringify(v);

async function rawGet(key){
  if(db){
    const snap=await db.collection('memories').doc(key).get();
    if(!snap.exists) return null;
    return snap.data().value ?? null;
  }
  return localStorage.getItem(LOCAL_PREFIX+key);
}
async function rawSet(key,value){
  if(db){
    await db.collection('memories').doc(key).set({value,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    return;
  }
  localStorage.setItem(LOCAL_PREFIX+key,value);
}
async function rawDelete(key){
  if(db) return db.collection('memories').doc(key).delete();
  localStorage.removeItem(LOCAL_PREFIX+key);
}
async function listKeys(prefix=''){
  if(db){
    const f=firebase.firestore.FieldPath.documentId();
    const snap=await db.collection('memories').orderBy(f).startAt(prefix).endAt(prefix+'\uf8ff').get();
    return snap.docs.map(d=>d.id);
  }
  return Object.keys(localStorage).filter(k=>k.startsWith(LOCAL_PREFIX+prefix)).map(k=>k.slice(LOCAL_PREFIX.length));
}

export const Store={
  online:()=>online,
  async get(key,fallback=null){const v=await rawGet(key); return v==null?fallback:parse(v)},
  async set(key,value){return rawSet(key,stringify(value))},
  async remove(key){return rawDelete(key)},
  async keys(prefix=''){return listKeys(prefix)},
  async entries(prefix=''){
    const keys=await listKeys(prefix);
    const rows=await Promise.all(keys.map(async key=>[key,await this.get(key,null)]));
    return rows;
  },
  async log(type,date,author,text,extra={}){
    const payload={type,date,author,text,clientTime:Date.now(),...extra};
    if(db){
      await db.collection('activity').add({...payload,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    }else{
      const rows=parse(localStorage.getItem(LOCAL_PREFIX+'activity')||'[]'); rows.unshift({...payload,id:'l'+Date.now()});
      localStorage.setItem(LOCAL_PREFIX+'activity',JSON.stringify(rows.slice(0,200)));
    }
  },
  subscribeActivity(callback){
    if(db){
      return db.collection('activity').orderBy('clientTime','desc').limit(50).onSnapshot(s=>callback(s.docs.map(d=>({id:d.id,...d.data()}))),()=>callback([]));
    }
    callback(parse(localStorage.getItem(LOCAL_PREFIX+'activity')||'[]'));
    return ()=>{};
  },
  async uploadPhoto(file,date){
    if(fbStorage){
      const safe=(file.name||'photo.jpg').replace(/[^a-zA-Z0-9._-]+/g,'_');
      const ref=fbStorage.ref().child(`photos/${date}/${Date.now()}_${safe}`);
      await ref.put(file,{contentType:file.type||'image/jpeg'});
      return ref.getDownloadURL();
    }
    if(file.size>720000) throw new Error('photo-too-large-without-storage');
    return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
  }
};

export const Keys={
  photos:d=>`photos:${d}`,
  hero:d=>`hero:${d}`,
  favorite:d=>`fav:${d}`,
  note:d=>`note:${d}`,
  entry:d=>`entry:${d}`,
  daily:(d,u)=>`checkin:${d}:${u}`,
  dailyLine:(d,u)=>`dailyline:${d}:${u}`,
  gratitude:(d,u)=>`gratitude:${d}:${u}`,
  answer:(d,u)=>`qanswer:${d}:${u}`,
  reaction:(d,u)=>`reaction:${d}:${u}`,
  comments:d=>`comments:${d}`,
  identityPin:u=>`identitypin:${u}`,
  bookPick:(d,id)=>`bookpick:${d}:${id}`,
  photoMeta:(d,id)=>`photometa:${d}:${id}`,
  booth:d=>`photobooth:${d}`
};
