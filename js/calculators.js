/* ============================================
   NikahPlanner — Smart Calculators Module
   ============================================ */

const Calculators = (() => {
  const seserahanRules = [
    { category: 'Perlengkapan Ibadah', pct: 15, icon: '🕌' },
    { category: 'Pakaian & Tas/Sepatu', pct: 45, icon: '👗' },
    { category: 'Skincare & Make-up', pct: 25, icon: '💄' },
    { category: 'Makanan Tradisional / Perhiasan', pct: 15, icon: '🎀' },
  ];

  const seserahanRecos = {
    low: [
      'Mukena polos sederhana',
      'Sajadah standar',
      'Blouse / Kemeja basic',
      'Skincare drugstore set',
      'Dodol / Bolu tradisional',
    ],
    medium: [
      'Mukena bordir premium',
      'Al-Quran cover kulit',
      'Tas branded entry-level',
      'Skincare mid-range set (Wardah/Somethinc)',
      'Set perhiasan simple',
    ],
    high: [
      'Mukena sutra premium',
      'Sajadah Turki import',
      'Tas branded (Coach/Kate Spade)',
      'Skincare premium set (SK-II/Estee Lauder)',
      'Set perhiasan emas',
    ],
  };

  const souvenirRecos = {
    low: { // < 5000
      label: '< Rp5.000',
      items: [
        'Gantungan kunci kustom',
        'Pouch kain mini',
        'Sedotan stainless',
        'Magnet kulkas kustom',
      ],
    },
    medium: { // 5000 - 15000
      label: 'Rp5.000 - Rp15.000',
      items: [
        'Totebag blacu',
        'Sabun organik',
        'Mangkok kaca mini',
        'Tanaman sukulen',
        'Pouch serut premium',
      ],
    },
    high: { // > 15000
      label: '> Rp15.000',
      items: [
        'Tumbler minum kustom',
        'Handuk wajah bordir',
        'Lilin aromaterapi premium',
        'Kotak makan bambu',
        'Mug keramik kustom',
      ],
    },
  };

  function init() {
    bindEvents();
  }

  function bindEvents() {
    // Seserahan calculator
    document.getElementById('btn-calc-seserahan').addEventListener('click', calcSeserahan);
    setupRupiahInput(document.getElementById('ses-budget'));

    // Souvenir calculator
    document.getElementById('btn-calc-souvenir').addEventListener('click', calcSouvenir);
    setupRupiahInput(document.getElementById('souv-price'));
  }

  function calcSeserahan() {
    const budget = getRupiahValue(document.getElementById('ses-budget'));
    if (!budget || budget <= 0) {
      showToast('Masukkan total budget seserahan', 'danger');
      return;
    }

    const results = document.getElementById('ses-results');
    const breakdown = document.getElementById('ses-breakdown');
    const recos = document.getElementById('ses-recommendations');

    // Calculate breakdown
    breakdown.innerHTML = seserahanRules.map(rule => {
      const amount = Math.round(budget * rule.pct / 100);
      return `
        <div class="seserahan-item">
          <div class="ses-info">
            <span class="ses-category">${rule.icon} ${rule.category}</span>
            <span class="ses-pct">${rule.pct}% dari total</span>
          </div>
          <span class="ses-amount">${formatRupiah(amount)}</span>
        </div>
      `;
    }).join('');

    // Determine tier
    let tier, tierLabel;
    if (budget < 3000000) {
      tier = 'low';
      tierLabel = 'Budget Hemat';
    } else if (budget < 8000000) {
      tier = 'medium';
      tierLabel = 'Budget Menengah';
    } else {
      tier = 'high';
      tierLabel = 'Budget Premium';
    }

    const tierClasses = { low: 'tier-low', medium: 'tier-medium', high: 'tier-high' };

    recos.innerHTML = `
      <h4>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 12 18.469c-1.006 0-1.914.44-2.536 1.132l-.548-.547z"/></svg>
        Rekomendasi Ide — <span class="tier-badge ${tierClasses[tier]}">${tierLabel}</span>
      </h4>
      <div class="reco-list">
        ${seserahanRecos[tier].map(item => `<div class="reco-item">${item}</div>`).join('')}
      </div>
    `;

    results.style.display = 'block';
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function calcSouvenir() {
    const qty = parseInt(document.getElementById('souv-qty').value) || 0;
    const price = getRupiahValue(document.getElementById('souv-price'));

    if (qty <= 0 || price <= 0) {
      showToast('Masukkan jumlah undangan dan budget per unit', 'danger');
      return;
    }

    const baseCost = qty * price;
    const reserve = Math.round(baseCost * 0.10);
    const total = baseCost + reserve;

    document.getElementById('souv-base').textContent = formatRupiah(baseCost);
    document.getElementById('souv-reserve').textContent = formatRupiah(reserve);
    document.getElementById('souv-total').textContent = formatRupiah(total);

    // Determine recommendation tier
    let tier;
    if (price < 5000) {
      tier = 'low';
    } else if (price <= 15000) {
      tier = 'medium';
    } else {
      tier = 'high';
    }

    const recoData = souvenirRecos[tier];
    const tierClasses = { low: 'tier-low', medium: 'tier-medium', high: 'tier-high' };

    document.getElementById('souv-recommendations').innerHTML = `
      <h4>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 12 18.469c-1.006 0-1.914.44-2.536 1.132l-.548-.547z"/></svg>
        Rekomendasi — <span class="tier-badge ${tierClasses[tier]}">${recoData.label}</span>
      </h4>
      <div class="reco-list">
        ${recoData.items.map(item => `<div class="reco-item">${item}</div>`).join('')}
      </div>
    `;

    const results = document.getElementById('souv-results');
    results.style.display = 'block';
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return { init };
})();
