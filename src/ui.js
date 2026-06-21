// Toast Notifications
export function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-medium text-sm transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto max-w-sm`;
  
  let icon = 'check-circle';
  if (type === 'error') {
    toast.className += ' bg-rose-600';
    icon = 'alert-triangle';
  } else if (type === 'info') {
    toast.className += ' bg-blue-600';
    icon = 'info';
  } else {
    toast.className += ' bg-emerald-600';
  }

  toast.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  
  // Re-run Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Trigger animations
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 50);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Format Currency to IDR Rupiah
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Toggle Theme (Dark Mode)
export function initTheme() {
  const themeToggleD = document.getElementById('theme-toggle-desktop');
  const themeToggleM = document.getElementById('theme-toggle-mobile');

  const toggle = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  if (themeToggleD) themeToggleD.addEventListener('click', toggle);
  if (themeToggleM) themeToggleM.addEventListener('click', toggle);

  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
}

// Tab navigation handler
export function switchTab(targetId) {
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
  const activePanel = document.getElementById(`view-${targetId}`);
  if (activePanel) activePanel.classList.remove('hidden');

  // Active state styling for navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-target') === targetId;
    if (isActive) {
      btn.classList.add('text-brand-600', 'dark:text-brand-400', 'bg-brand-500/10');
      btn.classList.remove('text-slate-500', 'dark:text-slate-400', 'bg-transparent');
    } else {
      btn.classList.remove('text-brand-600', 'dark:text-brand-400', 'bg-brand-500/10');
      btn.classList.add('text-slate-500', 'dark:text-slate-400');
    }
  });
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
