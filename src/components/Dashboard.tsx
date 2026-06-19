/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Lock, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Client, Transaction } from '../types';
import { motion } from 'motion/react';

interface DashboardProps {
  clients: Client[];
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ clients, transactions }) => {
  const activeClients = clients.filter(c => c.status === 'active').length;
  const blockedClients = clients.filter(c => c.status === 'blocked').length;
  const openValue = transactions
    .filter(t => t.status === 'active')
    .reduce((sum, t) => sum + t.grossValue, 0);
  const openInterest = transactions
    .filter(t => t.status === 'active')
    .reduce((sum, t) => sum + (t.grossValue - t.netValue), 0);
  const returnedCount = transactions.filter(t => t.status === 'returned').length;

  const lastTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const stats = [
    { label: 'Clientes Ativos', value: activeClients, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Valor em Aberto', value: `R$ ${openValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Cheques Devolvidos', value: returnedCount, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Clientes Bloqueados', value: blockedClients, icon: Lock, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm">Bem-vindo ao centro de operações da Factori.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4"
          >
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Últimas Transações</h2>
            <button className="text-xs font-semibold text-brand-primary hover:underline">Ver tudo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lastTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      Nenhuma transação registrada.
                    </td>
                  </tr>
                ) : (
                  lastTransactions.map((tx, index) => {
                    const client = clients.find(c => c.id === tx.clientId);
                    return (
                      <tr 
                        key={tx.id} 
                        className={`transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-zebra-table'
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-slate-700">{client?.name || 'Desconhecido'}</td>
                        <td className="px-6 py-4 text-slate-500">{new Date(tx.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          R$ {tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            tx.status === 'active' ? 'bg-indigo-100 text-indigo-700' :
                            tx.status === 'liquidated' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {tx.status === 'active' ? 'ATIVO' :
                             tx.status === 'liquidated' ? 'LIQUIDADO' :
                             'DEVOLVIDO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
          <h2 className="font-bold text-slate-800">Ações Rápidas</h2>
          <div className="grid grid-cols-1 gap-3">
            <button className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-brand-primary hover:bg-indigo-50 transition-all group text-left">
              <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Novo Desconto</p>
                <p className="text-[10px] text-slate-500 italic">Cheque ou parcelado</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-brand-primary hover:bg-indigo-50 transition-all group text-left">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Cadastrar Cliente</p>
                <p className="text-[10px] text-slate-500 italic">Novo limite de crédito</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-brand-primary hover:bg-indigo-50 transition-all group text-left">
              <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100">
                <ArrowDownRight className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Nova Devolução</p>
                <p className="text-[10px] text-slate-500 italic">Registro de retorno</p>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resumo Financeiro</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Lucro Estimado (Juros em Aberto)</span>
                <span className="font-semibold text-emerald-600">
                  R$ {openInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-primary h-full w-[65%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
