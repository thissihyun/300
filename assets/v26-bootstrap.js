/* V26 bootstrap: expose the existing lexical Firebase handle after the main app creates it. */
(function expose(){
  try{
    if(typeof db!=='undefined'){
      window.db=db;
      return;
    }
  }catch(e){}
  setTimeout(expose,80);
})();