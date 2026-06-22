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
  ArrowDownRight,
  BarChart3,
  PieChart,
  CalendarCheck,
  AlertTriangle,
  ChevronRight,
  CreditCard,
  FileText
} from 'lucide-react';
import { Client, Transaction, Bank } from '../types';
import { motion } from 'motion/react';

interface DashboardProps {
  clients: Client[];
  transactions: Transaction[];
  banks: Bank[];
  role: string | undefined;
  onNavigate: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ clients, transactions, banks, role, onNavigate }) => {
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
    { label: 'Títulos Devolvidos', value: returnedCount, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Clientes Bloqueados', value: blockedClients, icon: Lock, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  // 1. Portfolio Breakdown by Asset Type
  const activeTx = transactions.filter(t => t.status === 'active');
  const chequeTx = activeTx.filter(t => !t.operationType || t.operationType === 'cheque');
  const promissoriaTx = activeTx.filter(t => t.operationType === 'promissoria');
  const notaFiscalTx = activeTx.filter(t => t.operationType === 'nota_fiscal');

  const chequeSum = chequeTx.reduce((sum, t) => sum + t.grossValue, 0);
  const promissoriaSum = promissoriaTx.reduce((sum, t) => sum + t.grossValue, 0);
  const notaFiscalSum = notaFiscalTx.reduce((sum, t) => sum + t.grossValue, 0);

  const totalActive = chequeSum + promissoriaSum + notaFiscalSum;

  const chequePct = totalActive > 0 ? (chequeSum / totalActive) * 100 : 0;
  const promissoriaPct = totalActive > 0 ? (promissoriaSum / totalActive) * 100 : 0;
  const notaFiscalPct = totalActive > 0 ? (notaFiscalSum / totalActive) * 100 : 0;

  // 2. Today's Maturities (Vencimentos do Dia) - Organizados por abas
  const [todayTab, setTodayTab] = React.useState<'cheque' | 'promissoria' | 'nota_fiscal'>('cheque');

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getLocalDateString(new Date());

  const activeTxToday = transactions.filter(t => t.status === 'active' && t.dueDate === todayStr);

  const todayCheques = activeTxToday.filter(t => !t.operationType || t.operationType === 'cheque');
  const todayPromissorias = activeTxToday.filter(t => t.operationType === 'promissoria');
  const todayNotasFiscais = activeTxToday.filter(t => t.operationType === 'nota_fiscal');

  const todayChequeSum = todayCheques.reduce((sum, t) => sum + t.grossValue, 0);
  const todayPromissoriaSum = todayPromissorias.reduce((sum, t) => sum + t.grossValue, 0);
  const todayNotaFiscalSum = todayNotasFiscais.reduce((sum, t) => sum + t.grossValue, 0);

  // 3. Maturity / Cash Flow Projection
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const projection = {
    overdue: { label: 'Vencidos / Atrasados', amount: 0, count: 0, color: 'text-rose-600', barBg: 'bg-rose-500' },
    next7: { label: '1 a 7 Dias', amount: 0, count: 0, color: 'text-amber-600', barBg: 'bg-amber-500' },
    next15: { label: '8 a 15 Dias', amount: 0, count: 0, color: 'text-indigo-600', barBg: 'bg-indigo-500' },
    next30: { label: '16 a 30 Dias', amount: 0, count: 0, color: 'text-blue-600', barBg: 'bg-blue-50' },
    beyond30: { label: 'Em dia (30+ Dias)', amount: 0, count: 0, color: 'text-emerald-600', barBg: 'bg-emerald-500' },
  };

  activeTx.forEach(tx => {
    if (!tx.dueDate) return;
    const due = new Date(tx.dueDate + 'T12:00:00');
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      projection.overdue.amount += tx.grossValue;
      projection.overdue.count += 1;
    } else if (daysLeft <= 7) {
      projection.next7.amount += tx.grossValue;
      projection.next7.count += 1;
    } else if (daysLeft <= 15) {
      projection.next15.amount += tx.grossValue;
      projection.next15.count += 1;
    } else if (daysLeft <= 30) {
      projection.next30.amount += tx.grossValue;
      projection.next30.count += 1;
    } else {
      projection.beyond30.amount += tx.grossValue;
      projection.beyond30.count += 1;
    }
  });

  const maxProjectionValue = Math.max(...Object.values(projection).map(p => p.amount), 1);

  // 4. Credit Limit Utilization Monitor
  const clientExposure = clients.map(client => {
    const clientTx = transactions.filter(t => t.clientId === client.id && (t.status === 'active' || t.status === 'returned'));
    const totalExposure = clientTx.reduce((sum, t) => sum + t.grossValue, 0);
    const pct = client.creditLimit > 0 ? (totalExposure / client.creditLimit) * 100 : 0;
    return {
      client,
      exposure: totalExposure,
      percentage: pct,
    };
  });

  const criticalExposures = clientExposure
    .filter(e => e.exposure > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel de Controle</h1>
          <p className="text-slate-500 text-sm">Bem-vindo ao centro de operações da Factory.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Servidor Conectado
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const isReturned = stat.label === 'Títulos Devolvidos' && returnedCount > 0;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => stat.label === 'Títulos Devolvidos' && onNavigate('returned')}
              className={`relative bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all ${
                stat.label === 'Títulos Devolvidos' ? 'cursor-pointer' : ''
              } ${isReturned ? 'ring-2 ring-rose-500 ring-offset-2' : ''}`}
            >
              {isReturned && (
                <div className="absolute top-3 right-3 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[8px] font-black text-white flex items-center justify-center">
                    {returnedCount}
                  </span>
                </div>
              )}
              <div className={`p-3 rounded-lg ${isReturned ? 'bg-rose-50' : stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${isReturned ? 'text-rose-600' : stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-xl font-bold ${isReturned ? 'text-rose-600' : 'text-slate-800'}`}>{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Seção Vencimentos de Hoje por Abas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
              <h2 className="font-bold text-slate-800 text-base">📌 Compromissos e Vencimentos de Hoje</h2>
            </div>
            <p className="text-slate-500 text-xs mt-1">Monitore e gerencie cheques a receber, promissórias e notas fiscais agendadas para o dia atual.</p>
          </div>
          <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm flex items-center gap-1.5 self-start md:self-auto uppercase">
            📅 {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-100 bg-slate-50/25 p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setTodayTab('cheque')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              todayTab === 'cheque'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cheques para Depósito</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              todayTab === 'cheque' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {todayCheques.length}
            </span>
          </button>

          <button
            onClick={() => setTodayTab('promissoria')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              todayTab === 'promissoria'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Promissórias</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              todayTab === 'promissoria' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {todayPromissorias.length}
            </span>
          </button>

          <button
            onClick={() => setTodayTab('nota_fiscal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              todayTab === 'nota_fiscal'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notas Fiscais</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              todayTab === 'nota_fiscal' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {todayNotasFiscais.length}
            </span>
          </button>
        </div>

        {/* Listagem da Aba Selecionada */}
        <div className="p-4">
          {todayTab === 'cheque' && (
            <div className="space-y-4">
              {todayCheques.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic font-medium">
                  Nenhum cheque para depósito programado para hoje.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2">Cliente / Emitente</th>
                        <th className="px-4 py-2">Banco / Referência</th>
                        <th className="px-4 py-2 text-right">Valor Bruto</th>
                        <th className="px-4 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {todayCheques.map((tx) => {
                        const client = clients.find(c => c.id === tx.clientId);
                        const bank = banks.find(b => b.id === tx.bankId);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-800 text-xs">{client?.name || 'Desconhecido'}</div>
                              <div className="text-[10px] text-indigo-600 font-medium">Emitente: {tx.issuer}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-[10px] font-semibold text-slate-700">{bank?.name || '-'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Nº Ref: {tx.checkNumber}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800 text-xs">
                              R$ {tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => onNavigate('history')}
                                className="text-[10px] text-indigo-600 hover:text-indigo-850 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-all"
                              >
                                Ver Histórico
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/50 font-bold border-t border-slate-100 text-[11px]">
                      <tr>
                        <td colSpan={2} className="px-4 py-2.5 text-slate-600">Total de Cheques de Hoje:</td>
                        <td className="px-4 py-2.5 text-right text-indigo-700">
                          R$ {todayChequeSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {todayTab === 'promissoria' && (
            <div className="space-y-4">
              {todayPromissorias.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic font-medium">
                  Nenhuma promissória vencendo hoje.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2">Cliente / Emitente</th>
                        <th className="px-4 py-2">Referência Documento</th>
                        <th className="px-4 py-2 text-right">Valor Bruto</th>
                        <th className="px-4 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {todayPromissorias.map((tx) => {
                        const client = clients.find(c => c.id === tx.clientId);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-800 text-xs">{client?.name || 'Desconhecido'}</div>
                              <div className="text-[10px] text-amber-600 font-medium">Emitente/Devedor: {tx.issuer}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-[10px] text-slate-600">
                              Ref: {tx.checkNumber}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800 text-xs">
                              R$ {tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => onNavigate('history')}
                                className="text-[10px] text-amber-600 hover:text-amber-805 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-all"
                              >
                                Ver Histórico
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/50 font-bold border-t border-slate-100 text-[11px]">
                      <tr>
                        <td colSpan={2} className="px-4 py-2.5 text-slate-600">Total de Promissórias de Hoje:</td>
                        <td className="px-4 py-2.5 text-right text-amber-700">
                          R$ {todayPromissoriaSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {todayTab === 'nota_fiscal' && (
            <div className="space-y-4">
              {todayNotasFiscais.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic font-medium">
                  Nenhuma nota fiscal vencendo hoje.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2">Cliente / Pagador</th>
                        <th className="px-4 py-2">Número da Nota Fiscal</th>
                        <th className="px-4 py-2 text-right">Valor Bruto</th>
                        <th className="px-4 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {todayNotasFiscais.map((tx) => {
                        const client = clients.find(c => c.id === tx.clientId);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-800 text-xs">{client?.name || 'Desconhecido'}</div>
                              <div className="text-[10px] text-blue-600 font-medium">Sacado: {tx.issuer}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-[10px] text-slate-600">
                              NF Nº: {tx.checkNumber}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800 text-xs">
                              R$ {tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => onNavigate('history')}
                                className="text-[10px] text-blue-600 hover:text-blue-805 font-bold bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-all"
                              >
                                Ver Histórico
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/50 font-bold border-t border-slate-100 text-[11px]">
                      <tr>
                        <td colSpan={2} className="px-4 py-2.5 text-slate-600">Total de Notas Fiscais de Hoje:</td>
                        <td className="px-4 py-2.5 text-right text-blue-700">
                          R$ {todayNotaFiscalSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Analytics Bento Grid (Enhancements!) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card A: Portfolio Breakdown by Asset Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">Distribuição por Ativo</h2>
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Proporção Ativa</span>
          </div>

          <div className="space-y-4">
            {/* Horizontal Stacked Bar */}
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${chequePct}%` }} 
                className="bg-indigo-600 h-full transition-all" 
                title={`Cheques: ${chequePct.toFixed(1)}%`}
              />
              <div 
                style={{ width: `${promissoriaPct}%` }} 
                className="bg-amber-500 h-full transition-all" 
                title={`Promissórias: ${promissoriaPct.toFixed(1)}%`}
              />
              <div 
                style={{ width: `${notaFiscalPct}%` }} 
                className="bg-blue-500 h-full transition-all" 
                title={`Notas Fiscais: ${notaFiscalPct.toFixed(1)}%`}
              />
            </div>

            {/* Percentages and values detail */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600 mr-1.5" />
                <span className="text-[10px] font-black uppercase text-slate-500">Cheques</span>
                <p className="text-sm font-bold text-slate-800">R$ {chequeSum.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-indigo-600 font-bold">{chequePct.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
                <span className="text-[10px] font-black uppercase text-slate-500">Promissórias</span>
                <p className="text-sm font-bold text-slate-800">R$ {promissoriaSum.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-amber-600 font-bold">{promissoriaPct.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5" />
                <span className="text-[10px] font-black uppercase text-slate-500">N. Fiscais</span>
                <p className="text-sm font-bold text-slate-800">R$ {notaFiscalSum.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-blue-600 font-bold">{notaFiscalPct.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total da Carteira Ativa:</span>
            <span className="font-bold text-slate-800">R$ {totalActive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </motion.div>

        {/* Card B: Cash Flow Maturities Projection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800">Projeção de Vencimentos</h2>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Fluxo de Caixa</span>
          </div>

          <div className="space-y-3">
            {Object.entries(projection).map(([key, item]) => {
              const pctOfMax = (item.amount / maxProjectionValue) * 100;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.barBg}`} />
                      {item.label} <span className="text-slate-400">({item.count} doc)</span>
                    </span>
                    <span className="text-slate-800 font-bold">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.max(pctOfMax, item.amount > 0 ? 3 : 0)}%` }} 
                      className={`${item.barBg} h-full rounded-full transition-all`} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 uppercase font-black tracking-widest text-center">
            Planejamento Dinâmico de Retorno de Capital
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Últimas Transações</h2>
            <button 
              onClick={() => onNavigate('history')}
              className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-0.5"
            >
              Ver completo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Cliente / Tipo</th>
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
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-[11px] uppercase truncate max-w-[180px]">{client?.name || 'Desconhecido'}</div>
                          {tx.issuer && (
                            <div className="text-[9px] text-slate-500 font-bold uppercase truncate max-w-[180px]">
                              {tx.issuer}
                            </div>
                          )}
                          <div className="mt-1">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ring-1 ring-inset ${
                              tx.operationType === 'promissoria' ? 'bg-amber-50 text-amber-600 ring-amber-500/20' :
                              tx.operationType === 'nota_fiscal' ? 'bg-blue-50 text-blue-600 ring-blue-500/20' :
                              'bg-indigo-50 text-indigo-600 ring-indigo-500/20'
                            }`}>
                              {tx.operationType === 'promissoria' ? 'PROMISSÓRIA' :
                               tx.operationType === 'nota_fiscal' ? 'NOTA FISCAL' :
                               'CHEQUE'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(tx.createdAt).toLocaleDateString('pt-BR')}</td>
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

        {/* Quick Actions & High Credit Utilization Alerter */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
            <h2 className="font-bold text-slate-800">Ações Rápidas</h2>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => onNavigate('discount')}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-brand-primary hover:bg-indigo-50 transition-all group text-left w-full"
              >
                <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100">
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Novo Desconto</p>
                  <p className="text-[10px] text-slate-500 italic">Cheque, Promissória ou NF</p>
                </div>
              </button>
              <button 
                onClick={() => onNavigate('clients')}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-brand-primary hover:bg-indigo-50 transition-all group text-left w-full"
              >
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Cadastrar Cliente</p>
                  <p className="text-[10px] text-slate-500 italic">Novo limite de crédito</p>
                </div>
              </button>
              {role === 'admin' && (
                <button 
                  onClick={() => onNavigate('returned')}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-brand-primary hover:bg-slate-50 transition-all group text-left w-full"
                >
                  <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100">
                    <ArrowDownRight className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Nova Devolução</p>
                    <p className="text-[10px] text-slate-500 italic">Registro de retorno</p>
                  </div>
                </button>
              )}
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
                  <div className="bg-emerald-500 h-full w-[100%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Panel: Credit Limit Monitor */}
          {criticalExposures.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Uso de Limite de Crédito</h3>
              </div>
              
              <div className="space-y-3.5">
                {criticalExposures.map((item) => {
                  const stateColor = item.percentage > 90 ? 'text-rose-600' : item.percentage > 70 ? 'text-amber-500' : 'text-slate-700';
                  const barColor = item.percentage > 90 ? 'bg-rose-500' : item.percentage > 70 ? 'bg-amber-500' : 'bg-indigo-500';
                  
                  return (
                    <div key={item.client.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[150px]">{item.client.name}</span>
                        <span className={`font-bold ${stateColor}`}>{item.percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(item.percentage, 100)}%` }} 
                          className={`${barColor} h-full rounded-full transition-all`} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Ativo: R$ {item.exposure.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                        <span>Limite: R$ {item.client.creditLimit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
