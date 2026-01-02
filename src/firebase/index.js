// Firebase Index - Export all Firebase services
export { auth, db, default as app } from './config';

// Firebase utility functions
export const getFirebaseErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/requires-recent-login': 'Please sign in again to continue.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-token-expired': 'Session expired. Please sign in again.',
  };
  
  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};

