// Login Component - Professional login form with Firebase Auth
import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  Alert,
  CircularProgress,
  Link,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Google as GoogleIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login = ({ onLoginSuccess, isRegistering = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { login, signup, error, clearError, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    clearError();
    setLocalError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.email) {
      setLocalError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setLocalError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }
    if (isRegistering && formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }
    if (isRegistering && !formData.displayName) {
      setLocalError('Name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await signup(formData.email, formData.password, formData.displayName);
        setSuccess('Account created successfully! Please sign in.');
      } else {
        await login(formData.email, formData.password);
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'demo@example.com',
      password: 'demo123',
      confirmPassword: 'demo123',
      displayName: 'Demo User'
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 440,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isRegistering
              ? 'Sign up to manage your cash flow'
              : 'Sign in to your Cash Management Account'
            }
          </Typography>
        </Box>

        {/* Error/Success Messages */}
        {(localError || error) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {localError || error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <TextField
              fullWidth
              label="Full Name"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              margin="normal"
              autoComplete="name"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {isRegistering && (
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              autoComplete="new-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                }
              }}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
            >
              {isSubmitting ? 'Please wait...' : isRegistering ? 'Create Account' : 'Sign In'}
            </Button>
        </form>

        {/* Divider */}
        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="textSecondary">
            OR
          </Typography>
        </Divider>

        {/* Demo Button */}
        <Button
          fullWidth
          variant="outlined"
          onClick={fillDemoCredentials}
          sx={{
            mb: 2,
            borderColor: '#667eea',
            color: '#667eea',
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              borderColor: '#764ba2',
              backgroundColor: 'rgba(102, 126, 234, 0.04)'
            }
          }}
        >
          Fill Demo Credentials
        </Button>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                clearError();
                setSuccess('');
                setLocalError('');
              }}
              sx={{ fontWeight: 600 }}
            >
              {isRegistering ? 'Sign In' : 'Sign Up'}
            </Link>
          </Typography>
        </Box>

        {/* Firebase Notice */}
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ display: 'block', textAlign: 'center', mt: 3 }}
        >
          🔐 Secured with Firebase Authentication
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;

