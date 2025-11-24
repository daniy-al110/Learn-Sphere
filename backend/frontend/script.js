// Minimal UI helpers for student landing page
// Provides `showPage(pageId)` and sidebar overlay toggles so buttons work
(function () {
  function hideAllPages() {
    document.querySelectorAll('.page').forEach(function (el) {
      el.classList.add('hidden');
      el.classList.remove('block');
    });
  }

  function showPageImpl(pageId) {
    if (!pageId) return;
    hideAllPages();
    var page = document.getElementById(pageId);
    if (page) {
      page.classList.remove('hidden');
      page.classList.add('block');
      // scroll to top of main content
      try { page.scrollTop = 0; } catch (e) {}
    }

    // update active nav state
    document.querySelectorAll('.nav-item').forEach(function (item) {
      if (item.dataset && item.dataset.page === pageId) {
        item.classList.add('bg-white', 'bg-opacity-20');
      } else {
        item.classList.remove('bg-white', 'bg-opacity-20');
      }
    });
  }

  // expose oldShowPage if present
  var old = window.showPage || function () {};
  window.showPage = function (pageId) {
    try { old(pageId); } catch (e) {}
    showPageImpl(pageId);
  };

  // Sidebar toggles for mobile
  window.openSidebar = function () {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (overlay) { overlay.classList.remove('invisible'); overlay.classList.remove('opacity-0'); }
  };
  window.closeSidebar = function () {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) { overlay.classList.add('opacity-0'); overlay.classList.add('invisible'); }
  };

  // overlay click closes sidebar
  document.addEventListener('click', function (e) {
    var overlay = document.getElementById('sidebarOverlay');
    if (!overlay) return;
    if (e.target === overlay) closeSidebar();
  });

  // small helper to wire menu button if present
  document.addEventListener('DOMContentLoaded', function () {
    var menuBtn = document.querySelector('button[aria-label="menu"]') || document.querySelector('button span.material-symbols-outlined');
    // if there is a menu button with material icon, wire toggle
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        var sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        if (sidebar.classList.contains('-translate-x-full')) openSidebar(); else closeSidebar();
      });
    }
  });

})();
