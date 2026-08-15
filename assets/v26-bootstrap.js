/* V26 bootstrap: expose the existing lexical Firebase handle to additive modules without changing index.html. */
try{if(typeof db!=='undefined')window.db=db}catch(e){}