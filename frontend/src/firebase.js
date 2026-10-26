
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBZ1aMckjFoxFRrBoW9Q6KGE5qu0kvPEdc",
  authDomain: "photonest-8302c.firebaseapp.com",
  projectId: "photonest-8302c",
  storageBucket: "photonest-8302c.firebasestorage.app",
  messagingSenderId: "90314523493",
  appId: "1:90314523493:web:d7d47d0ac6ec07df5b578c",
  measurementId: "G-1D3TXY3TSM"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;