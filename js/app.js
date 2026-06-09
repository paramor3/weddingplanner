/* ============================================
   NikahPlanner — Main App Orchestrator
   ============================================ */

(function () {
  'use strict';

  // --- Modal Helpers (Global) ---
  window.openModal = function (id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      // Focus first input
      setTimeout(() => {
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) firstInput.focus();
      }, 200);
    }
  };

  window.closeModal = function (id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // --- Delete Confirmation Helper (Global) ---
  let pendingDelete = null;

  window.confirmDelete = function (collection, id, message) {
    pendingDelete = { collection, id };
    document.getElementById('delete-message').textContent = message || 'Apakah Anda yakin ingin menghapus item ini?';
    openModal('modal-delete');
  };

  // --- Init on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize login UI handlers
    Auth.initLoginUI();

    initCloseButtons();
    initSidebar();
    initRouting();
    initSettings();
    initDeleteConfirm();

    // Initialize all modules
    Dashboard.init();
    Checklist.init();
    Guests.init();
    Savings.init();
    Calculators.init();
    Timeline.init();
    Moodboard.init();
    PostNikah.init();

    // --- Auth State Listener ---
    initAuthFlow();
  });

  // --- Authentication Flow ---
  function initAuthFlow() {
    if (!firebaseAuth) {
      // Firebase not configured — show app without auth (fallback mode)
      console.warn('Firebase not configured. Running in offline mode.');
      hideLoading();
      Auth.showAppScreen();
      if (Store.isFirstRun()) {
        openModal('modal-setup');
      }
      return;
    }

    firebaseAuth.onAuthStateChanged((user) => {
      hideLoading();

      if (user) {
        // User is signed in
        console.log('🔐 User logged in:', user.email);

        // Show app, hide login
        Auth.showAppScreen();
        Auth.updateUserUI(user);

        // Enable cloud sync
        Store.enableCloudSync(user.uid).then(() => {
          // Refresh all modules with synced data
          refreshAllModules();

          // Check first run
          if (Store.isFirstRun()) {
            openModal('modal-setup');
          }
        });
      } else {
        // User is signed out
        console.log('🔓 User logged out');
        Store.disableCloudSync();
        Auth.showLoginScreen();
      }
    });
  }

  function hideLoading() {
    const loading = document.getElementById('login-loading');
    if (loading) loading.classList.remove('active');
  }

  function refreshAllModules() {
    // Refresh dashboard
    if (typeof Dashboard !== 'undefined' && Dashboard.refresh) {
      Dashboard.refresh();
    }
    // Re-render modules that have render methods
    if (typeof Checklist !== 'undefined' && Checklist.render) {
      Checklist.render();
    }
    if (typeof Guests !== 'undefined' && Guests.render) {
      Guests.render();
    }
    if (typeof Savings !== 'undefined' && Savings.render) {
      Savings.render();
    }
    if (typeof Timeline !== 'undefined' && Timeline.render) {
      Timeline.render();
    }
    if (typeof Moodboard !== 'undefined' && Moodboard.render) {
      Moodboard.render();
    }
    if (typeof PostNikah !== 'undefined' && PostNikah.render) {
      PostNikah.render();
    }
  }

  // --- Close Buttons for Modals ---
  function initCloseButtons() {
    // Close buttons with data-close attribute
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close]');
      if (closeBtn) {
        closeModal(closeBtn.dataset.close);
        return;
      }

      // Click on overlay to close
      const overlay = e.target.closest('.modal-overlay');
      if (overlay && e.target === overlay && overlay.id !== 'modal-setup') {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal-overlay.active');
        openModals.forEach(m => {
          if (m.id !== 'modal-setup') {
            m.classList.remove('active');
          }
        });
        document.body.style.overflow = '';
      }
    });
  }

  // --- Sidebar / Navigation ---
  function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuBtn = document.getElementById('mobile-menu-btn');

    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });

    // Nav items click
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        navigateTo(page);

        // Close mobile sidebar
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    });
  }

  // --- Hash-based Routing ---
  function initRouting() {
    window.addEventListener('hashchange', () => {
      const page = location.hash.slice(1) || 'dashboard';
      showPage(page);
    });

    // Initial page
    const initialPage = location.hash.slice(1) || 'dashboard';
    showPage(initialPage);
  }

  function navigateTo(page) {
    location.hash = page;
  }

  function showPage(page) {
    // Hide all sections
    document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));

    // Show target section
    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.add('active');
      // Trigger re-render for animation
      target.style.animation = 'none';
      target.offsetHeight; // force reflow
      target.style.animation = '';
    }

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Refresh dashboard charts when navigating to it (Chart.js resize fix)
    if (page === 'dashboard') {
      setTimeout(() => Dashboard.refresh(), 100);
    }
  }

  // --- Setup & Settings ---
  function initSettings() {
    // First-run setup save
    document.getElementById('btn-setup-save').addEventListener('click', () => {
      const groom = document.getElementById('setup-groom').value.trim();
      const bride = document.getElementById('setup-bride').value.trim();
      const date = document.getElementById('setup-date').value;

      if (!groom || !bride || !date) {
        showToast('Mohon isi semua data untuk memulai', 'warning');
        return;
      }

      Store.saveSettings({
        groomName: groom,
        brideName: bride,
        weddingDate: date,
      });

      closeModal('modal-setup');
      showToast(`Selamat, ${groom} & ${bride}! Mari mulai merencanakan! 💍`, 'success', 4000);
      Dashboard.refresh();
    });

    // Open settings modal
    document.getElementById('btn-settings').addEventListener('click', () => {
      const settings = Store.getSettings();
      document.getElementById('set-groom').value = settings.groomName || '';
      document.getElementById('set-bride').value = settings.brideName || '';
      document.getElementById('set-date').value = settings.weddingDate || '';
      openModal('modal-settings');
    });

    // Save settings
    document.getElementById('btn-settings-save').addEventListener('click', () => {
      const groom = document.getElementById('set-groom').value.trim();
      const bride = document.getElementById('set-bride').value.trim();
      const date = document.getElementById('set-date').value;

      if (!groom || !bride || !date) {
        showToast('Mohon isi semua data', 'warning');
        return;
      }

      Store.saveSettings({
        groomName: groom,
        brideName: bride,
        weddingDate: date,
      });

      closeModal('modal-settings');
      showToast('Pengaturan berhasil disimpan', 'success');
    });

    // Reset data
    document.getElementById('btn-reset-data').addEventListener('click', () => {
      if (confirm('PERINGATAN: Semua data akan dihapus permanen. Lanjutkan?')) {
        Store.clearAll();
        closeModal('modal-settings');
        showToast('Semua data berhasil direset', 'warning');
        setTimeout(() => location.reload(), 500);
      }
    });
  }

  // --- Delete Confirmation ---
  function initDeleteConfirm() {
    document.getElementById('btn-delete-confirm').addEventListener('click', () => {
      if (pendingDelete) {
        Store.deleteItem(pendingDelete.collection, pendingDelete.id);
        showToast('Item berhasil dihapus', 'success');
        pendingDelete = null;
      }
      closeModal('modal-delete');
    });
  }
})();
