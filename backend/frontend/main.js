// Small loader to keep backward-compatible <script src="main.js"> includes.
// This will dynamically load the actual script file `app.js` which contains the application logic.
(function(){
  try {
    // Determine the base path for this script so `app.js` is loaded from the same folder
    var base = '';
    // Prefer document.currentScript if available
    var cur = document.currentScript;
    if (!cur) {
      // Fallback: find a script tag whose src ends with 'main.js'
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].src || '';
        if (src.match(/\/main\.js($|\?)/i)) { cur = scripts[i]; break; }
      }
    }

    if (cur && cur.src) {
      try {
        var u = new URL(cur.src, window.location.href);
        u.pathname = u.pathname.replace(/\/main\.js$/i, '/app.js');
        base = u.href;
      } catch (e) {
        // fallback to relative path
        base = 'app.js';
      }
    } else {
      base = 'app.js';
    }

    var s = document.createElement('script');
    s.src = base;
    s.async = false; // preserve execution order when inserted late in the document
    document.head.appendChild(s);
    console.log('Loaded app.js via main.js from', base);
  } catch (e) {
    console.error('Failed to load app.js from main.js', e);
  }
})();
