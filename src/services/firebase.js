import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAv7GDSLS3Kwb-aMAhyQE3YgnPkCNg8cvg",
  authDomain: "grow-studio-menus.firebaseapp.com",
  projectId: "grow-studio-menus",
  storageBucket: "grow-studio-menus.firebasestorage.app",
  messagingSenderId: "152582182898",
  appId: "1:152582182898:web:cf17e88b6b1f861cdc7d6b"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
