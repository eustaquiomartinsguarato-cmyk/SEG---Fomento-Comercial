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
    <div className="border-2 border-slate-300 p-8 mb-8 bg-white print:border-slate-800 print:mb-12">
      <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 mb-6 print:border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{settings.companyName}</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Comprovante de Operação de Factoring</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{copyLabel}</p>
          <p className="text-sm font-bold text-slate-700">{new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <User className="w-3 h-3" /> Tomador / Cliente
            </p>
            <p className="text-lg font-bold text-slate-800">{client.name}</p>
            <p className="text-xs text-slate-600">{client.document}</p>
          </div>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo Financeiro</p>
          <div className="space-y-1">
            <div className="flex justify-end gap-4 text-sm">
              <span className="text-slate-500">Valor Bruto:</span>
              <span className="font-bold">R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-end gap-4 text-sm">
              <span className="text-slate-500">Desconto/Taxas:</span>
              <span className="font-bold text-rose-600">- R$ {totalTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-end gap-4 text-lg border-t pt-1 border-slate-100 mt-1 print:border-slate-800">
              <span className="font-black text-slate-400 text-xs">LÍQUIDO:</span>
              <span className="font-black text-emerald-600">R$ {totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lançamentos / Cheques</p>
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-100 print:bg-slate-100 print:border-slate-800">
              <th className="px-3 py-2 font-black uppercase text-[9px]">Parcela</th>
              <th className="px-3 py-2 font-black uppercase text-[9px]">Emitente</th>
              <th className="px-3 py-2 font-black uppercase text-[9px]">Banco</th>
              <th className="px-3 py-2 font-black uppercase text-[9px]">Cheque Nº</th>
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
                  <td className="px-3 py-2 font-semibold text-indigo-700">{tx.issuer}</td>
                  <td className="px-3 py-2">{bank?.name} ({bank?.code})</td>
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

      <div className="grid grid-cols-2 gap-12 mt-16 pb-4">
        <div className="text-center pt-4 border-t border-slate-300 print:border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase">{settings.companyName}</p>
          <p className="text-[8px] text-slate-400">Assinatura autorizada</p>
        </div>
        <div className="text-center pt-4 border-t border-slate-300 print:border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase">{client.name}</p>
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
