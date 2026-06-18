/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where, setDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';
import { storage } from './storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || 'MISSING',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId,
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'MISSING') {
  console.warn('Firebase API Key is missing. Check your .env variables.');
}

const app = initializeApp(firebaseConfig);
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || 'ai-studio-35e9fbbe-b8c4-4bfa-9808-c3fd6524814a';
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export const loginAnonymously = async () => {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.warn('Anonymous login is unavailable or disabled in Firebase Console. Falling back to local/public Firestore access.', error);
  }
};

// Global registry for local fallback active listeners
const fallbackSubscriptions = new Map<string, Set<(data: any[]) => void>>();

function triggerFallbackUpdate(collName: string) {
  const callbacks = fallbackSubscriptions.get(collName);
  if (callbacks) {
    let data: any[] = [];
    if (collName === 'clients') {
      data = storage.getClients();
    } else if (collName === 'banks') {
      data = storage.getBanks();
    } else if (collName === 'transactions') {
      data = storage.getTransactions();
    } else if (collName === 'settings') {
      data = [storage.getSettings()];
    } else if (collName === 'users') {
      data = [];
    }
    callbacks.forEach(cb => cb(data));
  }
}

// Helper for real-time collections with local fallback
export const subscribeToCollection = <T>(collName: string, callback: (data: T[]) => void, orderField?: string) => {
  const collRef = collection(db, collName);
  const q = orderField 
    ? query(collRef, orderBy(orderField, 'desc')) 
    : query(collRef);
  
  let currentUnsubscribe: (() => void) | null = null;
  let isLocalFallbackActive = false;

  const startSnapshot = (queryToUse: any, isFallback: boolean = false) => {
    return onSnapshot(queryToUse, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      callback(data);
    }, (error) => {
      console.error(`Error subscribing to ${collName} (isFallback: ${isFallback}):`, error);
      handleFirestoreError(error, OperationType.LIST, collName);
      
      if (!isFallback && orderField) {
        console.warn(`Attempting fallback to unordered subscription for ${collName}`);
        if (currentUnsubscribe) currentUnsubscribe();
        currentUnsubscribe = startSnapshot(collRef, true);
      } else {
        console.warn(`Activating local storage fallback subscription for ${collName}`);
        isLocalFallbackActive = true;
        
        // Register standard local callbacks
        if (!fallbackSubscriptions.has(collName)) {
          fallbackSubscriptions.set(collName, new Set());
        }
        fallbackSubscriptions.get(collName)!.add(callback);
        
        // Trigger initial data callback from local storage immediately so page loads
        triggerFallbackUpdate(collName);
      }
    });
  };

  currentUnsubscribe = startSnapshot(q);
  return () => {
    if (currentUnsubscribe) currentUnsubscribe();
    if (isLocalFallbackActive) {
      const callbacks = fallbackSubscriptions.get(collName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          fallbackSubscriptions.delete(collName);
        }
      }
    }
  };
};

export const subscribeToTransactions = (callback: (data: any[]) => void) => {
  return subscribeToCollection('transactions', callback);
};

export const saveItem = async (collName: string, item: any) => {
  const timestamp = new Date().toISOString();
  const dataToSave = {
    ...item,
    updatedAt: timestamp,
    createdAt: item.createdAt || timestamp
  };

  // 1. Always save to local storage first as local replica & backup
  try {
    if (collName === 'clients') {
      const current = storage.getClients();
      const index = current.findIndex(c => c.id === item.id);
      if (index > -1) {
        current[index] = dataToSave;
      } else {
        current.push(dataToSave);
      }
      storage.saveClients(current);
    } else if (collName === 'banks') {
      const current = storage.getBanks();
      const index = current.findIndex(b => b.id === item.id);
      if (index > -1) {
        current[index] = dataToSave;
      } else {
        current.push(dataToSave);
      }
      storage.saveBanks(current);
    } else if (collName === 'transactions') {
      const current = storage.getTransactions();
      const index = current.findIndex(t => t.id === item.id);
      if (index > -1) {
        current[index] = dataToSave;
      } else {
        current.push(dataToSave);
      }
      storage.saveTransactions(current);
    } else if (collName === 'settings') {
      storage.saveSettings(dataToSave);
    }
    
    // Notify fallback subscribers of the changes
    triggerFallbackUpdate(collName);
  } catch (err) {
    console.error('Failed to update local storage mirror:', err);
  }

  // 2. Safely attempt Firestore commit
  try {
    if (dataToSave.id && !dataToSave.id.toString().includes('-temp')) {
      const { id, ...finalData } = dataToSave;
      await setDoc(doc(db, collName, id), finalData);
      return id;
    } else {
      const { id, ...finalData } = dataToSave;
      const docRef = await addDoc(collection(db, collName), finalData);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collName);
    console.warn(`Firestore save failed for ${collName}. Proceeding with local copy in-browser.`);
    return item.id || 'local-id';
  }
};

export const deleteItem = async (collName: string, id: string) => {
  // 1. Always sync delete to local storage first
  try {
    if (collName === 'clients') {
      const current = storage.getClients().filter(c => c.id !== id);
      storage.saveClients(current);
    } else if (collName === 'banks') {
      const current = storage.getBanks().filter(b => b.id !== id);
      storage.saveBanks(current);
    } else if (collName === 'transactions') {
      const current = storage.getTransactions().filter(t => t.id !== id);
      storage.saveTransactions(current);
    }
    triggerFallbackUpdate(collName);
  } catch (err) {
    console.error('Failed to sync delete to local storage mirror:', err);
  }

  // 2. Safely attempt Firestore delete
  try {
    await deleteDoc(doc(db, collName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collName}/${id}`);
    console.warn(`Firestore delete failed for ${collName}/${id}. Item successfully removed from local storage.`);
  }
};
