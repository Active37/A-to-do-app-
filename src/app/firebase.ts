import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0875324053",
  appId: "1:491056580385:web:81c0a606e14a78983ae060",
  apiKey: "AIzaSyC7AJgBXdVsly3WpDQts-YwiGDr7KROFcg",
  authDomain: "gen-lang-client-0875324053.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-95834f3c-31aa-4c4e-b706-af0aaf56c0ee",
  storageBucket: "gen-lang-client-0875324053.firebasestorage.app",
  messagingSenderId: "491056580385"
};

const isBrowser = typeof window !== 'undefined';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isBrowser) {
  try {
    const apps = getApps();
    app = apps.length ? apps[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Connection verification per rules
    getDocFromServer(doc(db, 'test', 'connection')).catch((err) => {
      if (err instanceof Error && err.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    });
  } catch (e) {
    console.error('Error bootstrapping Firebase client SDK:', e);
  }
}

export { app, auth, db };

