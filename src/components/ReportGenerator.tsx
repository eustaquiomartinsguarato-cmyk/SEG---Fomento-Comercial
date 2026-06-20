/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Search, 
  Printer, 
  Download, 
  Building2, 
  TrendingUp, 
  FileText,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { Client, Bank, Transaction, View, OperationType } from '../types';

interface ReportGeneratorProps {
  view: View;
  transactions: Transaction[];
  clients: Client[];
  banks: Bank[];
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ view, transactions, clients, banks }) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<OperationType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredTransactions = useMemo(() => {
    switch (view) {
      case 'report-client':
        return transactions.filter(tx => tx.clientId === selectedClientId);
      case 'report-type':
        return transactions.filter(tx => (tx.operationType || 'cheque') === selectedReportType);
      case 'report-period':
        if (!startDate || !endDate) return [];
        return transactions.filter(tx => {
          const date = tx.createdAt.split('T')[0];
          return date >= startDate && date <= endDate;
        });
      case 'report-date':
        return transactions.filter(tx => tx.createdAt.split('T')[0] === specificDate);
      case 'report-returned':
        return transactions.filter(tx => tx.status === 'returned');
      case 'report-open':
        return transactions.filter(tx => tx.status === 'active');
      default:
        return [];
    }
  }, [view, transactions, selectedClientId, selectedReportType, startDate, endDate, specificDate]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => ({
      gross: acc.gross + tx.grossValue,
      net: acc.net + tx.netValue,
      tax: acc.tax + (tx.grossValue - tx.netValue),
      count: acc.count + 1
    }), { gross: 0, net: 0, tax: 0, count: 0 });
  }, [filteredTransactions]);

  const handleExport = () => {
    const headers = ['ID', 'Data', 'Cliente', 'Emitente', 'Banco', 'Cheque', 'Vencimento', 'Status', 'Bruto', 'Líquido'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      new Date(tx.createdAt).toLocaleDateString('pt-BR'),
      clients.find(c => c.id === tx.clientId)?.name || 'N/A',
      tx.issuer,
      banks.find(b => b.id === tx.bankId)?.name || 'N/A',
      tx.checkNumber,
      tx.dueDate,
      tx.status,
      tx.grossValue.toFixed(2),
      tx.netValue.toFixed(2)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_factori_${view}.csv`;
    link.click();
  };

  const renderFilter = () => {
    switch (view) {
      case 'report-client':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Selecionar Cliente</label>
            <select 
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full md:w-80 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.code ? `[CÓD: ${c.code}]` : ''}</option>)}
            </select>
          </div>
        );
      case 'report-type':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Selecionar Tipo</label>
            <select 
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value as OperationType)}
              className="w-full md:w-80 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary font-bold"
            >
              <option value="">Selecione um tipo...</option>
              <option value="cheque">CHEQUES</option>
              <option value="promissoria">PROMISSÓRIAS</option>
              <option value="nota_fiscal">NOTAS FISCAIS</option>
            </select>
          </div>
        );
      case 'report-period':
        return (
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Data Inicial</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Data Final</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
          </div>
        );
      case 'report-date':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Selecionar Data</label>
            <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary" />
          </div>
        );
      case 'report-returned':
        return (
          <div className="p-2 py-4 text-slate-600 italic text-sm">
            Listando todos os títulos com status <span className="font-bold text-rose-600 underline">DEVOLVIDO</span> que aguardam liquidação.
          </div>
        );
      case 'report-open':
        return (
          <div className="p-2 py-4 text-slate-600 italic text-sm">
            Listando todos os títulos com status <span className="font-bold text-indigo-600 underline">ATIVO</span> (em aberto na carteira).
          </div>
        );
      default:
        return null;
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-content-to-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir.');
      return;
    }

    const html = `
      <html>
        <head>
          <title>S.E.G - Relatório</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4;
              margin: 10mm;
            }
            @media print {
              .no-print { display: none; }
              body { margin: 0; padding: 0; }
              /* Force table to fit */
              table { width: 100% !important; table-layout: fixed !important; }
              th, td { font-size: 8px !important; padding: 4px 2px !important; word-wrap: break-word !important; }
              .overflow-x-auto { overflow: visible !important; }
              /* Adjust summary cards for print */
              .grid-cols-4 { display: flex !important; flex-wrap: wrap !important; gap: 8px !important; }
              .grid-cols-4 > div { flex: 1 1 22% !important; border: 1px solid #e2e8f0 !important; padding: 8px !important; }
              .grid-cols-4 > div span { font-size: 8px !important; }
              .grid-cols-4 > div p { font-size: 14px !important; }
              /* Hide icons in print for space */
              .grid-cols-4 svg { display: none !important; }
              /* Header adjustments */
              h1 { font-size: 18px !important; }
              p { font-size: 10px !important; }
            }
          </style>
        </head>
        <body>
          <div class="p-4">
            <h1 class="text-2xl font-bold mb-1">S.E.G</h1>
            <p class="text-xs text-slate-500 mb-6">Relatório de Operações Financeiras • Gerado em ${new Date().toLocaleString('pt-BR')}</p>
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 800);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8" id="report-content-to-print">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {view === 'report-client' ? 'Relatório por Cliente' : 
             view === 'report-type' ? 'Relatório por Tipo' :
             view === 'report-period' ? 'Relatório por Período' : 
             view === 'report-date' ? 'Relatório por Data' :
             view === 'report-returned' ? 'Relatório de Cheques Devolvidos' :
             'Relatório de Títulos em Aberto'}
          </h1>
          <p className="text-slate-500 text-sm">Gere análises detalhadas das movimentações financeiras.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={handlePrint} 
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-5 h-5 text-slate-600" />
          </button>
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 print:hidden">
        {renderFilter()}
      </div>

      {filteredTransactions.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Bruto Total', value: totals.gross, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Líquido Pago', value: totals.net, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Receita (Taxas)', value: totals.tax, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Operações', value: totals.count, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-xl font-bold text-slate-800">
                  {typeof stat.value === 'number' && stat.label !== 'Operações' 
                    ? `R$ ${stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                    : stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Operação (Cliente / Emitente)</th>
                    <th className="px-6 py-4">Banco / Cheque</th>
                    <th className="px-6 py-4 text-right">Bruto (R$)</th>
                    <th className="px-6 py-4 text-right">Líquido (R$)</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {filteredTransactions.map((tx, index) => (
                    <tr 
                      key={tx.id} 
                      className={`transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-zebra-table'
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">
                          {clients.find(c => c.id === tx.clientId)?.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ring-1 ring-inset ${
                            tx.operationType === 'promissoria' ? 'bg-amber-50 text-amber-600 ring-amber-500/20' :
                            tx.operationType === 'nota_fiscal' ? 'bg-blue-50 text-blue-600 ring-blue-500/20' :
                            'bg-indigo-50 text-indigo-600 ring-indigo-500/20'
                          }`}>
                            {tx.operationType === 'promissoria' ? 'PROMISSÓRIA' :
                             tx.operationType === 'nota_fiscal' ? 'NOTA FISCAL' :
                             'CHEQUE'}
                          </span>
                          <span className="text-xs text-indigo-600 font-medium truncate">
                            Emitente: {tx.issuer}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tx.bankId ? (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 uppercase font-bold">
                            <Building2 className="w-3 h-3" /> {banks.find(b => b.id === tx.bankId)?.name || 'Banco Excluído'}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-bold">-</div>
                        )}
                        <div className="font-mono text-xs text-slate-600">{tx.checkNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        {tx.netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {filteredTransactions.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-24 text-center">
          <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Nenhum dado encontrado</h3>
          <p className="text-slate-500 text-sm">Selecione os filtros acima para gerar o relatório.</p>
        </div>
      )}
    </div>
  );
};
