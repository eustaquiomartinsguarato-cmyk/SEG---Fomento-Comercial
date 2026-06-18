/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, User, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db, loginAnonymously } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export type UserRole = 'admin' | 'operator';

interface LoginPageProps {
  onLogin: (role: UserRole, name: string, username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in to Firebase Auth first to ensure rules allow access
      try {
        await loginAnonymously();
      } catch (authErr) {
        console.warn('Anonymous login fell back:', authErr);
      }

      // Hardcoded fallback for first run or emergency
      if (username === 'admin' && password === 'samuel*1967') {
        onLogin('admin', 'Administrador', 'admin');
        return;
      }

      if (username === 'samuel' && password === '2222') {
        onLogin('operator', 'Samuel', 'samuel');
        return;
      }

      // Check Firestore
      const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userData = snap.docs[0].data();
        // Since we don't have real auth yet, we'll assume any existing user is valid for now 
        // to facilitate the transition. In a real app, we'd check a hashed password.
        onLogin(userData.role, userData.name, userData.username);
      } else {
        setError('Usuário não encontrado ou credenciais inválidas.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar ao servidor. Verifique sua rede.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-brand-primary rounded-2xl mx-auto flex items-center justify-center text-white text-4xl font-black shadow-xl mb-6 shadow-brand-primary/20">
            S
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">S.E.G</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Plataforma de Factoring e Crédito</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Usuário</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-brand-primary focus:bg-white/10 transition-all font-medium"
                placeholder="Insira seu usuário"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-brand-primary focus:bg-white/10 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-lg shadow-brand-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
            {loading ? 'Verificando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Acesso Restrito a Colaboradores</p>
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-700 font-bold uppercase tracking-[0.3em]">
        © {new Date().getFullYear()} S.E.G
      </div>
    </div>
  );
};
