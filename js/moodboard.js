/* ============================================
   NikahPlanner — Moodboard Module
   ============================================ */

const Moodboard = (() => {
  let currentFilter = 'all';

  function init() {
    render();
    bindEvents();
    Store.on('moodboard', render);
  }

  function bindEvents() {
    document.getElementById('btn-add-mood').addEventListener('click', () => {
      document.getElementById('mood-title').value = '';
      document.getElementById('mood-url').value = '';
      document.getElementById('mood-category').value = 'Dekorasi';
      openModal('modal-mood');
    });

    document.getElementById('btn-mood-save').addEventListener('click', saveMood);

    // Filter tabs
    document.getElementById('mood-filters').addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;
      document.querySelectorAll('#mood-filters .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      render();
    });
  }

  function saveMood() {
    const title = document.getElementById('mood-title').value.trim();
    const url = document.getElementById('mood-url').value.trim();

    if (!title || !url) {
      showToast('Judul dan URL harus diisi', 'danger');
      return;
    }

    Store.addItem('moodboard', {
      id: generateId(),
      title: title,
      url: url,
      category: document.getElementById('mood-category').value,
    });

    closeModal('modal-mood');
    showToast('Referensi berhasil ditambahkan', 'success');
  }

  function render() {
    let items = Store.getAll('moodboard');
    if (currentFilter !== 'all') {
      items = items.filter(i => i.category === currentFilter);
    }

    const grid = document.getElementById('moodboard-grid');
    const empty = document.getElementById('mood-empty');

    if (items.length === 0) {
      grid.innerHTML = '';
      empty.style.display = Store.getAll('moodboard').length === 0 ? 'flex' : 'none';
      return;
    }

    empty.style.display = 'none';

    const catColors = {
      'Tema Warna': 'badge-accent',
      'Dekorasi': 'badge-sage',
      'Attire': 'badge-lavender',
      'Venue': 'badge-primary',
      'Fotografi': 'badge-info',
    };

    grid.innerHTML = items.map(item => {
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(item.url);
      const badgeClass = catColors[item.category] || 'badge-primary';

      return `
        <div class="mood-card">
          <div class="mood-card-preview">
            ${isImage
              ? `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="link-icon" style="display:none"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>`
              : `<div class="link-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>`
            }
          </div>
          <div class="mood-card-body">
            <h4>${escapeHtml(item.title)}</h4>
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="mood-url">${escapeHtml(item.url)}</a>
          </div>
          <div class="mood-card-footer">
            <span class="badge ${badgeClass}">${item.category}</span>
            <button class="btn btn-ghost btn-icon btn-sm" onclick="confirmDelete('moodboard','${item.id}','Hapus referensi ini?')" style="color: var(--color-danger);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  return { init, render };
})();
