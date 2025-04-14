import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: "AIzaSyDIDaprylwOHheSTlQSGxofwnxpVM-Gd5k",
//   authDomain: "gatesync-25810.firebaseapp.com",
//   projectId: "gatesync-25810",
//   storageBucket: "gatesync-25810.appspot.com",
//   messagingSenderId: "659285679162",
//   appId: "1:659285679162:web:3523a135c82acedc172903",
//   measurementId: "G-EFGGWTR6KS",
// };

const firebaseConfig = {
  apiKey: "AIzaSyD2G6_RpTzIs6KyE7HBP0rbLCYNxcj0yUw",
  authDomain: "gatesync-bf2cc.firebaseapp.com",
  projectId: "gatesync-bf2cc",
  storageBucket: "gatesync-bf2cc.firebasestorage.app",
  messagingSenderId: "331184912363",
  appId: "1:331184912363:web:2ff4bf1642073e9c5d0bae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
