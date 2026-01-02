// Firebase Configuration - Demo Mode
// This file is configured for DEMO MODE (no real Firebase credentials needed)
// For production, replace the config with your actual Firebase project credentials

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your actual Firebase configuration
const firebaseConfig = {

  apiKey: "AIzaSyCuNy-sFCP-x-yjXuvWNpryK2hj3WVqgLY",

  authDomain: "teens-kulture.firebaseapp.com",

  projectId: "teens-kulture",

  storageBucket: "teens-kulture.firebasestorage.app",

  messagingSenderId: "648946624476",

  appId: "1:648946624476:web:e916334dc628adf37e9119",

  measurementId: "G-CXWPRHJWDY"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export app for any other Firebase services
export default app;

// Instructions to set up Firebase:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or use existing one
// 3. Enable Authentication (Email/Password provider)
// 4. Enable Firestore Database (create in test mode for development)
// 5. Get your web app configuration from Project Settings
// 6. Replace the placeholder values above with your actual credentials

