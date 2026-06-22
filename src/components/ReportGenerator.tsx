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
              margin: 8mm;
            }
            @media print {
              .no-print { display: none; }
              body { margin: 0; padding: 0; }
              header { margin-bottom: 10px !important; padding-bottom: 5px !important; border-bottom: 1px solid #e2e8f0 !important; }
              h1 { font-size: 16px !important; margin: 0 !important; }
              .header-info { display: flex !important; justify-content: space-between !important; align-items: baseline !important; }
              .header-info p { font-size: 9px !important; margin: 0 !important; }
              
              /* Force table to fit and avoid overlap */
              table { width: 100% !important; border-collapse: collapse !important; }
              th, td { 
                font-size: 7.5px !important; 
                padding: 4px 2px !important; 
                word-wrap: break-word !important; 
                line-height: 1.2 !important;
                vertical-align: top !important;
              }
              .overflow-x-auto { overflow: visible !important; }

              /* Define column widths for consistency */
              th:nth-child(1), td:nth-child(1) { width: 12% !important; } /* Data */
              th:nth-child(2), td:nth-child(2) { width: 35% !important; } /* Operação */
              th:nth-child(3), td:nth-child(3) { width: 23% !important; } /* Banco */
              th:nth-child(4), td:nth-child(4) { width: 10% !important; } /* Bruto */
              th:nth-child(5), td:nth-child(5) { width: 10% !important; } /* Líquido */
              th:nth-child(6), td:nth-child(6) { width: 10% !important; } /* Status */
              
              /* Compact summary cards for print */
              .summary-grid { 
                display: grid !important; 
                grid-template-columns: 1fr 1fr !important;
                gap: 8px !important; 
                margin-bottom: 10px !important;
              }
              .summary-group {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 5px !important;
              }
              .summary-card { 
                padding: 6px !important; 
                border: 1px solid #e2e8f0 !important;
                background-color: #f8fafc !important;
              }
              .summary-card span { font-size: 7px !important; line-height: 1 !important; color: #64748b !important; }
              .summary-card p { font-size: 11px !important; margin-top: 2px !important; font-weight: 800 !important; }
              
              /* Hide icons and unnecessary elements in print */
              svg, .rounded-lg, .print\:hidden { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="p-2">
            <header class="header-info pb-2 mb-2 border-b">
              <h1 class="font-bold">S.E.G - GESTÃO FINANCEIRA</h1>
              <p class="text-slate-500 uppercase tracking-tighter font-semibold">Relatório • Gerado em ${new Date().toLocaleString('pt-BR')}</p>
            </header>
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
    <div className="space-y-4 md:space-y-8" id="report-content-to-print">
      <header className="flex items-center justify-between print:mb-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 print:text-base">
            {view === 'report-client' ? 'Relatório por Cliente' : 
             view === 'report-type' ? 'Relatório por Tipo' :
             view === 'report-period' ? 'Relatório por Período' : 
             view === 'report-date' ? 'Relatório por Data' :
             view === 'report-returned' ? 'Relatório de Cheques Devolvidos' :
             'Relatório de Títulos em Aberto'}
          </h1>
          <p className="text-slate-500 text-xs md:text-sm print:hidden">Gere análises detalhadas das movimentações financeiras.</p>
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
          {/* Summary Cards - Grouped in Pairs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2 summary-grid">
            {/* Group 1: Bruto and Líquido */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 summary-group">
              <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm print:rounded-none summary-card">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 print:hidden">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bruto Total</span>
                </div>
                <p className="text-base md:text-xl font-bold text-slate-800">
                  R$ {totals.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm print:rounded-none summary-card">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-2 rounded-lg bg-emerald-50 print:hidden">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Líquido Pago</span>
                </div>
                <p className="text-base md:text-xl font-bold text-emerald-600">
                  R$ {totals.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Group 2: Receita and Operações */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 summary-group">
              <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm print:rounded-none summary-card">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-2 rounded-lg bg-amber-50 print:hidden">
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Receita</span>
                </div>
                <p className="text-base md:text-xl font-bold text-amber-600">
                  R$ {totals.tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm print:rounded-none summary-card">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-2 rounded-lg bg-slate-50 print:hidden">
                    <FileText className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operações</span>
                </div>
                <p className="text-base md:text-xl font-bold text-slate-800">
                  {totals.count}
                </p>
              </div>
            </div>
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
                      className={`transition-colors border-b border-slate-50 print:border-slate-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-zebra-table'
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-[11px] uppercase truncate max-w-[200px] print:max-w-none print:whitespace-normal">
                          {clients.find(c => c.id === tx.clientId)?.name}
                        </div>
                        {tx.issuer && (
                          <div className="text-[10px] text-slate-600 mt-0.5 font-bold uppercase overflow-visible print:text-[8px]">
                            <span className="text-slate-400 font-extrabold text-[8px] mr-1 print:text-[7px]">EMIT:</span>
                            {tx.issuer}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ring-1 ring-inset ${
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
                      <td className="px-6 py-4">
                        {tx.bankId ? (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 uppercase font-bold print:text-[8px] print:leading-tight">
                            <Building2 className="w-3 h-3 print:hidden" /> {banks.find(b => b.id === tx.bankId)?.name || 'Banco Excluído'}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-bold print:text-[8px]">-</div>
                        )}
                        <div className="font-mono text-xs text-slate-600 mt-1 print:text-[9px]">{tx.checkNumber}</div>
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
