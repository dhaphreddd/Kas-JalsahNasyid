import { formatRupiah, switchTab } from './ui.js';

let dashboardChart = null;

// Populate metric cards & timeline list on Dashboard
export function updateDashboard(transactions) {
  let totalMasuk = 0;
  let totalKeluar = 0;

  transactions.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'pemasukan') {
      totalMasuk += amt;
    } else {
      totalKeluar += amt;
    }
  });

  const totalSaldo = totalMasuk - totalKeluar;

  document.getElementById('db-total-kas').innerText = formatRupiah(totalSaldo);
  document.getElementById('db-total-masuk').innerText = formatRupiah(totalMasuk);
  document.getElementById('db-total-keluar').innerText = formatRupiah(totalKeluar);

  // Recent timeline list
  const recentList = document.getElementById('dashboard-recent-list');
  if (!recentList) return;
  recentList.innerHTML = '';
  
  const recentTx = transactions.slice(0, 5);
  if (recentTx.length === 0) {
    recentList.innerHTML = `<div class="text-center text-xs text-slate-400 py-10">Belum ada transaksi.</div>`;
    return;
  }

  recentTx.forEach(t => {
    const isMasuk = t.type === 'pemasukan';
    const dateObj = new Date(t.date);
    const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const item = document.createElement('div');
    item.className = "flex items-center justify-between p-3 bg-white/20 dark:bg-darkbg-800/20 rounded-2xl border border-slate-200/30 dark:border-slate-700/20";
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center ${isMasuk ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}">
          <i data-lucide="${isMasuk ? 'arrow-down-left' : 'arrow-up-right'}" class="w-4 h-4"></i>
        </div>
        <div>
          <p class="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[140px]">${t.description}</p>
          <span class="text-[10px] text-slate-400">${dateStr} • ${t.category}</span>
        </div>
      </div>
      <span class="text-sm font-extrabold ${isMasuk ? 'text-emerald-500' : 'text-rose-500'}">
        ${isMasuk ? '+' : '-'}${formatRupiah(t.amount)}
      </span>
    `;
    recentList.appendChild(item);
  });
  
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Setup click triggers on Dashboard
  const showAllBtn = document.querySelector('#view-dashboard button[onclick="switchTab(\'transactions\')"]');
  if (showAllBtn) {
    showAllBtn.removeAttribute('onclick');
    showAllBtn.addEventListener('click', () => switchTab('transactions'));
  }

  updateDashboardChart(transactions);
}

// Generate/Update Chart.js instance
function updateDashboardChart(transactions) {
  const chartCanvas = document.getElementById('dashboard-chart');
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');
  
  if (dashboardChart) dashboardChart.destroy();

  const monthlyData = {};
  const months = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mLabel = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    months.push({ key: mKey, label: mLabel });
    monthlyData[mKey] = { masuk: 0, keluar: 0 };
  }

  transactions.forEach(t => {
    const mKey = t.date.substring(0, 7);
    if (monthlyData[mKey]) {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'pemasukan') {
        monthlyData[mKey].masuk += amt;
      } else {
        monthlyData[mKey].keluar += amt;
      }
    }
  });

  const labels = months.map(m => m.label);
  const dataMasuk = months.map(m => monthlyData[m.key].masuk);
  const dataKeluar = months.map(m => monthlyData[m.key].keluar);

  const isDarkMode = document.documentElement.classList.contains('dark');

  dashboardChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: dataMasuk,
          backgroundColor: '#10b981',
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Pengeluaran',
          data: dataKeluar,
          backgroundColor: '#f43f5e',
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDarkMode ? '#e2e8f0' : '#475569',
            font: { family: 'Outfit' }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
        },
        y: {
          grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
          ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
        }
      }
    }
  });
}
