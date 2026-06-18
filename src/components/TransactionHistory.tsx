/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  History as HistoryIcon,
  Search,
  Filter,
  Download,
  Printer,
  ChevronDown,
  ArrowUpRight,
  RotateCcw,
  CheckCircle,
  MoreVertical,
  Building2
} from 'lucide-react';
import { Client, Bank, Transaction, TransactionStatus } from '../types';

interface HistoryManagerProps {
  transactions: Transaction[];
  clients: Client[];
  banks: Bank[];
  onUpdateStatus: (txId: string, status: TransactionStatus, reason?: string) => void;
}

export const TransactionHistory: React.FC<HistoryManagerProps> = ({ 
  transactions, 
  clients, 
  banks, 
  onUpdateStatus 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  const filtered = transactions.filter(tx => {
    const client = clients.find(c => c.id === tx.clientId);
    const matchesSearch = 
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.checkNumber.includes(searchTerm) ||
      tx.issuer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleExportCSV = () => {
    const headers = ['ID', 'Cliente', 'Emitente', 'Banco', 'Cheque', 'Valor Bruto', 'Valor Líquido', 'Status', 'Vencimento'];
    const rows = filtered.map(tx => [
      tx.id,
      clients.find(c => c.id === tx.clientId)?.name || '',
      tx.issuer,
      banks.find(b => b.id === tx.bankId)?.name || '',
      tx.checkNumber,
      tx.grossValue.toFixed(2),
      tx.netValue.toFixed(2),
      tx.status,
      tx.dueDate
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transacoes_factori.csv";
    link.click();
  };

  const handlePrint = () => {
    const printContent = document.getElementById('transaction-list-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir.');
      return;
    }

    // Get all styles from the current document
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('');
        } catch (e) {
          return '';
        }
      })
      .join('');

    const html = `
      <html>
        <head>
          <title>S.E.G - Histórico</title>
          <style>
            ${styles}
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; padding: 20px !important; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 10px; }
            }
          </style>
        </head>
        <body>
          <h1 class="text-2xl font-bold mb-1">S.E.G</h1>
          <p class="text-xs text-slate-500 mb-6">Histórico de Transações</p>
          ${printContent.innerHTML}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 700);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Histórico de Transações</h1>
          <p className="text-slate-500 text-sm">Visualize e exporte todos os lançamentos do sistema.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" title="Imprimir">
            <Printer className="w-5 h-5 text-slate-600" />
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filtrar por cliente ou nº cheque..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-primary"
          >
            <option value="all">TODOS STATUS</option>
            <option value="active">ATIVO</option>
            <option value="liquidated">LIQUIDADO</option>
            <option value="returned">DEVOLVIDO</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto" id="transaction-list-print">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Data Registro</th>
                <th className="px-6 py-4">Operação (Cliente / Emitente)</th>
                <th className="px-6 py-4 text-right">Crédito (Bruto)</th>
                <th className="px-6 py-4 text-right">Débito (Taxa)</th>
                <th className="px-6 py-4 text-right">Líquido</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Nenhuma operação encontrada nos filtros atuais.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const client = clients.find(c => c.id === tx.clientId);
                  const bank = banks.find(b => b.id === tx.bankId);
                  const taxValue = tx.grossValue - tx.netValue;
                  
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{client?.name}</span>
                          <span className="text-xs text-indigo-600 font-medium">Emitente: {tx.issuer}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {bank?.name} • CH {tx.checkNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        R$ {tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-rose-500">
                        - R$ {taxValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        R$ {tx.netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                          tx.status === 'active' ? 'bg-indigo-100 text-indigo-700' :
                          tx.status === 'liquidated' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === tx.id ? null : tx.id)}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </button>

                        {activeMenuId === tx.id && (
                          <div className="absolute right-6 top-12 bg-white rounded-xl shadow-2xl border border-slate-200 w-48 py-2 z-20 animate-in fade-in zoom-in duration-150">
                            {tx.status === 'active' && (
                              <>
                                <button 
                                  onClick={() => { onUpdateStatus(tx.id, 'liquidated'); setActiveMenuId(null); }}
                                  className="w-full h-10 px-4 text-left text-sm font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" /> Liquidar Cheque
                                </button>
                                <button 
                                  onClick={() => { setShowReturnModal(tx.id); setActiveMenuId(null); }}
                                  className="w-full h-10 px-4 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <RotateCcw className="w-4 h-4" /> Registrar Devolução
                                </button>
                              </>
                            )}
                            {tx.status !== 'active' && (
                              <button 
                                onClick={() => { onUpdateStatus(tx.id, 'active'); setActiveMenuId(null); }}
                                className="w-full h-10 px-4 text-left text-sm font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                              >
                                <ArrowUpRight className="w-4 h-4" /> Reativar Operação
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Registrar Devolução</h2>
              <p className="text-sm text-slate-500">Informe o motivo da devolução do cheque.</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motivo / Observações</label>
                  <textarea 
                    autoFocus
                    required
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary min-h-[120px] resize-none"
                    placeholder="Ex: Alínea 11 - Sem fundos, Alínea 21 - Sustado..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowReturnModal(null)}
                  className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (returnReason.trim()) {
                      onUpdateStatus(showReturnModal, 'returned', returnReason);
                      setShowReturnModal(null);
                      setReturnReason('');
                    }
                  }}
                  disabled={!returnReason.trim()}
                  className="flex-1 py-3 px-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
