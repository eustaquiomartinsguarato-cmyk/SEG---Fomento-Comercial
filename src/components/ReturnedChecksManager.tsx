/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  RotateCcw, 
  Calendar, 
  DollarSign, 
  Edit2, 
  CheckCircle2, 
  Clock, 
  User, 
  ListFilter, 
  Building2, 
  AlertCircle, 
  X, 
  Percent, 
  TrendingUp,
  Search,
  Check
} from 'lucide-react';
import { Client, Bank, Transaction, SystemSettings, TransactionStatus } from '../types';
import { calculateDaysDiff, calculateInstallmentInterest } from '../lib/calculations';

interface ReturnedChecksManagerProps {
  transactions: Transaction[];
  clients: Client[];
  banks: Bank[];
  settings: SystemSettings;
  onEditTransaction: (tx: Transaction) => void;
  onUpdateClientStatus?: (clientId: string, status: 'active' | 'blocked') => void;
}

export const ReturnedChecksManager: React.FC<ReturnedChecksManagerProps> = ({
  transactions,
  clients,
  banks,
  settings,
  onEditTransaction,
  onUpdateClientStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subView, setSubView] = useState<'pending' | 'resolved'>('pending');

  // Modal State for Settlement
  const [settlingTx, setSettlingTx] = useState<Transaction | null>(null);
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [customSettledAmount, setCustomSettledAmount] = useState<number>(0);
  const [autoCalculateAmount, setAutoCalculateAmount] = useState(true);

  // Modal State for Editing Rates / Return Date
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editReturnDate, setEditReturnDate] = useState('');
  const [editInterestRate, setEditInterestRate] = useState(5.0);
  const [editFineRate, setEditFineRate] = useState(2.0);
  const [editReason, setEditReason] = useState('');

  // Filter returned transactions
  const returnedTransactions = transactions.filter(t => {
    if (subView === 'pending') {
      return t.status === 'returned';
    } else {
      // Resolved are transactions that are liquidated now but have returned history
      return t.status === 'liquidated' && !!t.returnedAt;
    }
  });

  const filtered = returnedTransactions.filter(tx => {
    const client = clients.find(c => c.id === tx.clientId);
    const matchesSearch = 
      (client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.checkNumber.includes(searchTerm) ||
      (tx.issuer || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate return metadata for a transaction
  const getReturnDetails = (tx: Transaction, customEndDateStr?: string) => {
    const returnDateStr = tx.returnedAt || tx.dueDate;
    const returnDate = new Date(returnDateStr + 'T12:00:00');
    
    let endDate = new Date();
    if (customEndDateStr) {
      endDate = new Date(customEndDateStr + 'T12:00:00');
    } else if (tx.status === 'liquidated' && tx.resolvedAt) {
      endDate = new Date(tx.resolvedAt + 'T12:00:00');
    }

    const days = calculateDaysDiff(returnDate, endDate);
    
    const interestRate = tx.returnedInterestRate !== undefined ? tx.returnedInterestRate : (settings.defaultReturnedInterestRate ?? 5.0);
    const fineRate = tx.returnedFine !== undefined ? tx.returnedFine : (settings.defaultReturnedFine ?? 2.0);

    const interestAmount = calculateInstallmentInterest(tx.grossValue, interestRate, days);
    const fineAmount = tx.grossValue * (fineRate / 100);
    const totalDue = tx.grossValue + interestAmount + fineAmount;

    return {
      returnDateStr,
      days,
      interestRate,
      fineRate,
      interestAmount,
      fineAmount,
      totalDue
    };
  };

  const handleOpenSettlement = (tx: Transaction) => {
    setSettlingTx(tx);
    const today = new Date().toISOString().split('T')[0];
    setSettlementDate(today);
    const details = getReturnDetails(tx, today);
    setCustomSettledAmount(Math.round(details.totalDue * 100) / 100);
    setAutoCalculateAmount(true);
  };

  const handleConfirmSettlement = () => {
    if (!settlingTx) return;

    const details = getReturnDetails(settlingTx, settlementDate);
    const finalAmount = autoCalculateAmount ? details.totalDue : customSettledAmount;

    const updated: Transaction = {
      ...settlingTx,
      status: 'liquidated',
      resolvedAt: settlementDate,
      resolvedAmount: finalAmount,
      returnedInterestRate: settlingTx.returnedInterestRate ?? (settings.defaultReturnedInterestRate ?? 5.0),
      returnedFine: settlingTx.returnedFine ?? (settings.defaultReturnedFine ?? 2.0)
    };

    onEditTransaction(updated);

    // Check if the client has any other active returned checks.
    // If not, ask to unblock the client.
    const otherReturned = transactions.filter(t => t.clientId === settlingTx.clientId && t.status === 'returned' && t.id !== settlingTx.id);
    if (otherReturned.length === 0) {
      const client = clients.find(c => c.id === settlingTx.clientId);
      if (client && client.status === 'blocked') {
        if (onUpdateClientStatus) {
          onUpdateClientStatus(client.id, 'active');
        }
      }
    }

    setSettlingTx(null);
  };

  const handleOpenEditRates = (tx: Transaction) => {
    setEditingTx(tx);
    setEditReturnDate(tx.returnedAt || new Date().toISOString().split('T')[0]);
    setEditInterestRate(tx.returnedInterestRate !== undefined ? tx.returnedInterestRate : (settings.defaultReturnedInterestRate ?? 5.0));
    setEditFineRate(tx.returnedFine !== undefined ? tx.returnedFine : (settings.defaultReturnedFine ?? 2.0));
    setEditReason(tx.returnReason || '');
  };

  const handleSaveRates = () => {
    if (!editingTx) return;

    const updated: Transaction = {
      ...editingTx,
      returnedAt: editReturnDate,
      returnedInterestRate: Number(editInterestRate),
      returnedFine: Number(editFineRate),
      returnReason: editReason
    };

    onEditTransaction(updated);
    setEditingTx(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-rose-500 animate-pulse" />
            Cheques Devolvidos a Receber
          </h1>
          <p className="text-slate-500 text-sm">
            Monitore juros, multas especiais e realize acertos de cheques devolvidos com cálculo automático por dia de atraso.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto shadow-sm">
          <button
            onClick={() => setSubView('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subView === 'pending'
                ? 'bg-white text-rose-600 shadow-md'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Pendentes de Acerto
          </button>
          <button
            onClick={() => setSubView('resolved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subView === 'resolved'
                ? 'bg-white text-emerald-600 shadow-md'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Histórico de Quitados
          </button>
        </div>
      </header>

      {/* FILTER PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, nº do cheque ou emitente..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* DATA DISPLAY */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[10px] uppercase tracking-widest leading-none">
              <tr>
                <th className="px-6 py-4">Cliente / Emitente</th>
                <th className="px-6 py-4">Banco / Cheque</th>
                <th className="px-6 py-4">Data Devolução</th>
                <th className="px-6 py-4 text-center">Dias {subView === 'pending' ? 'Unpaid' : 'Até Acerto'}</th>
                <th className="px-6 py-4 text-right">Valor Original</th>
                <th className="px-6 py-4 text-right">Taxa / Multa</th>
                <th className="px-6 py-4 text-right text-indigo-600">Total Acumulado</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    Nenhum cheque devolvido encontrado nos parâmetros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((tx, index) => {
                  const client = clients.find(c => c.id === tx.clientId);
                  const bank = banks.find(b => b.id === tx.bankId);
                  const details = getReturnDetails(tx);

                  return (
                    <tr 
                      key={tx.id} 
                      className={`transition-colors group ${
                        index % 2 === 0 ? 'bg-white' : 'bg-zebra-table'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{client?.name || 'Cliente excluído'}</div>
                        <div className="text-xs text-rose-600 flex items-center gap-1">
                          Emitente: <span className="font-semibold">{tx.issuer}</span>
                        </div>
                        {tx.returnReason && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">
                            Motivo: {tx.returnReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {bank?.name || 'Banco excluído'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">CH nº {tx.checkNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                        {details.returnDateStr ? new Date(details.returnDateStr + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full ${
                          subView === 'pending'
                            ? details.days > 30 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {details.days} dias
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-700 whitespace-nowrap">
                        R$ {tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="text-xs text-slate-500">
                          Juros: <span className="font-bold text-slate-700">{details.interestRate}%/mês</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Multa: <span className="font-bold text-slate-500">{details.fineRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="font-extrabold text-indigo-700 text-sm">
                          R$ {details.totalDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          (+ Juros: R$ {details.interestAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                          tx.status === 'active' ? 'bg-indigo-100 text-indigo-700' :
                          tx.status === 'liquidated' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {tx.status === 'active' ? 'ATIVO' :
                           tx.status === 'liquidated' ? 'LIQUIDADO' :
                           'DEVOLVIDO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {tx.status === 'returned' && (
                            <button
                              onClick={() => handleOpenSettlement(tx)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-md shadow-emerald-50"
                              title="Registrar recebimento de acerto"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Acertar
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditRates(tx)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                            title="Editar taxas e data de devolução"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUMMARY REPORT WIDGETS */}
      {subView === 'pending' && filtered.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-200 text-rose-700 rounded-2xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-800">Cálculo cumulativo de cheques devolvidos em aberto</p>
              <p className="text-xs text-rose-600">Total geral acumulado de juros e multas por atraso de retorno.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">Total Geral a Receber</span>
            <span className="text-2xl font-black text-rose-700">
              R$ {filtered.reduce((sum, tx) => sum + getReturnDetails(tx).totalDue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTRAR ACERTO */}
      {settlingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Efetuar Acerto de Cheque</h2>
                  <p className="text-xs text-slate-500">Registe o pagamento do cheque devolvido pelo cliente.</p>
                </div>
              </div>
              <button 
                onClick={() => setSettlingTx(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* DETAILS EXPLAINER */}
              {(() => {
                const client = clients.find(c => c.id === settlingTx.clientId);
                const details = getReturnDetails(settlingTx, settlementDate);
                return (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-2.5">
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-400">Cliente / Emitente:</span>
                      <span className="font-extrabold text-slate-700">{client?.name} (Emitente: {settlingTx.issuer})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valor Bruto Cheque:</span>
                      <span className="font-bold text-slate-700">R$ {settlingTx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tempo de Atraso:</span>
                      <span className="font-extrabold text-rose-600">{details.days} dias</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Juros Acumulados ({details.interestRate}% a.m/pro-rata):</span>
                      <span className="font-bold">R$ {details.interestAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Multa por Devolução ({details.fineRate}%):</span>
                      <span className="font-bold">R$ {details.fineAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data do Pagamento</label>
                  <input
                    type="date"
                    required
                    value={settlementDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setSettlementDate(newDate);
                      const details = getReturnDetails(settlingTx, newDate);
                      setCustomSettledAmount(Math.round(details.totalDue * 100) / 100);
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Recebido (R$)</label>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      autoCalculateAmount ? "text-emerald-700 bg-emerald-100" : "text-amber-700 bg-amber-100"
                    }`}>
                      {autoCalculateAmount ? "AUTOMÁTICO" : "MANUAL (VOCÊ DIGITOU)"}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={autoCalculateAmount ? Math.round(getReturnDetails(settlingTx, settlementDate).totalDue * 100) / 100 : customSettledAmount}
                      onChange={(e) => {
                        setCustomSettledAmount(Number(e.target.value));
                        setAutoCalculateAmount(false);
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-calc"
                  checked={autoCalculateAmount}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAutoCalculateAmount(checked);
                    if (checked) {
                      const details = getReturnDetails(settlingTx, settlementDate);
                      setCustomSettledAmount(Math.round(details.totalDue * 100) / 100);
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="auto-calc" className="text-xs text-slate-600 font-bold select-none cursor-pointer">
                  Utilizar valor calculado automaticamente com juros e multa (R$ {(Math.round(getReturnDetails(settlingTx, settlementDate).totalDue * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSettlingTx(null)}
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSettlement}
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all text-xs uppercase tracking-wider shadow-lg shadow-emerald-100"
                >
                  Confirmar Quitação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR TAXAS / DEVOLUÇÃO */}
      {editingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Edit2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Editar Parâmetros de Devolução</h2>
                  <p className="text-xs text-slate-500">Configure as alíquotas exclusivas e data para cobrança pro-rata.</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingTx(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Data Efetiva da Devolução</label>
                <input
                  type="date"
                  required
                  value={editReturnDate}
                  onChange={(e) => setEditReturnDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Atrativo Juros (% ao Mês)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={editInterestRate}
                      onChange={(e) => setEditInterestRate(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-600"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Atrativo Multa (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={editFineRate}
                      onChange={(e) => setEditFineRate(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-600"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Motivo do Retorno (Alínea)</label>
                <input
                  type="text"
                  placeholder="Ex: Alínea 11, Sem Fundos, Assinatura Divergente"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="flex-1 py-3 px-4 border border-slate-100 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveRates}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-xs uppercase tracking-wider shadow-lg shadow-indigo-100"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
