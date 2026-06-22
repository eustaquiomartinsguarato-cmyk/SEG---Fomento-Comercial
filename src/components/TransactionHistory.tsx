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
  Building2,
  Trash2,
  Edit,
  AlertTriangle,
  X,
  MessageCircle,
  MessageSquare
} from 'lucide-react';
import { Client, Bank, Transaction, TransactionStatus, SystemSettings } from '../types';
import { calculateDaysDiff, calculateInstallmentInterest } from '../lib/calculations';

interface HistoryManagerProps {
  transactions: Transaction[];
  clients: Client[];
  banks: Bank[];
  settings: SystemSettings;
  onUpdateStatus: (txId: string, status: TransactionStatus, reason?: string) => void;
  onDeleteTransaction?: (id: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const TransactionHistory: React.FC<HistoryManagerProps> = ({ 
  transactions, 
  clients, 
  banks, 
  settings,
  onUpdateStatus, 
  onDeleteTransaction,
  onEditTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [sortBy, setSortBy] = useState<'checkNumber_asc' | 'checkNumber_desc' | 'createdAt_desc' | 'createdAt_asc'>('checkNumber_asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // Deletion state
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Editing state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editClient, setEditClient] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editOperationType, setEditOperationType] = useState<Transaction['operationType']>('cheque');
  const [editCheckNumber, setEditCheckNumber] = useState('');
  const [editIssuer, setEditIssuer] = useState('');

  const handleNotifyClient = (tx: Transaction) => {
    const client = clients.find(c => c.id === tx.clientId);
    if (!client) return;

    const value = tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const message = `Olá *${client.name}*, informamos que o cheque nº *${tx.checkNumber}* (Emitente: ${tx.issuer}) no valor de *R$ ${value}* foi devolvido em nosso sistema. Favor entrar em contato para regularização. Att: *${settings.companyName || 'Financeiro'}*`;
    
    // Clean phone number (keep only digits)
    const phone = client.phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
  };

  const handleNotifySMS = (tx: Transaction) => {
    const client = clients.find(c => c.id === tx.clientId);
    if (!client) return;

    const value = tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const message = `Olá ${client.name}, informamos que o cheque nº ${tx.checkNumber} (Emitente: ${tx.issuer}) no valor de R$ ${value} foi devolvido em nosso sistema. Favor entrar em contato para regularização. Att: ${settings.companyName || 'Financeiro'}`;
    
    const phone = client.phone.replace(/\D/g, '');
    const url = `sms:+55${phone}?body=${encodeURIComponent(message)}`;
    
    window.location.href = url;
  };
  const [editGrossValue, setEditGrossValue] = useState(0);
  const [editInterestRate, setEditInterestRate] = useState(0);
  const [editIssueDate, setEditIssueDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<TransactionStatus>('active');

  const startEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditClient(tx.clientId);
    setEditBank(tx.bankId);
    setEditOperationType(tx.operationType || 'cheque');
    setEditCheckNumber(tx.checkNumber);
    setEditIssuer(tx.issuer);
    setEditGrossValue(tx.grossValue);
    setEditInterestRate(tx.interestRate);
    setEditIssueDate(tx.issueDate || tx.createdAt.split('T')[0]);
    setEditDueDate(tx.dueDate);
    setEditStatus(tx.status);
    setActiveMenuId(null);
  };

  // Live calculation of net value for editing transaction
  const computedNetValue = (() => {
    if (!editingTx) return 0;
    try {
      const issueDateObj = new Date(editIssueDate + 'T12:00:00');
      const dueDateObj = new Date(editDueDate + 'T12:00:00');
      const days = calculateDaysDiff(issueDateObj, dueDateObj);
      const interest = calculateInstallmentInterest(Number(editGrossValue), Number(editInterestRate), days);
      const net = Number(editGrossValue) - interest;
      return net > 0 ? net : 0;
    } catch {
      return Number(editGrossValue);
    }
  })();

  const filtered = transactions.filter(tx => {
    const client = clients.find(c => c.id === tx.clientId);
    const matchesSearch = 
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.checkNumber.includes(searchTerm) ||
      tx.issuer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'checkNumber_asc') {
      return a.checkNumber.localeCompare(b.checkNumber, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortBy === 'checkNumber_desc') {
      return b.checkNumber.localeCompare(a.checkNumber, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (sortBy === 'createdAt_asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    // Default: 'createdAt_desc'
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTransactions = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    link.download = "transacoes_factory.csv";
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

        <div className="flex items-center gap-2">
          <ChevronDown className="w-4 h-4 text-slate-400" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-primary"
          >
            <option value="checkNumber_asc">Nº CHEQUE (CRESCENTE)</option>
            <option value="checkNumber_desc">Nº CHEQUE (DECRESCENTE)</option>
            <option value="createdAt_desc">DATA REGISTRO (MAIS RECENTE)</option>
            <option value="createdAt_asc">DATA REGISTRO (MAIS ANTIGO)</option>
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
                paginatedTransactions.map((tx, index) => {
                  const client = clients.find(c => c.id === tx.clientId);
                  const bank = banks.find(b => b.id === tx.bankId);
                  const taxValue = tx.grossValue - tx.netValue;
                  const days = tx.issueDate && tx.dueDate 
                    ? calculateDaysDiff(new Date(tx.issueDate + 'T12:00:00'), new Date(tx.dueDate + 'T12:00:00'))
                    : (tx.createdAt && tx.dueDate ? calculateDaysDiff(new Date(tx.createdAt), new Date(tx.dueDate)) : 0);
                  
                  return (
                    <tr 
                      key={tx.id} 
                      className={`transition-colors group ${
                        index % 2 === 0 ? 'bg-white' : 'bg-zebra-table'
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs uppercase">{client?.name}</span>
                          {tx.issuer && (
                            <div className="text-[10px] text-slate-600 mt-0.5 font-bold uppercase">
                              <span className="text-slate-400 font-extrabold text-[8px] mr-1">EMIT:</span>
                              {tx.issuer}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ring-1 ring-inset ${
                              tx.operationType === 'promissoria' ? 'bg-amber-50 text-amber-600 ring-amber-500/20' :
                              tx.operationType === 'nota_fiscal' ? 'bg-blue-50 text-blue-600 ring-blue-500/20' :
                              'bg-rose-50 text-rose-600 ring-rose-500/20'
                            }`}>
                              {tx.operationType === 'promissoria' ? 'PROMISSÓRIA' :
                               tx.operationType === 'nota_fiscal' ? 'NOTA FISCAL' :
                               'CHEQUE'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 border-t border-slate-50 pt-1">
                            <Building2 className="w-3 h-3 text-slate-400" /> {bank ? bank.name : '-'} • Ref: {tx.checkNumber} • <strong className="text-slate-700">DIAS: {days}</strong>
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
                          {tx.status === 'active' ? 'ATIVO' :
                           tx.status === 'liquidated' ? 'LIQUIDADO' :
                           'DEVOLVIDO'}
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
                          <div className="absolute right-6 top-12 bg-white rounded-xl shadow-2xl border border-slate-200 w-52 py-2 z-20 animate-in fade-in zoom-in duration-150">
                            {tx.status === 'active' && (
                              <>
                                <button 
                                  onClick={() => { onUpdateStatus(tx.id, 'liquidated'); setActiveMenuId(null); }}
                                  className="w-full h-10 px-4 text-left text-sm font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" /> Liquidar Título
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
                              <>
                                {tx.status === 'returned' && (
                                  <>
                                    <button 
                                      onClick={() => { handleNotifyClient(tx); setActiveMenuId(null); }}
                                      className="w-full h-10 px-4 text-left text-sm font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                                    >
                                      <MessageCircle className="w-4 h-4" /> Notificar via WhatsApp
                                    </button>
                                    <button 
                                      onClick={() => { handleNotifySMS(tx); setActiveMenuId(null); }}
                                      className="w-full h-10 px-4 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <MessageSquare className="w-4 h-4" /> Notificar via SMS (Manual)
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => { onUpdateStatus(tx.id, 'active'); setActiveMenuId(null); }}
                                  className="w-full h-10 px-4 text-left text-sm font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                                >
                                  <ArrowUpRight className="w-4 h-4" /> Reativar Operação
                                </button>
                              </>
                            )}
                            <div className="border-t border-slate-100 my-1" />
                            <button 
                              onClick={() => startEdit(tx)}
                              className="w-full h-10 px-4 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4 text-slate-400" /> Editar Lançamento
                            </button>
                            <button 
                              onClick={() => { setDeletingTxId(tx.id); setActiveMenuId(null); }}
                              className="w-full h-10 px-4 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Excluir Lançamento
                            </button>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Mostrando <span className="font-bold text-slate-800">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}</span> a{' '}
                  <span className="font-bold text-slate-800">{Math.min(filtered.length, currentPage * itemsPerPage)}</span> de{' '}
                  <span className="font-bold text-slate-800">{filtered.length}</span> transações
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-xl gap-1" aria-label="Pagination">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Primeira Página"
                  >
                    &laquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Anterior"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages)
                    .map((page, idx, arr) => {
                      const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span className="relative inline-flex items-center px-1.5 py-1 text-xs font-semibold text-slate-400">
                              ...
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            aria-current={currentPage === page ? 'page' : undefined}
                            className={`relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                              currentPage === page
                                ? 'z-10 bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Próxima"
                  >
                    Próximo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Última Página"
                  >
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deletingTxId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center gap-3 bg-rose-50/50">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Excluir Lançamento?</h2>
                <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">Aviso de segurança</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Tem certeza que deseja excluir esta transação de cheque definitivamente? 
                Esta ação <strong>excluirá de forma permanente</strong> os registros do banco de dados e não poderá ser desfeita.
              </p>

              {(() => {
                const tx = transactions.find(t => t.id === deletingTxId);
                if (!tx) return null;
                const client = clients.find(c => c.id === tx.clientId);
                return (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                    <div className="flex justify-between"><span className="text-slate-400">Cliente:</span> <span className="font-bold text-slate-700">{client?.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Emitente:</span> <span className="font-bold text-slate-700">{tx.issuer}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Referência:</span> <span className="font-bold text-slate-700">{tx.checkNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">Valor Bruto:</span> <span className="font-black text-rose-600">R$ {tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeletingTxId(null)}
                  className="flex-1 py-3.5 px-4 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all uppercase tracking-wider text-xs"
                >
                  Não, Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (onDeleteTransaction) {
                      onDeleteTransaction(deletingTxId);
                    }
                    setDeletingTxId(null);
                  }}
                  className="flex-1 py-3.5 px-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 uppercase tracking-wider text-xs"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE TRANSAÇÃO */}
      {editingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
                  <Edit className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Editar Detalhes do Lançamento</h2>
                  <p className="text-xs text-slate-500">Modifique as informações e recalcule as taxas da operação.</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingTx(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (onEditTransaction && editingTx) {
                // Live recalculation of Net Value
                const issueDateObj = new Date(editIssueDate + 'T12:00:00');
                const dueDateObj = new Date(editDueDate + 'T12:00:00');
                const days = calculateDaysDiff(issueDateObj, dueDateObj);
                const interest = calculateInstallmentInterest(Number(editGrossValue), Number(editInterestRate), days);
                const net = Number(editGrossValue) - interest;
                const finalNet = net > 0 ? net : 0;

                const updated: Transaction = {
                  ...editingTx,
                  clientId: editClient,
                  bankId: editBank,
                  operationType: editOperationType,
                  checkNumber: editCheckNumber,
                  issuer: editIssuer,
                  grossValue: Number(editGrossValue),
                  interestRate: Number(editInterestRate),
                  netValue: finalNet,
                  issueDate: editIssueDate,
                  dueDate: editDueDate,
                  status: editStatus
                };
                
                onEditTransaction(updated);
                setEditingTx(null);
              }
            }} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* CLIENT SELECT */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente Participante</label>
                  <select 
                    required
                    value={editClient}
                    onChange={(e) => setEditClient(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* BANK SELECT */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Banco</label>
                  <select 
                    required
                    value={editBank}
                    onChange={(e) => setEditBank(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary"
                  >
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>

                {/* OPERATION TYPE SELECT */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Operação</label>
                  <select 
                    required
                    value={editOperationType}
                    onChange={(e) => setEditOperationType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary"
                  >
                    <option value="cheque">CHEQUE</option>
                    <option value="promissoria">PROMISSÓRIA</option>
                    <option value="nota_fiscal">NOTA FISCAL</option>
                  </select>
                </div>

                {/* EMITENTE */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Emitente / Beneficiário</label>
                  <input 
                    type="text" 
                    required
                    value={editIssuer}
                    onChange={(e) => setEditIssuer(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary"
                  />
                </div>

                {/* CHECK NUMBER */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nº Documento / Ref</label>
                  <input 
                    type="text" 
                    required
                    value={editCheckNumber}
                    onChange={(e) => setEditCheckNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary"
                  />
                </div>

                {/* GROSS VALUE */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Bruto (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={editGrossValue}
                    onChange={(e) => setEditGrossValue(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary"
                  />
                </div>

                {/* INTEREST RATE */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa de Juros Mensal (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    value={editInterestRate}
                    onChange={(e) => setEditInterestRate(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary"
                  />
                </div>

                {/* ISSUE DATE */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Emissão (ou Início)</label>
                  <input 
                    type="date" 
                    required
                    value={editIssueDate}
                    onChange={(e) => setEditIssueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary"
                  />
                </div>

                {/* DUE DATE */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Vencimento</label>
                  <input 
                    type="date" 
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary"
                  />
                </div>

                {/* STATUS CHANGER */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Situação do Lançamento</label>
                  <select 
                    required
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-primary"
                  >
                    <option value="active">ATIVO (EM ABERTO)</option>
                    <option value="liquidated">LIQUIDADO (PAGO)</option>
                    <option value="returned">DEVOLVIDO (ALÍNEA)</option>
                  </select>
                </div>

                {/* CALCULATED DAYS */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prazo Calculado (Dias)</label>
                  <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">
                    {(() => {
                      try {
                        const inD = new Date(editIssueDate + 'T12:00:00');
                        const outD = new Date(editDueDate + 'T12:00:00');
                        return calculateDaysDiff(inD, outD);
                      } catch {
                        return 0;
                      }
                    })()} dias
                  </div>
                </div>
              </div>

              {/* DYNAMIC CALCULATION DISPLAY */}
              <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Novo Líquido Estimado</span>
                  <p className="text-xs text-slate-500 mt-0.5">Calculado automaticamente com base na taxa e no prazo alterados.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-700">
                    R$ {computedNetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="py-3 px-6 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="py-3 px-8 bg-brand-primary text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 text-xs"
                >
                  Confirmar e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
