/* ============================================
   NikahPlanner — Utility Functions
   ============================================ */

/**
 * Format number to Rupiah currency string
 * @param {number} amount
 * @returns {string} e.g. "Rp1.000.000"
 */
function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp0';
  const num = Math.round(Number(amount));
  return 'Rp' + num.toLocaleString('id-ID');
}

/**
 * Parse Rupiah string back to number
 * @param {string} str
 * @returns {number}
 */
function parseRupiah(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Format date to Indonesian locale
 * @param {string|Date} date
 * @param {object} options — Intl.DateTimeFormat options
 * @returns {string}
 */
function formatDate(date, options = {}) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const defaults = { day: 'numeric', month: 'long', year: 'numeric' };
  return d.toLocaleDateString('id-ID', { ...defaults, ...options });
}

/**
 * Format date to short form (DD/MM/YYYY)
 * @param {string|Date} date
 * @returns {string}
 */
function formatDateShort(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Format date for input[type="date"] value (YYYY-MM-DD)
 * @param {string|Date} date
 * @returns {string}
 */
function formatDateInput(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Calculate countdown to target date
 * @param {string|Date} targetDate
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, isPast: boolean }}
 */
function calculateCountdown(targetDate) {
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}

/**
 * Generate simple unique ID
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/**
 * Show toast notification
 * @param {string} message
 * @param {'success'|'danger'|'warning'|'info'} type
 * @param {number} duration — ms before auto-dismiss
 */
function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    danger: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  toast.innerHTML = `
    <span style="color: var(--color-${type === 'info' ? 'info' : type}); display:flex;">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/**
 * Debounce function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format number with thousand separator (Indonesia)
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return Number(num).toLocaleString('id-ID');
}

/**
 * Rupiah input formatter — auto-format as user types
 * @param {HTMLInputElement} input
 */
function setupRupiahInput(input) {
  input.addEventListener('input', function () {
    let val = this.value.replace(/[^0-9]/g, '');
    if (val) {
      this.value = Number(val).toLocaleString('id-ID');
    }
  });

  input.addEventListener('focus', function () {
    let val = this.value.replace(/[^0-9]/g, '');
    this.value = val;
  });

  input.addEventListener('blur', function () {
    let val = this.value.replace(/[^0-9]/g, '');
    if (val) {
      this.value = Number(val).toLocaleString('id-ID');
    }
  });
}

/**
 * Get rupiah value from formatted input
 * @param {HTMLInputElement} input
 * @returns {number}
 */
function getRupiahValue(input) {
  return parseRupiah(input.value);
}
