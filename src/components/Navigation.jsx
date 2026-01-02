// Navigation Component - Responsive Hamburger Menu Navigation
import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Badge,
  Chip,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as TransactionsIcon,
  AccountBalance as LoansIcon,
  Savings as SavingsIcon,
  ShoppingCart as GoodsIcon,
  AccountBalance as WithdrawalsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
  Home as HomeIcon,
  TrendingUp as TrendingUpIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { currentUser, logout, getUserDisplayName } = useAuth();
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);

  // Navigation menu items
  const menuItems = [
    { text: 'Overview', icon: <DashboardIcon />, path: '/' },
    { text: 'Transactions', icon: <TransactionsIcon />, path: '/transactions' },
    { text: 'Loans', icon: <LoansIcon />, path: '/loans' },
    { text: 'Savings', icon: <SavingsIcon />, path: '/savings' },
    { text: 'Goods Debt', icon: <GoodsIcon />, path: '/goods-debt' },
    { text: 'Withdrawals', icon: <WithdrawalsIcon />, path: '/withdrawals' },
  ];

  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setAnchorEl(null);
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem?.text || 'Dashboard';
  };

  // Drawer content
  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
      }}
    >
      {/* Logo/Brand */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUpIcon sx={{ color: '#667eea', fontSize: 32 }} />
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 700,
                lineHeight: 1.2
              }}
            >
              CashFlow
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Management
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {/* User Info */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Avatar
          sx={{
            bgcolor: '#667eea',
            width: 40,
            height: 40,
            fontSize: '1rem'
          }}
        >
          {getUserDisplayName().charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: 'white', fontWeight: 600 }}
            noWrap
          >
            {getUserDisplayName()}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.6)' }}
            noWrap
          >
            {currentUser?.email}
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(102, 126, 234, 0.3)'
                      : 'rgba(255, 255, 255, 0.05)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#667eea' : 'rgba(255,255,255,0.7)',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': {
                      color: isActive ? 'white' : 'rgba(255,255,255,0.8)',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.9rem'
                    }
                  }}
                />
                {isActive && (
                  <Box
                    sx={{
                      width: 4,
                      height: 24,
                      backgroundColor: '#667eea',
                      borderRadius: 2
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom Section */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 2 }}>
        <Tooltip title="Click to logout" arrow>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.1)'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              sx={{
                '& .MuiTypography-root': {
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.9rem'
                }
              }}
            />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* App Bar (Mobile only) */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            backgroundColor: 'white',
            borderBottom: '1px solid rgba(0,0,0,0.08)'
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2, color: '#1a1a2e' }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                color: '#1a1a2e',
                fontWeight: 600
              }}
            >
              {getCurrentPageTitle()}
            </Typography>
            <IconButton sx={{ color: '#1a1a2e' }}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: isMobile ? 280 : drawerOpen ? 280 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            borderRight: 'none',
            boxShadow: isMobile ? 'none' : '4px 0 20px rgba(0,0,0,0.1)',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen
            })
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: isMobile ? 8 : 0,
          ml: isMobile ? 0 : drawerOpen ? 0 : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
          }),
          minHeight: '100vh'
        }}
      >
        {/* Toggle button for desktop */}
        {!isMobile && (
          <IconButton
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{
              position: 'fixed',
              left: drawerOpen ? 290 : 10,
              top: 20,
              zIndex: 1200,
              bgcolor: 'white',
              boxShadow: 2,
              '&:hover': { bgcolor: '#f5f5f5' },
              transition: 'left 0.2s ease'
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {children}
      </Box>
    </Box>
  );
};

export default Navigation;

