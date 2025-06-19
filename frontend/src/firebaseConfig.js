// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyvlFUw7s9Q1-oHCE7KmPZnK96V3hOsRA",
  authDomain: "piso-3f93b.firebaseapp.com",
  projectId: "piso-3f93b",
  storageBucket: "piso-3f93b.firebasestorage.app",
  messagingSenderId: "303105307443",
  appId: "1:303105307443:web:3bbe233a5d81ad12b04446"
};

// Initialize Firebase
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage, app };