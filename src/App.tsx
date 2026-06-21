/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ClientManager } from './components/ClientManager';
import { BankManager } from './components/BankManager';
import { DiscountForm } from './components/DiscountForm';
import { TransactionHistory } from './components/TransactionHistory';
import { ReportGenerator } from './components/ReportGenerator';
import { ReturnedChecksManager } from './components/ReturnedChecksManager';
import { LoginPage, UserRole } from './components/LoginPage';
import { 
  View, 
  Client, 
  Bank, 
  Transaction, 
  SystemSettings, 
  TransactionStatus,
  AppUser
} from './types';
import { db, saveItem, deleteItem, subscribeToCollection, auth, loginAnonymously } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Info, CreditCard, LogOut, ExternalLink, AlertCircle } from 'lucide-react';
import { UserManager } from './components/UserManager';

export default function App() {
  const [session, setSession] = useState<{ role: UserRole, name: string, username: string } | null>(() => {
    const saved = localStorage.getItem('seg_auth');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    companyName: 'S.E.G',
    defaultInterestRate: 3.5,
    defaultReturnedInterestRate: 5.0,
    defaultReturnedFine: 2.0
  });

  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state Changes
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsFirebaseReady(true);
      } else {
        // Try to log in anonymously if not logged in
        // This ensures the user always has a session for Firestore
        try {
          await loginAnonymously();
        } catch (err) {
          console.error('Firebase auto-login failed:', err);
        }
        // Always set isFirebaseReady to true since firestore.rules now allow public read/write
        setIsFirebaseReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Initialize data from Firebase only when session and app-session are ready
  useEffect(() => {
    if (!session || !isFirebaseReady) {
      if (!session) setLoading(false);
      return;
    }

    setLoading(true);
    let loadedCount = 0;
    const totalToLoad = 5;

    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) setLoading(false);
    };

    // Subscriptions with progress tracking
    const unsubClients = subscribeToCollection<Client>('clients', (data) => {
      setClients(data);
      checkLoaded();
    }, 'createdAt');
    
    const unsubBanks = subscribeToCollection<Bank>('banks', (data) => {
      setBanks(data);
      checkLoaded();
    }, 'createdAt');
    
    const unsubTransactions = subscribeToCollection<Transaction>('transactions', (data) => {
      setTransactions(data);
      checkLoaded();
    }, 'createdAt');
    
    const unsubUsers = subscribeToCollection<AppUser>('users', (data) => {
      const adminExists = data.some(u => u.username.toLowerCase() === 'admin');
      const samuelExists = data.some(u => u.username.toLowerCase() === 'samuel');
      const merged = [...data];
      if (!adminExists) {
        merged.unshift({
          id: 'user-admin',
          username: 'admin',
          name: 'Administrador',
          role: 'admin'
        });
      }
      if (!samuelExists) {
        merged.push({
          id: 'user-samuel',
          username: 'samuel',
          name: 'Samuel',
          role: 'operator'
        });
      }
      setUsers(merged);
      checkLoaded();
    }, 'createdAt');
    
    const unsubSettings = subscribeToCollection<SystemSettings>('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
      checkLoaded();
    });

    // Migration from localStorage to Firestore (Once)
    const performMigration = async (collName: string, storageKey: string) => {
      try {
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Migrating ${parsed.length} items to ${collName}...`);
            for (const item of parsed) {
              await saveItem(collName, item);
            }
          }
        }
      } catch (err) {
        console.error(`Migration failed for ${collName}:`, err);
      }
    };

    const runAllMigrations = async () => {
      // Small delay to ensure subscriptions have a chance to return empty
      setTimeout(async () => {
        const migrationDone = localStorage.getItem('firestore_migration_done');
        if (migrationDone) return;

        console.log('Starting migration to Firestore...');
        await performMigration('clients', 'fator_clients');
        await performMigration('banks', 'fator_banks');
        await performMigration('transactions', 'fator_transactions');
        await performMigration('users', 'fator_users');
        await performMigration('settings', 'fator_settings');
        
        localStorage.setItem('firestore_migration_done', 'true');
        console.log('Migration completed.');
      }, 3000);
    };

    runAllMigrations();

    return () => {
      unsubClients();
      unsubBanks();
      unsubTransactions();
      unsubUsers();
      unsubSettings();
    };
  }, [session, isFirebaseReady]);

  const handleSaveClient = async (client: Client) => {
    setLoading(true);
    try {
      await saveItem('clients', client);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    setLoading(true);
    try {
      await deleteItem('clients', id);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBank = async (bank: Bank) => {
    setLoading(true);
    try {
      await saveItem('banks', bank);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (id: string) => {
    setLoading(true);
    try {
      await deleteItem('banks', id);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTransaction = async (txData: Transaction | Transaction[]) => {
    const newTxs = Array.isArray(txData) ? txData : [txData];
    for (const tx of newTxs) {
      await saveItem('transactions', tx);
    }
    setActiveView('history');
  };

  const handleSaveUser = async (user: AppUser) => {
    setLoading(true);
    try {
      await saveItem('users', user);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setLoading(true);
    try {
      await deleteItem('users', id);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClientStatus = async (clientId: string, status: 'active' | 'blocked') => {
    setLoading(true);
    try {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        await saveItem('clients', { ...client, status });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTransaction = async (id: string, status: TransactionStatus, reason?: string) => {
    setLoading(true);
    try {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        const updatedTx = { 
          ...tx, 
          status, 
          returnReason: reason, 
          returnedAt: status === 'returned' ? new Date().toISOString() : undefined 
        };

        if (status === 'returned') {
          const client = clients.find(c => c.id === tx.clientId);
          if (client && client.status === 'active') {
             await saveItem('clients', { ...client, status: 'blocked' });
          }
        } else if (status === 'liquidated' || status === 'active') {
          const client = clients.find(c => c.id === tx.clientId);
          if (client && client.status === 'blocked') {
            const otherReturned = transactions.filter(t => t.clientId === client.id && t.status === 'returned' && t.id !== tx.id);
            if (otherReturned.length === 0) {
              await saveItem('clients', { ...client, status: 'active' });
            }
          }
        }
        await saveItem('transactions', updatedTx);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setLoading(true);
    try {
      await deleteItem('transactions', id);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = async (updatedTx: Transaction) => {
    setLoading(true);
    try {
      if (updatedTx.status === 'returned') {
        const client = clients.find(c => c.id === updatedTx.clientId);
        if (client && client.status === 'active') {
          await saveItem('clients', { ...client, status: 'blocked' });
        }
      } else if (updatedTx.status === 'liquidated' || updatedTx.status === 'active') {
        const client = clients.find(c => c.id === updatedTx.clientId);
        if (client && client.status === 'blocked') {
          const otherReturned = transactions.filter(t => t.clientId === client.id && t.status === 'returned' && t.id !== updatedTx.id);
          if (otherReturned.length === 0) {
            await saveItem('clients', { ...client, status: 'active' });
          }
        }
      }
      await saveItem('transactions', updatedTx);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (session?.role !== 'admin') {
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const newSettings: any = {
        companyName: formData.get('companyName') as string,
        defaultInterestRate: Number(formData.get('defaultInterestRate')),
        defaultReturnedInterestRate: Number(formData.get('defaultReturnedInterestRate')),
        defaultReturnedFine: Number(formData.get('defaultReturnedFine')),
        id: settings.id || 'main-settings'
      };
      await saveItem('settings', newSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (role: UserRole, name: string, username: string) => {
    const sessionData = { role, name, username };
    setSession(sessionData);
    localStorage.setItem('seg_auth', JSON.stringify(sessionData));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('seg_auth');
  };

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard clients={clients} transactions={transactions} banks={banks} role={session?.role} onNavigate={setActiveView} />;
      case 'clients':
        return <ClientManager clients={clients} onSave={handleSaveClient} onDelete={handleDeleteClient} role={session?.role} />;
      case 'banks':
        return <BankManager banks={banks} onSave={handleSaveBank} onDelete={handleDeleteBank} role={session?.role} />;
      case 'discount':
        return <DiscountForm clients={clients} banks={banks} settings={settings} onConfirm={handleNewTransaction} />;
      case 'history':
        return (
          <TransactionHistory 
            transactions={transactions} 
            clients={clients} 
            banks={banks} 
            onUpdateStatus={handleUpdateTransaction} 
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleEditTransaction}
          />
        );
      case 'report-client':
      case 'report-type':
      case 'report-period':
      case 'report-date':
      case 'report-returned':
      case 'report-open':
        return <ReportGenerator view={activeView} transactions={transactions} clients={clients} banks={banks} />;
      case 'users':
        return <UserManager users={users} onSave={handleSaveUser} onDelete={handleDeleteUser} />;
      case 'returned':
        if (session?.role !== 'admin') {
          return <div className="p-8 text-center text-slate-500 font-bold">Acesso restrito ao administrador.</div>;
        }
        return (
          <ReturnedChecksManager 
            transactions={transactions} 
            clients={clients} 
            banks={banks} 
            settings={settings}
            onEditTransaction={handleEditTransaction}
            onUpdateClientStatus={handleUpdateClientStatus}
          />
        );
      case 'settings':
        return (
          <div className="space-y-6 max-w-2xl">
            <header>
              <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
              <p className="text-slate-500 text-sm">Personalize os parâmetros globais do sistema.</p>
            </header>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                <Settings className="w-5 h-5 text-slate-400" />
                <h2 className="font-bold text-slate-700 uppercase text-xs tracking-widest">Ajustes Gerais</h2>
              </div>
              <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nome da Empresa</label>
                  <input name="companyName" defaultValue={settings.companyName} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-brand-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Taxa de Juros Padrão (%)</label>
                  <div className="relative">
                    <input name="defaultInterestRate" type="number" step="0.1" defaultValue={settings.defaultInterestRate} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-brand-primary" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Taxa Juros Devolvido (% ao Mês)</label>
                    <div className="relative">
                      <input name="defaultReturnedInterestRate" type="number" step="0.1" defaultValue={settings.defaultReturnedInterestRate ?? 5.0} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-brand-primary" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Multa Adicional Devolvido (%)</label>
                    <div className="relative">
                      <input name="defaultReturnedFine" type="number" step="0.1" defaultValue={settings.defaultReturnedFine ?? 2.0} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-brand-primary" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>
                <button type="submit" className="bg-brand-primary text-white w-full py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-600 transition-all">
                  Salvar Preferências
                </button>
              </form>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
              <Info className="w-6 h-6 text-blue-500 shrink-0" />
              <div className="text-sm text-blue-800 space-y-2">
                <p className="font-bold">Sincronização em Tempo Real</p>
                <p>Todos os dados do Factori são persistidos com segurança na nuvem (Firestore) e sincronizados em tempo real entre seus dispositivos.</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <CreditCard className="w-20 h-20 mb-4 opacity-20" />
            <h3 className="text-xl font-bold uppercase tracking-widest">Em Breve</h3>
            <p>Este módulo de relatório está sendo finalizado.</p>
            <button 
              onClick={() => setActiveView('dashboard')}
              className="mt-6 text-brand-primary font-bold hover:underline"
            >
              Voltar ao Início
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex print:bg-white">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        authRole={session.role} 
        authName={session.name} 
        onLogout={handleLogout} 
      />
      
      <main className="ml-64 p-10 print:ml-0 print:p-0 relative flex-1">
        {loading && (
          <div className="fixed top-6 right-8 z-[100] flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-indigo-200 animate-pulse border border-indigo-400">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            Sincronizando Dados
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
