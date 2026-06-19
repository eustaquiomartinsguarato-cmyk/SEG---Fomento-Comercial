/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClientStatus = 'active' | 'blocked';
export type TransactionStatus = 'active' | 'returned' | 'liquidated';

export interface Client {
  id: string;
  code?: string;
  name: string;
  document: string; // CPF or CNPJ
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  status: ClientStatus;
  observations: string;
  createdAt: string;
}

export interface Bank {
  id: string;
  name: string;
  code: string; // BACEN/COMPE
  agency: string;
  observations: string;
  createdAt?: string;
}

export interface Installment {
  id: string;
  dueDate: string;
  value: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Transaction {
  id: string;
  clientId: string;
  bankId: string;
  checkNumber: string;
  grossValue: number;
  interestRate: number;
  netValue: number;
  issueDate: string;
  dueDate: string;
  issuer: string;
  installments: number;
  status: TransactionStatus;
  returnReason?: string;
  returnedAt?: string;
  returnedInterestRate?: number;
  returnedFine?: number;
  resolvedAt?: string;
  resolvedAmount?: number;
  createdAt: string;
}

export interface SystemSettings {
  companyName: string;
  defaultInterestRate: number;
  logoUrl?: string;
  defaultReturnedInterestRate?: number;
  defaultReturnedFine?: number;
}

export interface AppUser {
  id: string;
  username: string;
  role: 'admin' | 'operator';
  name: string;
}

export type View = 
  | 'dashboard' 
  | 'clients' 
  | 'banks' 
  | 'discount' 
  | 'history' 
  | 'returned' 
  | 'report-client' 
  | 'report-period' 
  | 'report-date' 
  | 'users'
  | 'settings';
