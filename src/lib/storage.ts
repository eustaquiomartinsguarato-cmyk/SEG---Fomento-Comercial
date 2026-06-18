/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Bank, Transaction, SystemSettings } from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'factori_clients',
  BANKS: 'factori_banks',
  TRANSACTIONS: 'factori_transactions',
  SETTINGS: 'factori_settings',
};

const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'S.E.G',
  defaultInterestRate: 3.5,
};

const SEED_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'João Silva Oliveira',
    document: '123.456.789-00',
    email: 'joao@email.com',
    phone: '(11) 98888-7777',
    address: 'Av. Paulista, 1000 - SP',
    creditLimit: 50000,
    status: 'active',
    observations: 'Cliente preferencial',
    createdAt: '2024-01-01T12:00:00Z',
  },
  {
    id: 'c2',
    name: 'Tech Solutions LTDA',
    document: '12.345.678/0001-99',
    email: 'contato@techsol.com',
    phone: '(11) 3333-4444',
    address: 'Rua das Inovações, 50 - SC',
    creditLimit: 150000,
    status: 'active',
    observations: 'Empresa de médio porte',
    createdAt: '2024-01-01T12:00:00Z',
  }
];

const SEED_BANKS: Bank[] = [
  { id: 'b1', name: 'Banco do Brasil', code: '001', agency: '1234', observations: '', createdAt: '2024-01-01T12:00:00Z' },
  { id: 'b2', name: 'Itaú Unibanco', code: '341', agency: '5678', observations: '', createdAt: '2024-01-01T12:00:00Z' }
];

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const storage = {
  getClients: (): Client[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(SEED_CLIENTS));
      return SEED_CLIENTS;
    }
    return JSON.parse(data);
  },
  saveClients: (clients: Client[]) => localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients)),

  getBanks: (): Bank[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BANKS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(SEED_BANKS));
      return SEED_BANKS;
    }
    return JSON.parse(data);
  },
  saveBanks: (banks: Bank[]) => localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(banks)),

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  saveTransactions: (txs: Transaction[]) => localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs)),

  getSettings: (): SystemSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: SystemSettings) => localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)),
};
