/* ============================================
   NikahPlanner — Savings / Tabungan Module
   ============================================ */

const Savings = (() => {
  let editingId = null;

  const sourceLabels = {
    CPP: 'Calon Pengantin Pria',
    CPW: 'Calon Pengantin Wanita',
    Gabungan: 'Dana Gabungan / Hibah',
  };

  const sourceClasses = {
    CPP: 'source-cpp',
    CPW: 'source-cpw',
    Gabungan: 'source-gabungan',
  };

  function init() {
    render();
    bindEvents();
    Store.on('savings', render);
    Store.on('checklist', render); // for budget update
  }

  function bindEvents() {
    document.getElementById('btn-add-saving').addEventListener('click', () => {
      editingId = null;
      document.getElementById('modal-saving-title').textContent = 'Tambah Setoran';
      clearSavingForm();
      openModal('modal-saving');
    });

    document.getElementById('btn-saving-save').addEventListener('click', saveSaving);

    // Table actions
    document.getElementById('savings-tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'edit') {
        editSaving(id);
      } else if (action === 'delete') {
        confirmDelete('savings', id, 'Apakah Anda yakin ingin menghapus setoran ini?');
      }
    });

    setupRupiahInput(document.getElementById('saving-amount'));
  }

  function clearSavingForm() {
    document.getElementById('saving-date').value = formatDateInput(new Date());
    document.getElementById('saving-source').value = 'CPP';
    document.getElementById('saving-amount').value = '';
    document.getElementById('saving-note').value = '';
  }

  function saveSaving() {
    const amount = getRupiahValue(document.getElementById('saving-amount'));
    if (!amount || amount <= 0) {
      showToast('Nominal harus diisi dan lebih dari 0', 'danger');
      return;
    }

    const data = {
      date: document.getElementById('saving-date').value,
      source: document.getElementById('saving-source').value,
      amount: amount,
      note: document.getElementById('saving-note').value.trim(),
    };

    if (editingId) {
      Store.updateItem('savings', editingId, data);
      showToast('Setoran berhasil diperbarui', 'success');
    } else {
      data.id = generateId();
      Store.addItem('savings', data);
      showToast('Setoran berhasil ditambahkan', 'success');
    }

    closeModal('modal-saving');
    editingId = null;
  }

  function editSaving(id) {
    const item = Store.getById('savings', id);
    if (!item) return;

    editingId = id;
    document.getElementById('modal-saving-title').textContent = 'Edit Setoran';
    document.getElementById('saving-date').value = item.date || '';
    document.getElementById('saving-source').value = item.source;
    document.getElementById('saving-amount').value = Number(item.amount).toLocaleString('id-ID');
    document.getElementById('saving-note').value = item.note || '';

    openModal('modal-saving');
  }

  function render() {
    const items = Store.getAll('savings');
    const totalSavings = Store.getTotalSavings();
    const totalBudget = Store.getTotalBudget();
    const remaining = Math.max(0, totalBudget - totalSavings);
    const pct = totalBudget > 0 ? Math.min(100, Math.round((totalSavings / totalBudget) * 100)) : 0;

    // Overview stats
    document.getElementById('sv-total').textContent = formatRupiah(totalSavings);
    document.getElementById('sv-entries').textContent = items.length + ' transaksi';
    document.getElementById('sv-budget').textContent = formatRupiah(totalBudget);
    document.getElementById('sv-remaining').textContent = formatRupiah(remaining);

    const remainSub = document.getElementById('sv-remaining-sub');
    if (totalBudget > 0 && totalSavings >= totalBudget) {
      remainSub.textContent = '🎉 Target tercapai!';
      remainSub.style.color = 'var(--color-success)';
    } else {
      remainSub.textContent = '';
      remainSub.style.color = '';
    }

    // Progress bar
    document.getElementById('sv-progress-pct').textContent = pct + '%';
    document.getElementById('sv-progress-fill').style.width = pct + '%';

    // Table
    const tbody = document.getElementById('savings-tbody');
    const empty = document.getElementById('savings-empty');

    if (items.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';

    // Sort by date descending
    const sorted = [...items].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });

    tbody.innerHTML = sorted.map(item => {
      const srcClass = sourceClasses[item.source] || 'source-gabungan';
      return `
        <tr>
          <td class="date-cell">${item.date ? formatDateShort(item.date) : '-'}</td>
          <td><span class="badge ${srcClass}">${sourceLabels[item.source] || item.source}</span></td>
          <td class="amount-cell">${formatRupiah(item.amount)}</td>
          <td class="note-cell">${item.note ? escapeHtml(item.note) : ''}</td>
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
