/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Receipt } from './Receipt';
import { 
  Calculator, 
  CheckCircle2, 
  Calendar,
  DollarSign,
  Percent,
  Banknote,
  CreditCard,
  Search,
  User,
  Building,
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Client, Bank, Transaction, SystemSettings, OperationType } from '../types';
import { generateId } from '../lib/storage';
import { getAdjustedDueDate, calculateDaysDiff, calculateInstallmentInterest } from '../lib/calculations';

interface CheckoutFormProps {
  clients: Client[];
  banks: Bank[];
  settings: SystemSettings;
  onConfirm: (txs: Transaction[]) => void;
}

export const DiscountForm: React.FC<CheckoutFormProps> = ({ clients, banks, settings, onConfirm }) => {
  const [clientId, setClientId] = useState('');
  const [bankId, setBankId] = useState('');
  const [operationType, setOperationType] = useState<OperationType>('cheque');
  const [value, setValue] = useState(0);
  const [valueInput, setValueInput] = useState('');
  const [isTotalValue, setIsTotalValue] = useState(false); // Default to entry per check
  const [tax, setTax] = useState(settings.defaultInterestRate);
  const [taxInput, setTaxInput] = useState(settings.defaultInterestRate.toString());
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [daysInterval, setDaysInterval] = useState(30);
  const [dueDate, setDueDate] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [issuer, setIssuer] = useState('');
  
  const [simulation, setSimulation] = useState<{ netValue: number; installmentValue: number; totalInterest: number }>({ netValue: 0, installmentValue: 0, totalInterest: 0 });
  const [confirmedTxs, setConfirmedTxs] = useState<Transaction[] | null>(null);

  // Sync settings when they are asynchronously loaded
  useEffect(() => {
    setTax(settings.defaultInterestRate);
    setTaxInput(settings.defaultInterestRate.toString());
  }, [settings.defaultInterestRate]);

  const currentTotalGross = isTotalValue ? value : value * installmentsCount;
  const currentInstGross = currentTotalGross / installmentsCount;

  useEffect(() => {
    if (!value || !dueDate) {
      setSimulation({ netValue: 0, installmentValue: 0, totalInterest: 0 });
      return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const totalGross = currentTotalGross;
    const instGross = currentInstGross;
    let totalInterest = 0;
    
    for (let i = 0; i < installmentsCount; i++) {
      const targetDate = new Date(dueDate + 'T12:00:00');
      targetDate.setDate(targetDate.getDate() + (i * daysInterval));
      
      const adjustedDate = getAdjustedDueDate(targetDate.toISOString().split('T')[0]);
      const days = calculateDaysDiff(today, adjustedDate);
      const interest = calculateInstallmentInterest(instGross, tax, days);
      totalInterest += interest;
    }

    const net = totalGross - totalInterest;
    setSimulation({
      netValue: net > 0 ? net : 0,
      installmentValue: instGross,
      totalInterest: totalInterest
    });
  }, [value, isTotalValue, tax, installmentsCount, dueDate, daysInterval]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isBankRequired = operationType === 'cheque';
    if (!clientId || (isBankRequired && !bankId) || !value || !dueDate) return;

    const today = new Date();
    today.setHours(0,0,0,0);
    const totalGross = currentTotalGross;
    const transactionList: Transaction[] = [];
    const baseCheckNum = parseInt(checkNumber) || 0;
    const instGross = currentInstGross;

    for (let i = 0; i < installmentsCount; i++) {
        const targetDate = new Date(dueDate + 'T12:00:00');
        targetDate.setDate(targetDate.getDate() + (i * daysInterval));
        
        const adjustedDate = getAdjustedDueDate(targetDate.toISOString().split('T')[0]);
        const days = calculateDaysDiff(today, adjustedDate);
        const interest = calculateInstallmentInterest(instGross, tax, days);
        const net = instGross - interest;

        const txCheckNumber = checkNumber 
          ? (baseCheckNum + i).toString().padStart(checkNumber.length, '0') 
          : '';

        const transaction: Transaction = {
          id: generateId(),
          clientId,
          bankId,
          operationType,
          checkNumber: txCheckNumber,
          issuer: issuer || 'Terceiro',
          grossValue: instGross,
          interestRate: tax,
          netValue: net,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: adjustedDate.toISOString().split('T')[0],
          installments: 1,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        transactionList.push(transaction);
      }

    setConfirmedTxs(transactionList);
  };

  const handleFinish = () => {
    if (confirmedTxs) {
      onConfirm(confirmedTxs);
      setConfirmedTxs(null);
      // Reset form
      setClientId('');
      setBankId('');
      setOperationType('cheque');
      setValue(0);
      setValueInput('');
      setTax(settings.defaultInterestRate);
      setTaxInput(settings.defaultInterestRate.toString());
      setInstallmentsCount(1);
      setDaysInterval(30);
      setDueDate('');
      setCheckNumber('');
      setIssuer('');
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;

    // Use window.open to bypass iframe print limits, fallback if popup blocker is active
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    // Get styles from active stylesheets to match Tailwind classes accurately in the popup
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
          <title>${settings.companyName} - Comprovante de Operação</title>
          <style>
            ${styles}
            @media print {
              body { background: white !important; margin: 0; padding: 12px; }
              .no-print { display: none !important; }
            }
            body {
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              padding: 24px;
              background-color: #f8fafc;
            }
          </style>
        </head>
        <body>
          <div class="max-w-4xl mx-auto">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (confirmedTxs) {
    const activeClient = clients.find(c => c.id === clientId);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <button 
            onClick={() => setConfirmedTxs(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors py-2"
          >
            <ChevronLeft className="w-5 h-5" /> Voltar para Edição
          </button>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all"
            >
              <Printer className="w-5 h-5" /> Imprimir Vias
            </button>
            <button 
              onClick={handleFinish}
              className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              Concluir e Salvar
            </button>
          </div>
        </div>

        <div className="bg-slate-100 p-8 rounded-3xl min-h-screen print:bg-white print:p-0" id="receipt-content">
          <Receipt 
            transactions={confirmedTxs} 
            client={activeClient!} 
            banks={banks} 
            settings={settings} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Desconto</h1>
        <p className="text-slate-500 text-sm">Realize simulações e confirme novas operações financeiras.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand-primary mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-800">Dados da Operação</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3 h-3" /> Selecionar Cliente
              </label>
              <div className="relative">
                <select 
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none outline-none focus:border-brand-primary transition-all"
                >
                  <option value="">Selecione o cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id} disabled={c.status === 'blocked'}>
                      {c.name} {c.code ? `[CÓD: ${c.code}]` : ''} {c.status === 'blocked' ? '(BLOQUEADO)' : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-3 h-3" /> Selecionar Banco {operationType !== 'cheque' && <span className="text-[10px] lowercase text-slate-400 font-normal">(opcional)</span>}
              </label>
              <select 
                required={operationType === 'cheque'}
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary"
              >
                <option value="">Selecione o banco...</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-3 h-3" /> Tipo de Operação
              </label>
              <select 
                required
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as OperationType)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-primary"
              >
                <option value="cheque">CHEQUES</option>
                <option value="promissoria">PROMISSÓRIAS</option>
                <option value="nota_fiscal">NOTAS FISCAIS</option>
              </select>
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-3 h-3" /> Emitente / Beneficiário (Proprietário do Título)
              </label>
              <input 
                required
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary"
                placeholder="Ex: Mercado Silva LTDA ou Nome da Pessoa"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Banknote className="w-3 h-3" /> Nº do Documento Inicial
              </label>
              <input 
                required
                type="text"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary"
                placeholder="Ex: 000100"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Banknote className="w-3 h-3" /> Tipo de Entrada de Valor
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsTotalValue(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isTotalValue ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500'}`}
                >
                  Valor Unitário
                </button>
                <button
                  type="button"
                  onClick={() => setIsTotalValue(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isTotalValue ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500'}`}
                >
                  Valor Total Operação
                </button>
              </div>
            </div>

             <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> {isTotalValue ? 'Valor Total (R$)' : 'Valor de Cada Título (R$)'}
              </label>
              <input 
                required
                type="text"
                inputMode="decimal"
                value={valueInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
                    setValueInput(val);
                    const parsed = parseFloat(val.replace(',', '.'));
                    setValue(isNaN(parsed) ? 0 : parsed);
                  }
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary font-bold text-slate-800"
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-3 h-3" /> Taxa Mensal (%)
              </label>
              <input 
                required
                type="text"
                inputMode="decimal"
                value={taxInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
                    setTaxInput(val);
                    const parsed = parseFloat(val.replace(',', '.'));
                    setTax(isNaN(parsed) ? 0 : parsed);
                  }
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary font-bold text-slate-800"
                placeholder="0,0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Qtde de Parcelas
              </label>
              <select 
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary font-bold"
              >
                {[...Array(36)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}x iguais</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Intervalo (Dias)
              </label>
              <input 
                type="number"
                value={daysInterval}
                onChange={(e) => setDaysInterval(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary"
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Vencimento 1ª Parc.
              </label>
              <input 
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary font-bold"
              />
            </div>

            <div className="col-span-full pt-4">
              <button 
                type="submit"
                className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-5 h-5" />
                Gerar e Confirmar Lançamentos
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl shadow-xl p-8 text-white space-y-8 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-primary/20 rounded-full blur-3xl" />
            
            <div className="space-y-1">
              <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em]">Resumo do Desconto</p>
              <h3 className="text-2xl font-bold">Simulação Automática</h3>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Valor Bruto Total</p>
                <p className="text-xl font-bold">R$ {currentTotalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Taxa Total (Calculada)</p>
                <p className="text-xl font-bold text-rose-400">
                  R$ {simulation.totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="py-6 border-y border-white/10 space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-widest">Líquido a Receber</p>
                  <p className="text-4xl font-black text-emerald-400">
                    R$ {simulation.netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Valor da Parcela</p>
                  <p className="text-lg font-bold">R$ {simulation.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lançamentos Sequenciais ({installmentsCount})</p>
              <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {[...Array(installmentsCount)].map((_, i) => {
                  const targetDate = new Date((dueDate || new Date().toISOString().split('T')[0]) + 'T12:00:00');
                  targetDate.setDate(targetDate.getDate() + (i * daysInterval));
                  const adjDate = getAdjustedDueDate(targetDate.toISOString().split('T')[0]);
                  
                  const baseCheckNum = parseInt(checkNumber) || 0;
                  const txCheckNumber = checkNumber 
                    ? (baseCheckNum + i).toString().padStart(checkNumber.length, '0') 
                    : '---';

                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const days = calculateDaysDiff(today, adjDate);
                  const instGross = currentInstGross;
                  const interest = calculateInstallmentInterest(instGross, tax, days);
                  const effectiveRate = (tax / 30) * days;

                  return (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-xs">Venc: {adjDate.toLocaleDateString('pt-BR')} ({days} dias)</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Ref: {txCheckNumber} • {effectiveRate.toFixed(2)}% total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {instGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[9px] text-rose-400 uppercase font-bold">R$ {interest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Juros)</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            <div className="text-xs text-emerald-800 leading-relaxed">
              <p className="font-bold mb-1 uppercase tracking-wider">Geração Automática Ativada</p>
              Ao confirmar, o sistema criará <strong>{installmentsCount}</strong> lançamentos com números de cheques sequenciais e datas espaçadas por <strong>{daysInterval} dias</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
