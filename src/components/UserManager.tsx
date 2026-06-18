/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, User, Search, Edit2, AlertCircle } from 'lucide-react';
import { AppUser } from '../types';

interface UserManagerProps {
  users: AppUser[];
  onSave: (user: AppUser) => void;
  onDelete: (id: string) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ users, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: 'operator' as 'admin' | 'operator',
    password: ''
  });

  const openModal = (user?: AppUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        name: user.name,
        role: user.role,
        password: '' // Don't show password
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        name: '',
        role: 'operator',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: any = {
      ...formData,
      id: editingUser?.id || `user-${Date.now()}`
    };
    onSave(newUser);
    setIsModalOpen(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 text-sm">Controle quem tem acesso ao sistema e suas permissões.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-brand-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-[0.98]"
        >
          <UserPlus className="w-5 h-5" /> Novo Usuário
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por nome ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Nome Completo</th>
                <th className="px-6 py-4">Perfil</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{user.username}</td>
                  <td className="px-6 py-4 text-slate-800 font-medium">{user.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => openModal(user)}
                        className="p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(user.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editingUser ? 'Editar Usuário' : 'Cadastrar Usuário'}</h2>
              <p className="text-sm text-slate-500">Preencha as credenciais de acesso.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário</label>
                  <input 
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary"
                    placeholder="Ex: samuel"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Exibição</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary"
                    placeholder="Ex: Samuel Martins"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Perfil de Acesso</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary"
                  >
                    <option value="operator">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha Provisória</label>
                    <input 
                      required
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary"
                      placeholder="••••••••"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-4 bg-brand-primary text-white rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
