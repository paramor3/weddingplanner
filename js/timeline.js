/* ============================================
   NikahPlanner — Wedding Day Timeline Module
   ============================================ */

const Timeline = (() => {
  let editingId = null;

  const defaultTemplate = [
    { time: '06:00', duration: 60, activity: 'Persiapan Pengantin (MUA & Attire)', pic: 'MUA / WO', notes: 'Kebaya, jas, make-up, aksesoris' },
    { time: '07:00', duration: 30, activity: 'Sesi Foto Pre-Ceremony', pic: 'Fotografer', notes: 'Kamera, lighting, backdrop indoor' },
    { time: '07:30', duration: 15, activity: 'Penyambutan Tamu Akad', pic: 'WO / Keluarga', notes: 'Buku tamu, souvenir, minuman selamat datang' },
    { time: '08:00', duration: 45, activity: 'Akad Nikah', pic: 'Penghulu / KUA', notes: 'Mas kawin, buku nikah, saksi, dekorasi akad' },
    { time: '08:45', duration: 15, activity: 'Sungkeman & Doa', pic: 'MC / Keluarga', notes: 'Mic, tisu, bantal sungkem' },
    { time: '09:00', duration: 30, activity: 'Temu Manten (Adat Jawa)', pic: 'WO / MC', notes: 'Perlengkapan adat, gantal, balangan' },
    { time: '09:30', duration: 30, activity: 'Sesi Foto Keluarga', pic: 'Fotografer', notes: 'Backdrop, set group foto' },
    { time: '10:00', duration: 30, activity: 'Persiapan Resepsi & Ganti Busana', pic: 'MUA / WO', notes: 'Gaun resepsi, touch up make-up' },
    { time: '10:30', duration: 15, activity: 'Penyambutan Tamu Resepsi', pic: 'WO / Usher', notes: 'Buku tamu, angpao box, souvenir' },
    { time: '11:00', duration: 120, activity: 'Resepsi Pernikahan', pic: 'MC / WO', notes: 'Sound system, catering, entertainment' },
    { time: '13:00', duration: 30, activity: 'Sesi Foto Bersama Tamu', pic: 'Fotografer', notes: 'Photobooth, props' },
    { time: '13:30', duration: 30, activity: 'Penutupan & Clean Up', pic: 'WO / Vendor', notes: 'Souvenir sisa, angpao, dekorasi bongkar' },
  ];

  function init() {
    render();
    bindEvents();
    Store.on('timeline', render);
  }

  function bindEvents() {
    document.getElementById('btn-add-timeline').addEventListener('click', () => {
      editingId = null;
      document.getElementById('modal-timeline-title').textContent = 'Tambah Acara';
      clearTimelineForm();
      openModal('modal-timeline');
    });

    document.getElementById('btn-timeline-template').addEventListener('click', loadTemplate);
    document.getElementById('btn-timeline-save').addEventListener('click', saveTimeline);
  }

  function clearTimelineForm() {
    document.getElementById('tl-time').value = '';
    document.getElementById('tl-duration').value = '';
    document.getElementById('tl-activity').value = '';
    document.getElementById('tl-pic').value = '';
    document.getElementById('tl-notes').value = '';
  }

  function loadTemplate() {
    const existing = Store.getAll('timeline');
    if (existing.length > 0) {
      if (!confirm('Ini akan menghapus rundown yang ada dan menggantinya dengan template. Lanjutkan?')) {
        return;
      }
      // Remove all existing
      existing.forEach(item => Store.deleteItem('timeline', item.id));
    }

    defaultTemplate.forEach(t => {
      Store.addItem('timeline', {
        id: generateId(),
        time: t.time,
        duration: t.duration,
        activity: t.activity,
        pic: t.pic,
        notes: t.notes,
      });
    });

    showToast('Template rundown berhasil dimuat', 'success');
  }

  function saveTimeline() {
    const activity = document.getElementById('tl-activity').value.trim();
    const time = document.getElementById('tl-time').value;

    if (!activity || !time) {
      showToast('Waktu dan aktivitas harus diisi', 'danger');
      return;
    }

    const data = {
      time: time,
      duration: parseInt(document.getElementById('tl-duration').value) || 0,
      activity: activity,
      pic: document.getElementById('tl-pic').value.trim(),
      notes: document.getElementById('tl-notes').value.trim(),
    };

    if (editingId) {
      Store.updateItem('timeline', editingId, data);
      showToast('Acara berhasil diperbarui', 'success');
    } else {
      data.id = generateId();
      Store.addItem('timeline', data);
      showToast('Acara berhasil ditambahkan', 'success');
    }

    closeModal('modal-timeline');
    editingId = null;
  }

  function render() {
    const items = Store.getAll('timeline');
    const wrapper = document.getElementById('timeline-wrapper');
    const empty = document.getElementById('timeline-empty');

    if (items.length === 0) {
      wrapper.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';

    // Sort by time
    const sorted = [...items].sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

    wrapper.innerHTML = sorted.map(item => `
      <div class="timeline-item" data-id="${item.id}">
        <div class="timeline-header">
          <div class="flex items-center gap-3">
            <span class="timeline-time">${item.time}</span>
            ${item.duration ? `<span class="timeline-duration">${item.duration} menit</span>` : ''}
          </div>
          <div class="action-buttons">
            <button class="btn btn-ghost btn-icon btn-sm" data-action="edit-tl" data-id="${item.id}" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon btn-sm" data-action="delete-tl" data-id="${item.id}" title="Hapus" style="color: var(--color-danger);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="timeline-activity">${escapeHtml(item.activity)}</div>
        <div class="timeline-details">
          ${item.pic ? `<span>👤 ${escapeHtml(item.pic)}</span>` : ''}
          ${item.notes ? `<span>📋 ${escapeHtml(item.notes)}</span>` : ''}
        </div>
      </div>
    `).join('');

    // Bind timeline item actions
    wrapper.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'edit-tl') {
        editTimeline(id);
      } else if (action === 'delete-tl') {
        confirmDelete('timeline', id, 'Apakah Anda yakin ingin menghapus acara ini?');
      }
    });
  }

  function editTimeline(id) {
    const item = Store.getById('timeline', id);
    if (!item) return;

    editingId = id;
    document.getElementById('modal-timeline-title').textContent = 'Edit Acara';
    document.getElementById('tl-time').value = item.time || '';
    document.getElementById('tl-duration').value = item.duration || '';
    document.getElementById('tl-activity').value = item.activity;
    document.getElementById('tl-pic').value = item.pic || '';
    document.getElementById('tl-notes').value = item.notes || '';

    openModal('modal-timeline');
  }

  return { init, render };
})();
