/* ============================================
   NikahPlanner — Post-Nikah Budget Tracker
   ============================================ */

const PostNikah = (() => {
  let currentMonth = new Date();

  function init() {
    render();
    bindEvents();
    Store.on('postNikah', render);
    Store.on('settings', render);
  }

  function bindEvents() {
    document.getElementById('btn-add-postnikah').addEventListener('click', () => {
      document.getElementById('pn-month').value = currentMonth.toISOString().slice(0, 7);
      document.getElementById('pn-category').value = 'Kebutuhan Pokok';
      document.getElementById('pn-amount').value = '';
      document.getElementById('pn-note').value = '';
      openModal('modal-postnikah');
    });

    document.getElementById('btn-pn-save').addEventListener('click', savePn);

    setupRupiahInput(document.getElementById('pn-amount'));
  }

  function savePn() {
    const amount = getRupiahValue(document.getElementById('pn-amount'));
    if (!amount || amount <= 0) {
      showToast('Nominal harus diisi', 'danger');
      return;
    }

    const monthVal = document.getElementById('pn-month').value;
    const [year, month] = monthVal.split('-').map(Number);

    Store.addItem('postNikah', {
      id: generateId(),
      month: month,
      year: year,
      category: document.getElementById('pn-category').value,
      amount: amount,
      note: document.getElementById('pn-note').value.trim(),
    });

    closeModal('modal-postnikah');
    showToast('Pengeluaran berhasil ditambahkan', 'success');
  }

  function render() {
    const settings = Store.getSettings();
    const container = document.getElementById('postnikah-content');
    const addBtn = document.getElementById('btn-add-postnikah');

    // Check if wedding date has passed
    if (!settings.weddingDate || new Date(settings.weddingDate) > new Date()) {
      addBtn.classList.add('hidden');
      const daysLeft = settings.weddingDate
        ? calculateCountdown(settings.weddingDate).days
        : '?';

      container.innerHTML = `
        <div class="postnikah-locked">
          <div class="lock-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3>Fitur Terkunci</h3>
          <p>Modul pelacak pengeluaran rumah tangga pasca-nikah akan aktif otomatis setelah hari pernikahan Anda.${settings.weddingDate ? `<br><br>⏳ ${daysLeft} hari lagi menuju hari bahagia!` : ''}</p>
        </div>
      `;
      return;
    }

    // Active state
    addBtn.classList.remove('hidden');

    const items = Store.getAll('postNikah');
    const monthStr = currentMonth.toISOString().slice(0, 7);
    const [cy, cm] = monthStr.split('-').map(Number);
    const monthItems = items.filter(i => i.year === cy && i.month === cm);
    const monthTotal = monthItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const allTotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

    // Category breakdown
    const catBreakdown = {};
    monthItems.forEach(i => {
      catBreakdown[i.category] = (catBreakdown[i.category] || 0) + (Number(i.amount) || 0);
    });

    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    container.innerHTML = `
      <div class="postnikah-overview">
        <div class="postnikah-card">
          <div class="pn-label">Total Pengeluaran Bulan Ini</div>
          <div class="pn-value">${formatRupiah(monthTotal)}</div>
        </div>
        <div class="postnikah-card">
          <div class="pn-label">Jumlah Transaksi</div>
          <div class="pn-value">${monthItems.length}</div>
        </div>
        <div class="postnikah-card">
          <div class="pn-label">Total Seluruh Bulan</div>
          <div class="pn-value">${formatRupiah(allTotal)}</div>
        </div>
      </div>

      <div class="month-selector">
        <button id="pn-prev-month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="current-month">${monthNames[cm]} ${cy}</span>
        <button id="pn-next-month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      ${Object.keys(catBreakdown).length > 0 ? `
        <div class="card mb-6">
          <h4 style="font-size: var(--text-md); margin-bottom: var(--space-4);">Rincian per Kategori</h4>
          ${Object.entries(catBreakdown).map(([cat, amount]) => `
            <div class="result-row">
              <span class="result-label">${cat}</span>
              <span class="result-value">${formatRupiah(amount)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="savings-table-wrapper">
        <table class="data-table" id="pn-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Nominal</th>
              <th>Keterangan</th>
              <th style="width:60px">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${monthItems.length === 0 ? `<tr><td colspan="4" style="text-align:center; color: var(--color-text-light); padding: var(--space-8);">Belum ada data bulan ini</td></tr>` : ''}
            ${monthItems.map(item => `
              <tr>
                <td><span class="badge badge-sage">${item.category}</span></td>
                <td class="amount-cell">${formatRupiah(item.amount)}</td>
                <td class="note-cell">${item.note ? escapeHtml(item.note) : '-'}</td>
                <td>
                  <button class="btn btn-ghost btn-icon btn-sm pn-delete-btn" data-pn-id="${item.id}" style="color: var(--color-danger);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Bind month navigation
    document.getElementById('pn-prev-month')?.addEventListener('click', () => {
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      render();
    });

    document.getElementById('pn-next-month')?.addEventListener('click', () => {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      render();
    });

    // Bind delete buttons
    container.querySelectorAll('.pn-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmDelete('postNikah', btn.dataset.pnId, 'Hapus pengeluaran ini?');
      });
    });
  }

  return { init, render };
})();
