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
import { Client, Bank, Transaction, View } from '../types';

interface ReportGeneratorProps {
  view: View;
  transactions: Transaction[];
  clients: Client[];
  banks: Bank[];
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ view, transactions, clients, banks }) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredTransactions = useMemo(() => {
    switch (view) {
      case 'report-client':
        return transactions.filter(tx => tx.clientId === selectedClientId);
      case 'report-period':
        if (!startDate || !endDate) return [];
        return transactions.filter(tx => {
          const date = tx.createdAt.split('T')[0];
          return date >= startDate && date <= endDate;
        });
      case 'report-date':
        return transactions.filter(tx => tx.createdAt.split('T')[0] === specificDate);
      default:
        return [];
    }
  }, [view, transactions, selectedClientId, startDate, endDate, specificDate]);

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
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            @media print {
              .no-print { display: none; }
              body { background: white; padding: 20px; }
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="p-8">
            <h1 class="text-2xl font-bold mb-2">S.E.G</h1>
            <p class="text-sm text-slate-500 mb-8">Relatório de Operações</p>
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
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
            {view === 'report-client' ? 'Relatório por Cliente' : view === 'report-period' ? 'Relatório por Período' : 'Relatório por Data'}
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
                        <div className="text-xs text-indigo-600 font-medium">
                          Emitente: {tx.issuer}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 uppercase font-bold">
                          <Building2 className="w-3 h-3" /> {banks.find(b => b.id === tx.bankId)?.name}
                        </div>
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
