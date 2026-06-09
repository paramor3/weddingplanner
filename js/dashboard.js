/* ============================================
   NikahPlanner — Dashboard Module
   ============================================ */

const Dashboard = (() => {
  let budgetChart = null;
  let guestChart = null;
  let countdownInterval = null;

  const chartColors = [
    '#D4A5A5', '#C4A882', '#A8BFA0', '#B8A9C9',
    '#E0C97A', '#7AB0D4', '#E07A7A', '#7AB89E',
  ];

  function init() {
    refresh();
    startCountdown();

    // Listen for data changes
    Store.on('checklist', refresh);
    Store.on('guests', refresh);
    Store.on('savings', refresh);
    Store.on('settings', () => {
      refresh();
      startCountdown();
    });
  }

  function refresh() {
    updateMetrics();
    updateProgress();
    updateBudgetChart();
    updateGuestChart();
    updateSidebarInfo();
  }

  function updateMetrics() {
    const totalBudget = Store.getTotalBudget();
    const totalSavings = Store.getTotalSavings();
    const totalGuests = Store.getTotalGuests();

    document.getElementById('metric-budget').textContent = formatRupiah(totalBudget);
    document.getElementById('metric-savings').textContent = formatRupiah(totalSavings);
    document.getElementById('metric-guests').textContent = formatNumber(totalGuests) + ' orang';

    // Budget sub text
    const budgetSub = document.getElementById('metric-budget-sub');
    const stats = Store.getChecklistStats();
    if (stats.total > 0) {
      budgetSub.textContent = `${stats.total} item vendor/tugas`;
    } else {
      budgetSub.textContent = '';
    }

    // Savings sub text
    const savingsSub = document.getElementById('metric-savings-sub');
    if (totalBudget > 0) {
      const pct = Math.round((totalSavings / totalBudget) * 100);
      savingsSub.textContent = `${pct}% dari estimasi biaya`;
    } else {
      savingsSub.textContent = '';
    }
  }

  function updateProgress() {
    const stats = Store.getChecklistStats();
    document.getElementById('progress-percent').textContent = stats.percentage + '%';
    document.getElementById('progress-fill').style.width = stats.percentage + '%';
    document.getElementById('stats-completed').textContent = stats.completed;
    document.getElementById('stats-remaining').textContent = stats.total - stats.completed;
    document.getElementById('stats-total').textContent = stats.total;
  }

  function updateBudgetChart() {
    const ctx = document.getElementById('chart-budget');
    if (!ctx) return;

    const data = Store.getBudgetByCategory();
    const labels = Object.keys(data);
    const values = Object.values(data);

    if (budgetChart) {
      budgetChart.destroy();
    }

    if (labels.length === 0) {
      budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Belum ada data'],
          datasets: [{ data: [1], backgroundColor: ['#E8E8E8'], borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 } },
            tooltip: { enabled: false },
          },
          cutout: '65%',
        },
      });
      return;
    }

    budgetChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: chartColors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Inter', size: 11 },
              padding: 14,
              usePointStyle: true,
              pointStyleWidth: 10,
              generateLabels: function (chart) {
                const data = chart.data;
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                return data.labels.map((label, i) => {
                  const val = data.datasets[0].data[i];
                  const pct = total ? Math.round((val / total) * 100) : 0;
                  return {
                    text: `${label} (${pct}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: 'transparent',
                    pointStyle: 'circle',
                    index: i,
                  };
                });
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return ` ${context.label}: ${formatRupiah(context.parsed)}`;
              },
            },
            bodyFont: { family: 'Inter' },
            titleFont: { family: 'Inter' },
            padding: 12,
            cornerRadius: 8,
          },
        },
        cutout: '65%',
        animation: { animateRotate: true, animateScale: true },
      },
    });
  }

  function updateGuestChart() {
    const ctx = document.getElementById('chart-guests');
    if (!ctx) return;

    const data = Store.getGuestsByCategory();
    const labels = Object.keys(data);
    const values = Object.values(data);

    if (guestChart) {
      guestChart.destroy();
    }

    if (labels.length === 0) {
      guestChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Belum ada data'],
          datasets: [{ data: [0], backgroundColor: ['#E8E8E8'], borderRadius: 8 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            y: { display: false },
            x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
          },
        },
      });
      return;
    }

    const barColors = labels.map((_, i) => chartColors[i % chartColors.length]);

    guestChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: barColors,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 50,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return ` ${context.parsed.y} orang`;
              },
            },
            bodyFont: { family: 'Inter' },
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(196, 168, 130, 0.08)', drawBorder: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#8A8A8A', stepSize: 1 },
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 10 }, color: '#8A8A8A', maxRotation: 45 },
          },
        },
        animation: { duration: 800, easing: 'easeOutQuart' },
      },
    });
  }

  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    const settings = Store.getSettings();
    if (!settings.weddingDate) return;

    function update() {
      const cd = calculateCountdown(settings.weddingDate);
      const display = document.getElementById('countdown-display');

      if (cd.isPast) {
        display.classList.add('countdown-past');
        document.getElementById('cd-days').textContent = '🎉';
        document.getElementById('cd-hours').textContent = '';
        document.getElementById('cd-minutes').textContent = '';
        document.getElementById('cd-seconds').textContent = '';
        // Remove separators
        display.querySelectorAll('.countdown-sep').forEach(s => s.style.display = 'none');
        display.querySelectorAll('.countdown-label').forEach(l => l.style.display = 'none');
        display.querySelector('.countdown-unit').querySelector('.countdown-label').textContent = '';
        clearInterval(countdownInterval);
        return;
      }

      document.getElementById('cd-days').textContent = String(cd.days).padStart(2, '0');
      document.getElementById('cd-hours').textContent = String(cd.hours).padStart(2, '0');
      document.getElementById('cd-minutes').textContent = String(cd.minutes).padStart(2, '0');
      document.getElementById('cd-seconds').textContent = String(cd.seconds).padStart(2, '0');
    }

    update();
    countdownInterval = setInterval(update, 1000);
  }

  function updateSidebarInfo() {
    const settings = Store.getSettings();
    const couple = document.getElementById('sidebar-couple');
    if (settings.groomName && settings.brideName) {
      couple.style.display = 'flex';
      document.getElementById('sidebar-couple-names').textContent = `${settings.groomName} & ${settings.brideName}`;
      if (settings.weddingDate) {
        document.getElementById('sidebar-couple-date').textContent = formatDate(settings.weddingDate);
      }
    }
  }

  return { init, refresh };
})();
