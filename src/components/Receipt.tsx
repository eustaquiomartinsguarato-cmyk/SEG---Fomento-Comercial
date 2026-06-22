/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Client, Bank, Transaction, SystemSettings } from '../types';
import { Building2, User, Landmark, Calendar, Banknote } from 'lucide-react';

interface ReceiptProps {
  transactions: Transaction[];
  client: Client;
  banks: Bank[];
  settings: SystemSettings;
}

export const Receipt: React.FC<ReceiptProps> = ({ transactions, client, banks, settings }) => {
  const totalGross = transactions.reduce((sum, tx) => sum + tx.grossValue, 0);
  const totalNet = transactions.reduce((sum, tx) => sum + tx.netValue, 0);
  const totalTax = totalGross - totalNet;

  const ReceiptContent = ({ copyLabel }: { copyLabel: string }) => (
    <div className="border border-slate-200 p-4 md:p-8 mb-4 md:mb-8 bg-white print:border-slate-800 print:p-4 print:mb-6">
      <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4 print:border-slate-800 print:pb-2 print:mb-3">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter print:text-lg">{settings.companyName}</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 print:text-[8px]">Comprovante de Operação de Factoring</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{copyLabel}</p>
          <p className="text-xs font-bold text-slate-700 print:text-[10px]">{new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8 print:mb-4 print:gap-4">
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <User className="w-3 h-3" /> Tomador / Cliente
            </p>
            <p className="text-base md:text-lg font-bold text-slate-800 print:text-sm">{client.name}</p>
            <p className="text-xs text-slate-600 print:text-[10px]">{client.document}</p>
          </div>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resumo Financeiro</p>
          <div className="space-y-0.5">
            <div className="flex justify-end gap-2 md:gap-4 text-xs">
              <span className="text-slate-500">Valor Bruto:</span>
              <span className="font-bold whitespace-nowrap">R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-end gap-2 md:gap-4 text-xs">
              <span className="text-slate-500 text-[10px]">Taxas:</span>
              <span className="font-bold text-rose-600 whitespace-nowrap">- R$ {totalTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-end gap-2 md:gap-4 text-base border-t pt-0.5 border-slate-100 mt-0.5 print:border-slate-800 print:text-sm">
              <span className="font-black text-slate-400 text-[9px] flex items-center">LÍQUIDO:</span>
              <span className="font-black text-emerald-600 whitespace-nowrap">R$ {totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 md:mb-8 print:mb-3">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Lançamentos / Detalhamento</p>
        <table className="w-full text-[10px] md:text-xs text-left border-collapse print:text-[9px]">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-100 print:bg-slate-100 print:border-slate-800">
              <th className="px-3 py-2 font-black uppercase text-[9px]">Parcela</th>
              <th className="px-3 py-2 font-black uppercase text-[9px]">Tipo</th>
              <th className="px-3 py-2 font-black uppercase text-[9px]">Emitente</th>
              <th className="px-3 py-2 font-black uppercase text-[9px]">Banco</th>
              <th className="px-3 py-2 font-black uppercase text-[9px]">Referência</th>
              <th className="px-3 py-2 font-black uppercase text-[9px]">Vencimento</th>
              <th className="px-3 py-2 font-black uppercase text-[9px] text-right">Valor (R$)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-slate-800">
            {transactions.map((tx, i) => {
              const bank = banks.find(b => b.id === tx.bankId);
              return (
                <tr key={tx.id}>
                  <td className="px-3 py-2 font-bold">{i + 1} / {transactions.length}</td>
                  <td className="px-3 py-2 uppercase font-medium text-[9px]">
                    {tx.operationType === 'promissoria' ? 'Promissória' :
                     tx.operationType === 'nota_fiscal' ? 'N. Fiscal' :
                     'Cheque'}
                  </td>
                  <td className="px-3 py-2 font-semibold text-indigo-700">{tx.issuer}</td>
                  <td className="px-3 py-2">{bank ? `${bank.name} (${bank.code})` : '-'}</td>
                  <td className="px-3 py-2 font-mono text-slate-600">{tx.checkNumber}</td>
                  <td className="px-3 py-2">{new Date(tx.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="px-3 py-2 text-right font-bold">
                    {tx.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-12 mt-8 md:mt-16 pb-4 print:mt-8 print:gap-8">
        <div className="text-center pt-2 border-t border-slate-300 print:border-slate-800">
          <p className="text-[9px] font-bold text-slate-500 uppercase">{settings.companyName}</p>
          <p className="text-[8px] text-slate-400">Assinatura autorizada</p>
        </div>
        <div className="text-center pt-2 border-t border-slate-300 print:border-slate-800">
          <p className="text-[9px] font-bold text-slate-500 uppercase">{client.name}</p>
          <p className="text-[8px] text-slate-400">Assinatura do tomador</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="receipt-container p-4 max-w-4xl mx-auto">
      <div className="print:break-after-page print:mb-0" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
        <ReceiptContent copyLabel="Via do Cliente" />
      </div>
      <div className="border-t-2 border-dashed border-slate-400 my-8 print:hidden opacity-50" />
      <div>
        <ReceiptContent copyLabel="Via da Empresa / Arquivo" />
      </div>
    </div>
  );
};
