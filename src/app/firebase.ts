import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let database: any;
if (typeof window !== 'undefined') {
  try {
    database = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.warn('Failed to initialize with persistent local cache, falling back:', err);
    database = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
} else {
  database = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = database;
