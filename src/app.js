import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { initTheme, switchTab, showToast } from './ui.js';
import { initAuthListeners, setupUserProfile } from './auth.js';
import { updateDashboard } from './dashboard.js';
import { 
  initTransactionsListeners, 
  populateTransactionsTable, 
  updateCategoriesFilter 
} from './transactions.js';
import { initReportsListeners, populateReportDashboard } from './reports.js';
import { initUsersListeners, populateUsersTable } from './users.js';

// GLOBAL APP STATE
let transactions = [];
let usersList = [];
let userRole = null;

// Gating UI views according to roles
function applyRolePermissions(profile) {
  const { role, displayName } = profile;
  userRole = role;
  
  // Set Profile Name & Avatar
  const avName = displayName ? displayName.substring(0, 2).toUpperCase() : 'U';
  const avEl = document.getElementById('user-avatar-desktop');
  if (avEl) avEl.innerText = avName;
  
  const nameEl = document.getElementById('user-name-desktop');
  if (nameEl) nameEl.innerText = displayName;

  const roleEl = document.getElementById('user-role-desktop');
  if (roleEl) {
    roleEl.innerText = role;
    if (role === 'admin') {
      roleEl.className = "text-[10px] bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider";
    } else if (role === 'bendahara') {
      roleEl.className = "text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider";
    } else {
      roleEl.className = "text-[10px] bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider";
    }
  }

  // Role visibility gating
  const addTxBtn = document.getElementById('add-transaction-btn');
  const actionCols = document.querySelectorAll('.action-col');
  const usersNavDesktop = document.getElementById('nav-users-desktop');
  const usersNavMobile = document.getElementById('nav-users-mobile');

  if (role === 'admin' || role === 'bendahara') {
    if (addTxBtn) addTxBtn.classList.remove('hidden');
    actionCols.forEach(col => col.classList.remove('hidden'));
  } else {
    if (addTxBtn) addTxBtn.classList.add('hidden');
    actionCols.forEach(col => col.classList.add('hidden'));
  }

  if (role === 'admin') {
    if (usersNavDesktop) usersNavDesktop.classList.remove('hidden');
    if (usersNavMobile) usersNavMobile.classList.remove('hidden');
    initializeUsersListener();
  } else {
    if (usersNavDesktop) usersNavDesktop.classList.add('hidden');
    if (usersNavMobile) usersNavMobile.classList.add('hidden');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// REALTIME LISTENERS
let unsubscribeTransactions = null;
let unsubscribeUsers = null;

function initializeRealtimeListeners() {
  // Cancel previous subscriptions if any
  if (unsubscribeTransactions) unsubscribeTransactions();

  const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
  unsubscribeTransactions = onSnapshot(q, (snapshot) => {
    transactions = [];
    snapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });

    // Notify modules
    updateDashboard(transactions);
    updateCategoriesFilter(transactions);
    populateTransactionsTable(transactions, userRole);
    populateReportDashboard(transactions);
  }, (error) => {
    console.error("Firestore transactions error:", error);
  });
}

function initializeUsersListener() {
  if (unsubscribeUsers) unsubscribeUsers();

  unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
    usersList = [];
    snapshot.forEach((doc) => {
      usersList.push(doc.data());
    });
    populateUsersTable(usersList);
  }, (error) => {
    console.error("Firestore users listener error:", error);
  });
}

// STARTUP ORCHESTRATION
function init() {
  const appLoader = document.getElementById('app-loader');
  const authPage = document.getElementById('auth-page');
  const mainApp = document.getElementById('main-app');

  // Initialize General UI & Listeners
  initTheme();
  initAuthListeners();
  initTransactionsListeners();
  initReportsListeners(() => transactions);
  initUsersListeners();

  // Expose switchTab globally for bottom navigation links
  window.switchTab = switchTab;

  // Set up navigation selectors
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      switchTab(target);
    });
  });

  // Track Auth state changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const profile = await setupUserProfile(user);
        applyRolePermissions(profile);
        initializeRealtimeListeners();
        
        if (authPage) authPage.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
        
        switchTab('dashboard');
      } catch (e) {
        console.error("Failed to boot user profile", e);
        showToast("Error saat memuat profil pengguna", "error");
      }
    } else {
      userRole = null;
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeUsers) unsubscribeUsers();
      
      if (authPage) authPage.classList.remove('hidden');
      if (mainApp) mainApp.classList.add('hidden');
    }
    
    if (appLoader) appLoader.classList.add('hidden');
    if (window.lucide) window.lucide.createIcons();
  });
}

// Kickstart App
document.addEventListener('DOMContentLoaded', init);
