/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Info,
  Hash
} from 'lucide-react';
import { Bank } from '../types';
import { generateId } from '../lib/storage';

interface BankManagerProps {
  banks: Bank[];
  onSave: (bank: Bank) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  role?: string;
}

export const BankManager: React.FC<BankManagerProps> = ({ banks, onSave, onDelete, role }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredBanks = banks.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.code.includes(searchTerm)
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      const bankData: Bank = {
        id: editingBank?.id || generateId(),
        name: formData.get('name') as string,
        code: formData.get('code') as string,
        agency: formData.get('agency') as string,
        observations: formData.get('observations') as string,
        createdAt: editingBank?.createdAt || new Date().toISOString(),
      };

      await onSave(bankData);
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar banco.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBank(null);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await onDelete(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir banco.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bancos</h1>
          <p className="text-slate-500 text-sm">Cadastre as instituições financeiras dos cheques.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Banco
        </button>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou código BACEN..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Instituição</th>
                <th className="px-6 py-4">Código / Agência</th>
                <th className="px-6 py-4">Observações</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBanks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Nenhum banco encontrado.
                  </td>
                </tr>
              ) : (
                filteredBanks.map((bank) => (
                  <tr key={bank.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Building2 className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="font-semibold text-slate-800">{bank.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Hash className="w-3 h-3 text-slate-400" /> {bank.code}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Ag: {bank.agency}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                      {bank.observations || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setEditingBank(bank); setIsModalOpen(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {role === 'admin' && (
                          <button 
                            onClick={() => setDeleteConfirmId(bank.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingBank ? 'Editar Banco' : 'Novo Banco'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Banco</label>
                <input required name="name" defaultValue={editingBank?.name} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:border-brand-primary" placeholder="Ex: Banco Itaú" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código (BACEN)</label>
                  <input required name="code" defaultValue={editingBank?.code} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:border-brand-primary" placeholder="341" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agência Padrão</label>
                  <input required name="agency" defaultValue={editingBank?.agency} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:border-brand-primary" placeholder="0000" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observações</label>
                <textarea name="observations" defaultValue={editingBank?.observations} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-brand-primary h-24" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-brand-primary text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors disabled:opacity-50">
                  {loading ? 'Salvando...' : (editingBank ? 'Salvar' : 'Cadastrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Remover Banco?</h2>
              <p className="text-slate-500 mt-2 text-sm">
                Tem certeza que deseja remover este banco da sua lista?
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-6 py-3 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50"
              >
                Não
              </button>
              <button 
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                disabled={loading}
                className="flex-1 bg-rose-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? 'Removendo...' : 'Sim, Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
