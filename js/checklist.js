/* ============================================
   NikahPlanner — Checklist & Vendor Module
   ============================================ */

const Checklist = (() => {
  let editingId = null;
  let currentFilter = 'all';

  const picClasses = {
    CPP: 'pic-cpp',
    CPW: 'pic-cpw',
    Keluarga: 'pic-keluarga',
    WO: 'pic-wo',
  };

  function init() {
    render();
    bindEvents();
    Store.on('checklist', render);
  }

  function bindEvents() {
    // Add task button
    document.getElementById('btn-add-task').addEventListener('click', () => {
      editingId = null;
      document.getElementById('modal-task-title').textContent = 'Tambah Tugas';
      clearTaskForm();
      openModal('modal-task');
    });

    // Save task
    document.getElementById('btn-task-save').addEventListener('click', saveTask);

    // Filter tabs
    document.getElementById('checklist-filters').addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;
      document.querySelectorAll('#checklist-filters .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      render();
    });

    // Table actions (delegate)
    document.getElementById('checklist-tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'toggle') {
        const item = Store.getById('checklist', id);
        if (item) {
          Store.updateItem('checklist', id, { completed: !item.completed });
          showToast(item.completed ? 'Tugas ditandai belum selesai' : 'Tugas ditandai selesai ✓', 'success');
        }
      } else if (action === 'edit') {
        editTask(id);
      } else if (action === 'delete') {
        confirmDelete('checklist', id, 'Apakah Anda yakin ingin menghapus tugas ini?');
      }
    });

    // Setup rupiah input
    setupRupiahInput(document.getElementById('task-budget'));
  }

  function clearTaskForm() {
    document.getElementById('task-name').value = '';
    document.getElementById('task-category').value = 'Persiapan Awal';
    document.getElementById('task-date').value = '';
    document.getElementById('task-pic').value = 'CPP';
    document.getElementById('task-budget').value = '';
  }

  function saveTask() {
    const name = document.getElementById('task-name').value.trim();
    if (!name) {
      showToast('Nama tugas harus diisi', 'danger');
      return;
    }

    const data = {
      task: name,
      category: document.getElementById('task-category').value,
      targetDate: document.getElementById('task-date').value,
      pic: document.getElementById('task-pic').value,
      budget: getRupiahValue(document.getElementById('task-budget')),
    };

    if (editingId) {
      Store.updateItem('checklist', editingId, data);
      showToast('Tugas berhasil diperbarui', 'success');
    } else {
      data.id = generateId();
      data.completed = false;
      Store.addItem('checklist', data);
      showToast('Tugas berhasil ditambahkan', 'success');
    }

    closeModal('modal-task');
    editingId = null;
  }

  function editTask(id) {
    const item = Store.getById('checklist', id);
    if (!item) return;

    editingId = id;
    document.getElementById('modal-task-title').textContent = 'Edit Tugas';
    document.getElementById('task-name').value = item.task;
    document.getElementById('task-category').value = item.category;
    document.getElementById('task-date').value = item.targetDate || '';
    document.getElementById('task-pic').value = item.pic;
    document.getElementById('task-budget').value = item.budget ? Number(item.budget).toLocaleString('id-ID') : '';

    openModal('modal-task');
  }

  function render() {
    const items = Store.getAll('checklist');
    const filtered = currentFilter === 'all' ? items : items.filter(i => i.category === currentFilter);
    const tbody = document.getElementById('checklist-tbody');
    const empty = document.getElementById('checklist-empty');

    // Summary
    document.getElementById('cl-total').textContent = items.length;
    document.getElementById('cl-done').textContent = items.filter(i => i.completed).length;
    document.getElementById('cl-budget').textContent = formatRupiah(items.reduce((s, i) => s + (Number(i.budget) || 0), 0));

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = filtered.map(item => {
      const picClass = picClasses[item.pic] || 'pic-cpp';
      return `
        <tr class="${item.completed ? 'completed' : ''}">
          <td>
            <label class="checkbox-wrapper">
              <input type="checkbox" ${item.completed ? 'checked' : ''} data-action="toggle" data-id="${item.id}">
            </label>
          </td>
          <td><span class="task-name">${escapeHtml(item.task)}</span></td>
          <td><span class="badge badge-primary">${item.category}</span></td>
          <td class="date-cell">${item.targetDate ? formatDateShort(item.targetDate) : '-'}</td>
          <td><span class="pic-badge ${picClass}">${item.pic}</span></td>
          <td class="budget-cell">${formatRupiah(item.budget)}</td>
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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
