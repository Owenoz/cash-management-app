// PrivateRoute - Protect routes that require authentication
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading, initializing } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading || initializing) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)'
        }}
      >
        <Paper
          elevation={4}
          sx={{
            p: 5,
            borderRadius: 3,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <CircularProgress
            size={50}
            sx={{
              color: '#667eea',
              mb: 2
            }}
          />
          <Typography variant="h6" color="textSecondary">
            Loading...
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Verifying your session
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return children;
};

export default PrivateRoute;
