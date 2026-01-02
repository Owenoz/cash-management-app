// Authentication Context - Handle user authentication state
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, getFirebaseErrorMessage } from '../firebase';

// Create context FIRST
const AuthContext = createContext();

// Auth Provider Component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // Sign up new user
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (displayName) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      return result.user;
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err.code) || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sign in existing user
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err.code) || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sign out user
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err.code) || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err.code) || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (currentUser?.displayName) return currentUser.displayName;
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'User';
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!currentUser;
  };

  const value = {
    currentUser,
    loading,
    initializing,
    error,
    signup,
    login,
    logout,
    resetPassword,
    clearError,
    getUserDisplayName,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook - defined AFTER AuthProvider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
