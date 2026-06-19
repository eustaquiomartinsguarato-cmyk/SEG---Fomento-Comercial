/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Lock, 
  Unlock, 
  Mail, 
  Phone, 
  FileText
} from 'lucide-react';
import { Client, ClientStatus } from '../types';
import { generateId } from '../lib/storage';

interface ClientManagerProps {
  clients: Client[];
  onSave: (client: Client) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  role?: string;
}

export const ClientManager: React.FC<ClientManagerProps> = ({ clients, onSave, onDelete, role }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm)
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      const clientData: Client = {
        id: editingClient?.id || generateId(),
        name: formData.get('name') as string,
        document: formData.get('document') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        creditLimit: Number(formData.get('creditLimit')),
        status: (editingClient?.status || 'active') as ClientStatus,
        observations: formData.get('observations') as string,
        createdAt: editingClient?.createdAt || new Date().toISOString(),
      };

      await onSave(clientData);
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await onDelete(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir cliente.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const toggleStatus = async (client: Client) => {
    const newStatus = client.status === 'active' ? 'blocked' : 'active';
    await onSave({ ...client, status: newStatus as any });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm">Gerencie sua base de tomadores e limites.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF/CNPJ..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome / Documento</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Limite de Crédito</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, index) => (
                  <tr 
                    key={client.id} 
                    className={`transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-zebra-table'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{client.name}</div>
                      <div className="text-[10px] text-slate-500">{client.document}</div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3 h-3" /> {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3 h-3" /> {client.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">
                        R$ {client.creditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(client)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                          client.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                      >
                        {client.status === 'active' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {client.status === 'active' ? 'Ativo' : 'Bloqueado'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {role === 'admin' && (
                          <button 
                            onClick={() => setDeleteConfirmId(client.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir"
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

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                  <input required name="name" defaultValue={editingClient?.name} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-brand-primary" placeholder="Ex: João Silva" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CPF/CNPJ</label>
                  <input required name="document" defaultValue={editingClient?.document} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-brand-primary" placeholder="000.000.000-00" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</label>
                  <input required name="email" type="email" defaultValue={editingClient?.email} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-brand-primary" placeholder="contato@exemplo.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone</label>
                  <input required name="phone" defaultValue={editingClient?.phone} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-brand-primary" placeholder="(00) 00000-0000" />
                </div>
                <div className="col-span-full space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Endereço</label>
                  <input required name="address" defaultValue={editingClient?.address} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-brand-primary" placeholder="Rua, Número, Bairro, Cidade - UF" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Limite de Crédito (R$)</label>
                  <input required name="creditLimit" type="number" defaultValue={editingClient?.creditLimit} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-brand-primary" step="0.01" />
                </div>
                <div className="col-span-full space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observações</label>
                  <textarea name="observations" defaultValue={editingClient?.observations} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-brand-primary h-24" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-6 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="bg-brand-primary text-white px-8 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors">
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Confirmar Exclusão?</h2>
              <p className="text-slate-500 mt-2">
                Tem certeza que deseja excluir <strong>{clients.find(c => c.id === deleteConfirmId)?.name}</strong>?<br />
                Esta ação <span className="text-rose-600 font-bold underline">não pode ser desfeita</span>.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-6 py-3 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                disabled={loading}
                className="flex-1 bg-rose-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 disabled:opacity-50"
              >
                {loading ? 'Excluindo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
