/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CreditCard, 
  History, 
  RotateCcw, 
  BarChart3, 
  Calendar, 
  CalendarDays, 
  Settings,
  ChevronRight,
  LogOut,
  Bell
} from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  authRole: string;
  authName: string;
  onLogout: () => void;
  returnedCount: number;
  notificationsCount: number;
  onClearNotifications: () => void;
  showLoader: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  authRole, 
  authName, 
  onLogout, 
  returnedCount,
  notificationsCount,
  onClearNotifications,
  showLoader
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'banks', label: 'Bancos', icon: Building2 },
    { type: 'divider', label: 'Operações' },
    { id: 'discount', label: 'Desconto', icon: CreditCard },
    { id: 'history', label: 'Histórico de Transações', icon: History },
    ...(authRole === 'admin' ? [{ id: 'returned', label: 'Cheques Devolvidos a Receber', icon: RotateCcw }] : []),
    { type: 'divider', label: 'Relatórios' },
    { id: 'report-client', label: 'Por Cliente', icon: BarChart3 },
    { id: 'report-type', label: 'Por Tipo', icon: CreditCard },
    { id: 'report-returned', label: 'Cheques Devolvidos', icon: RotateCcw },
    { id: 'report-open', label: 'Títulos em Aberto', icon: History },
    { id: 'report-period', label: 'Por Período', icon: Calendar },
    { id: 'report-date', label: 'Por Data', icon: CalendarDays },
    { type: 'divider', label: 'Sistema' },
    ...(authRole === 'admin' ? [{ id: 'users', label: 'Gestão de Usuários', icon: Users }] : []),
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-brand-dark text-white flex flex-col shadow-xl z-50 print:hidden">
      <div className="p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-xl shadow-lg">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">S.E.G</span>
        </div>
        
        {notificationsCount > 0 && (
          <button 
            onClick={onClearNotifications}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all group"
            title="Limpar Notificações"
          >
            <Bell className="w-5 h-5 group-hover:animate-shake" />
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[8px] font-black text-white flex items-center justify-center">
                {notificationsCount}
              </span>
            </span>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <li key={`divider-${index}`} className="px-3 pt-4 pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {item.label}
                  </span>
                </li>
              );
            }

            const Icon = item.icon!;
            const isActive = activeView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    showLoader();
                    onViewChange(item.id as View);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-brand-primary text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-brand-primary transition-colors'}`} />
                  <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                  {item.id === 'returned' && returnedCount > 0 && (
                    <div className="relative flex items-center justify-center mr-1">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex items-center justify-center h-5 w-5 rounded-full bg-rose-600 text-[10px] font-black text-white">
                        {returnedCount}
                      </span>
                    </div>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold ring-2 ring-brand-primary/20">
            {authName?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-slate-200">{authName}</p>
            <p className="text-[10px] text-brand-primary/70 font-bold uppercase tracking-wider">{authRole}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-white hover:bg-rose-500/10 transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:text-rose-400" />
          <span className="text-xs font-bold uppercase tracking-widest">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
};
