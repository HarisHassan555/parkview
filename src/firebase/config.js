// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwFkg6mDvjBiUHSR_XnnX_NJY_9xjQBo0",
  authDomain: "parkviewdemo.firebaseapp.com",
  projectId: "parkviewdemo",
  storageBucket: "parkviewdemo.firebasestorage.app",
  messagingSenderId: "967148964299",
  appId: "1:967148964299:web:2aca31284a156d78e1ce4e",
  measurementId: "G-5V8002DWCW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
