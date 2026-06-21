import { db, auth } from './firebase.js';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { showToast, formatRupiah } from './ui.js';

let localTransactions = [];
let localUserRole = null;

// Populate categories dropdown filter
export function updateCategoriesFilter(transactions) {
  const filterCategory = document.getElementById('filter-category');
  if (!filterCategory) return;
  
  const categories = [...new Set(transactions.map(t => t.category))].filter(Boolean);
  const currentSelected = filterCategory.value;
  filterCategory.innerHTML = '<option value="all">Semua Kategori</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.innerText = cat;
    filterCategory.appendChild(option);
  });
  filterCategory.value = currentSelected;
}

// Populate table rows based on filter values
export function populateTransactionsTable(transactions = localTransactions, role = localUserRole) {
  localTransactions = transactions;
  localUserRole = role;

  const tbody = document.getElementById('transaction-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filterType = document.getElementById('filter-type');
  const filterCategory = document.getElementById('filter-category');
  const searchDesc = document.getElementById('search-desc');

  const typeVal = filterType ? filterType.value : 'all';
  const catVal = filterCategory ? filterCategory.value : 'all';
  const searchVal = searchDesc ? searchDesc.value.toLowerCase() : '';

  const filtered = transactions.filter(t => {
    const matchType = typeVal === 'all' || t.type === typeVal;
    const matchCat = catVal === 'all' || t.category === catVal;
    const matchDesc = t.description.toLowerCase().includes(searchVal);
    return matchType && matchCat && matchDesc;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-slate-400">Tidak ada transaksi ditemukan.</td></tr>`;
    return;
  }

  const isEditable = role === 'admin' || role === 'bendahara';

  filtered.forEach(t => {
    const isMasuk = t.type === 'pemasukan';
    const dateObj = new Date(t.date);
    const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-100/30 dark:hover:bg-darkbg-800/30 transition border-b border-slate-200/50 dark:border-slate-800/50";
    
    tr.innerHTML = `
      <td class="px-6 py-4 font-medium">${dateStr}</td>
      <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">${t.description}</td>
      <td class="px-6 py-4"><span class="bg-slate-100 dark:bg-darkbg-700/60 px-2.5 py-1 rounded-full text-xs">${t.category}</span></td>
      <td class="px-6 py-4">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${isMasuk ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}">
          ${isMasuk ? 'Masuk' : 'Keluar'}
        </span>
      </td>
      <td class="px-6 py-4 text-right font-extrabold ${isMasuk ? 'text-emerald-500' : 'text-rose-500'}">${formatRupiah(t.amount)}</td>
      <td class="px-6 py-4 text-center action-col ${isEditable ? '' : 'hidden'}">
        <div class="flex items-center justify-center gap-2">
          <button onclick="editTransaction('${t.id}')" class="p-1.5 hover:bg-brand-500/10 rounded text-brand-600 hover:text-brand-500"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
          <button onclick="deleteTransaction('${t.id}')" class="p-1.5 hover:bg-rose-500/10 rounded text-rose-600 hover:text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Bind Transactions CRUD listeners
export function initTransactionsListeners() {
  const modal = document.getElementById('transaction-modal');
  const modalTitle = document.getElementById('modal-title');
  const transactionForm = document.getElementById('transaction-form');
  const addTxBtn = document.getElementById('add-transaction-btn');
  const closeTxBtn = document.getElementById('close-modal-btn');

  const filterType = document.getElementById('filter-type');
  const filterCategory = document.getElementById('filter-category');
  const searchDesc = document.getElementById('search-desc');

  if (filterType) filterType.addEventListener('input', () => populateTransactionsTable());
  if (filterCategory) filterCategory.addEventListener('input', () => populateTransactionsTable());
  if (searchDesc) searchDesc.addEventListener('input', () => populateTransactionsTable());

  if (addTxBtn) {
    addTxBtn.addEventListener('click', () => {
      modalTitle.innerText = "Tambah Transaksi Baru";
      transactionForm.reset();
      document.getElementById('tx-id').value = '';
      document.getElementById('tx-date').value = new Date().toISOString().substring(0, 10);
      modal.showModal();
    });
  }

  if (closeTxBtn) {
    closeTxBtn.addEventListener('click', () => {
      modal.close();
    });
  }

  if (transactionForm) {
    transactionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('tx-id').value;
      const date = document.getElementById('tx-date').value;
      const type = document.querySelector('input[name="tx-type"]:checked').value;
      const category = document.getElementById('tx-category').value;
      const amount = parseFloat(document.getElementById('tx-amount').value);
      const description = document.getElementById('tx-desc').value;

      const payload = {
        date,
        type,
        category,
        amount,
        description,
        updatedBy: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      };

      try {
        if (id) {
          await updateDoc(doc(db, 'transactions', id), payload);
          showToast('Transaksi berhasil diperbarui!');
        } else {
          payload.createdBy = auth.currentUser.uid;
          payload.createdAt = new Date().toISOString();
          await addDoc(collection(db, 'transactions'), payload);
          showToast('Transaksi berhasil ditambahkan!');
        }
        modal.close();
      } catch (err) {
        console.error(err);
        showToast('Gagal memproses transaksi.', 'error');
      }
    });
  }

  // Expose triggers to window object for dynamic HTML row actions
  window.editTransaction = function(id) {
    const tx = localTransactions.find(t => t.id === id);
    if (!tx) return;

    modalTitle.innerText = "Edit Transaksi";
    document.getElementById('tx-id').value = tx.id;
    document.getElementById('tx-date').value = tx.date;
    
    document.querySelector(`input[name="tx-type"][value="${tx.type}"]`).checked = true;
    
    document.getElementById('tx-category').value = tx.category;
    document.getElementById('tx-amount').value = tx.amount;
    document.getElementById('tx-desc').value = tx.description;
    
    modal.showModal();
  };

  window.deleteTransaction = async function(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
        showToast('Transaksi telah dihapus.');
      } catch (err) {
        showToast('Gagal menghapus transaksi.', 'error');
      }
    }
  };
}
