import { supabase } from '../lib/supabase';

const DB_NAME = 'BookVaultDB_v3'; // Brand new namespace to bypass blocks
const STORE_NAME = 'bookFiles';
const DB_VERSION = 1;

export const uploadBookToCloud = async (id, file) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.storage
    .from('books')
    .upload(`${user.id}/${id}`, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) {
    if (error.message.includes('already exists')) return; // Ignore if already there
    console.error('Cloud upload failed:', error);
  }
};

export const downloadBookFromCloud = async (id) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.storage
    .from('books')
    .download(`${user.id}/${id}`);

  if (error) {
    console.error('Cloud download failed:', error);
    return null;
  }

  // Cache locally
  await saveBookFile(id, data);
  return data;
};

const openDB = () => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('IndexedDB open timed out after 5s'));
    }, 5000);

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event) => {
        clearTimeout(timeoutId);
        const db = event.target.result;
        
        // Handle unexpected closures
        db.onversionchange = () => {
          db.close();
          console.warn('Database version changed elsewhere, closing connection.');
        };
        
        resolve(db);
      };

      request.onerror = (event) => {
        clearTimeout(timeoutId);
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };

      request.onblocked = () => {
        clearTimeout(timeoutId);
        console.warn('IndexedDB open blocked. Please close other tabs of this app.');
        reject(new Error('IndexedDB blocked'));
      };
    } catch (err) {
      clearTimeout(timeoutId);
      reject(err);
    }
  });
};

export const saveBookFile = async (id, file) => {
  let db;
  try {
    db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Explicitly convert File to standard Blob for better IndexedDB reliability
    const blobToStore = new Blob([file], { type: file.type });
    
    store.put(blobToStore, id);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = (e) => {
        db.close();
        reject(e.target.error);
      };
    });
  } catch (error) {
    if (db) db.close();
    console.error('Storage save failed:', error);
    throw error;
  }
};

export const getBookFile = async (id) => {
  let db;
  try {
    db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        db.close();
        if (request.result) {
          resolve(request.result);
        } else {
          // Try cloud fallback
          console.log(`File ${id} missing locally, attempting cloud download...`);
          const cloudFile = await downloadBookFromCloud(id);
          resolve(cloudFile);
        }
      };
      request.onerror = (e) => {
        db.close();
        reject(e.target.error);
      };
    });
  } catch (error) {
    if (db) db.close();
    console.error('Storage retrieval failed:', error);
    return null;
  }
};

export const deleteBookFile = async (id) => {
  let db;
  try {
    // Cloud removal
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.storage.from('books').remove([`${user.id}/${id}`]);
    }

    db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = (e) => {
        db.close();
        reject(e.target.error);
      };
    });
  } catch (error) {
    if (db) db.close();
    console.error('Storage deletion failed:', error);
  }
};
