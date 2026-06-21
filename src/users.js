import { db, auth } from './firebase.js';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { showToast } from './ui.js';

let localUsers = [];

// Populate users table
export function populateUsersTable(users = localUsers) {
  localUsers = users;

  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const currentUid = auth.currentUser ? auth.currentUser.uid : null;

  users.forEach(u => {
    if (u.uid === currentUid) return; // Hide current logged-in user to prevent self-role removal

    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-100/30 dark:hover:bg-darkbg-800/30 transition border-b border-slate-200/50 dark:border-slate-800/50";
    
    tr.innerHTML = `
      <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">${u.displayName}</td>
      <td class="px-6 py-4">${u.email}</td>
      <td class="px-6 py-4">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
          u.role === 'admin' ? 'bg-purple-500/10 text-purple-500' :
          u.role === 'bendahara' ? 'bg-emerald-500/10 text-emerald-500' :
          'bg-blue-500/10 text-blue-500'
        }">
          ${u.role}
        </span>
      </td>
      <td class="px-6 py-4 text-center">
        <select onchange="changeUserRole('${u.uid}', this.value)" class="bg-white/50 dark:bg-darkbg-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-2 py-1 text-xs outline-none text-slate-800 dark:text-white">
          <option value="ketua" ${u.role === 'ketua' ? 'selected' : ''}>Ketua</option>
          <option value="bendahara" ${u.role === 'bendahara' ? 'selected' : ''}>Bendahara</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Bind update action to window context for dynamic select list triggers
export function initUsersListeners() {
  window.changeUserRole = async function(userId, newRole) {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      showToast('Role pengguna berhasil diubah.');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengubah role.', 'error');
    }
  };
}
