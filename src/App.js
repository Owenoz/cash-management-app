// App.js - Main Application with Authentication and Routing
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CashManagementProvider } from './context/CashManagementContext';
import Login from './components/Login';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';

import './App.css';

// Professional Color Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8b9ff0',
      dark: '#4a5fc1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      light: '#9b6fc4',
      dark: '#5a367b',
      contrastText: '#ffffff',
    },
    success: {
      main: '#16a34a',
      light: '#4ade80',
      dark: '#15803d',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
    },
    warning: {
      main: '#d97706',
      light: '#f59e0b',
      dark: '#b45309',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '10px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
});

// Global Styles
const globalStyles = (
  <GlobalStyles
    styles={{
      '*': {
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      },
      'html, body': {
        height: '100%',
        scrollBehavior: 'smooth',
      },
      '#root': {
        minHeight: '100vh',
      },
      '::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '4px',
      },
      '::-webkit-scrollbar-thumb': {
        background: '#c1c1c1',
        borderRadius: '4px',
      },
      '::-webkit-scrollbar-thumb:hover': {
        background: '#a1a1a1',
      },
      '@font-face': {
        fontFamily: 'Inter',
        fontDisplay: 'swap',
        src: 'local("Inter")',
      },
    }}
  />
);

// Main App Content
function AppContent() {
  const { currentUser, initializing } = useAuth();
  const [isRegistering] = useState(false);

  const handleLoginSuccess = () => {
    console.log('Login successful!');
  };

  // Show loading while checking auth
  if (initializing) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: '#64748b', margin: 0 }}>Loading Cash Management...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login page
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} isRegistering={isRegistering} />;
  }

  // If logged in, show the main app with navigation
  return (
    <Navigation>
      <Dashboard />
    </Navigation>
  );
}

// Root App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <AuthProvider>
        <CashManagementProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginWrapper />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <AppContent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </CashManagementProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Login Page Wrapper (redirects if already logged in)
function LoginWrapper() {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    return <Navigate to="/" replace />;
  }
  
  return <Login />;
}

export default App;

