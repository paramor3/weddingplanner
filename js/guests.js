/* ============================================
   NikahPlanner — Guest List Module
   ============================================ */

const Guests = (() => {
  let editingId = null;
  let searchTerm = '';

  const catClasses = {
    'Keluarga Pria': 'cat-keluarga-pria',
    'Keluarga Wanita': 'cat-keluarga-wanita',
    'Teman Pria': 'cat-teman-pria',
    'Teman Wanita': 'cat-teman-wanita',
    'VIP/Lainnya': 'cat-vip',
  };

  function init() {
    render();
    bindEvents();
    Store.on('guests', render);
  }

  function bindEvents() {
    document.getElementById('btn-add-guest').addEventListener('click', () => {
      editingId = null;
      document.getElementById('modal-guest-title').textContent = 'Tambah Tamu';
      clearGuestForm();
      openModal('modal-guest');
    });

    document.getElementById('btn-guest-save').addEventListener('click', saveGuest);

    // Search
    document.getElementById('guest-search-input').addEventListener('input', debounce((e) => {
      searchTerm = e.target.value.toLowerCase();
      render();
    }, 200));

    // Table actions
    document.getElementById('guest-tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'edit') {
        editGuest(id);
      } else if (action === 'delete') {
        confirmDelete('guests', id, 'Apakah Anda yakin ingin menghapus tamu ini?');
      }
    });
  }

  function clearGuestForm() {
    document.getElementById('guest-name').value = '';
    document.getElementById('guest-category').value = 'Keluarga Pria';
    document.getElementById('guest-pax').value = '2';
  }

  function saveGuest() {
    const name = document.getElementById('guest-name').value.trim();
    if (!name) {
      showToast('Nama tamu harus diisi', 'danger');
      return;
    }

    const data = {
      name: name,
      category: document.getElementById('guest-category').value,
      pax: parseInt(document.getElementById('guest-pax').value) || 1,
    };

    if (editingId) {
      Store.updateItem('guests', editingId, data);
      showToast('Data tamu berhasil diperbarui', 'success');
    } else {
      data.id = generateId();
      Store.addItem('guests', data);
      showToast('Tamu berhasil ditambahkan', 'success');
    }

    closeModal('modal-guest');
    editingId = null;
  }

  function editGuest(id) {
    const item = Store.getById('guests', id);
    if (!item) return;

    editingId = id;
    document.getElementById('modal-guest-title').textContent = 'Edit Tamu';
    document.getElementById('guest-name').value = item.name;
    document.getElementById('guest-category').value = item.category;
    document.getElementById('guest-pax').value = item.pax;

    openModal('modal-guest');
  }

  function render() {
    let items = Store.getAll('guests');

    // Search filter
    if (searchTerm) {
      items = items.filter(i => i.name.toLowerCase().includes(searchTerm));
    }

    const allItems = Store.getAll('guests');
    const tbody = document.getElementById('guest-tbody');
    const empty = document.getElementById('guest-empty');

    // Stats
    document.getElementById('guest-total-entries').textContent = allItems.length;
    document.getElementById('guest-total-pax').textContent = formatNumber(Store.getTotalGuests());

    if (items.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = allItems.length === 0 ? 'flex' : 'none';
      return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = items.map(item => {
      const catClass = catClasses[item.category] || 'cat-vip';
      return `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td><span class="badge ${catClass}">${item.category}</span></td>
          <td class="pax-cell">${item.pax}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-ghost btn-icon btn-sm" data-action="edit" data-id="${item.id}" title="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-ghost btn-icon btn-sm" data-action="delete" data-id="${item.id}" title="Hapus" style="color: var(--color-danger);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  return { init, render };
})();
