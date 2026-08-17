/* Loader — data + app layers. Click-routing consolidated onto a single
   handler per area (v28 for map/constellation/season pins, v38 for the
   SPECIAL grid) after v30/v39/v40 were found to double-fire navigation
   (once on pointerdown, once via the native handler) and to hijack
   calendar-day taps away from the intended bottom-sheet preview. */
document.write('<script src="https://cdn.jsdelivr.net/gh/thissihyun/300@f504a42c66b2d59521c6869713caf966d8ee33bc/data/curated-chat.js"><\/script>');
document.write('<script src="assets/daily-us-v24.js"><\/script>');
document.write('<script src="assets/identity-v25.js"><\/script>');
document.write('<script src="assets/v26-bootstrap.js"><\/script>');
document.write('<script src="assets/v26-core.js"><\/script>');
document.write('<script src="assets/v26-special.js"><\/script>');
document.write('<script src="assets/v26-future.js"><\/script>');
document.write('<script src="assets/v26-pwa.js"><\/script>');
document.write('<script src="assets/v26-polish.js"><\/script>');
document.write('<script src="assets/v27-repair-restore.js"><\/script>');
document.write('<script src="assets/v28-click-hotfix.js?build=20260816-0035"><\/script>');
document.write('<script src="assets/v29-photo-first.js?build=20260816-0049"><\/script>');
document.write('<script src="assets/v31-calendar-album.js?build=20260816-0108"><\/script>');
document.write('<script src="assets/v31-polish.js?build=20260816-0124"><\/script>');
document.write('<script src="assets/v32-readable-structure.js?build=20260816-1014"><\/script>');
document.write('<script src="assets/v33-calendar-special-future.js?build=20260816-1026"><\/script>');
document.write('<script src="assets/v34-special-shelf-restore.js?build=20260816-2234"><\/script>');