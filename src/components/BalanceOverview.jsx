// BalanceOverview.jsx - Enhanced Responsive Dashboard Component
import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  AttachMoney as CashIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalanceWallet as WalletIcon,
  ShoppingCart as GoodsIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Refresh as RefreshIcon,
  ShowChart as ChartIcon,
  TableChart as TableIcon,
  Timeline as TimelineIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
  TrendingFlat as TrendIcon
} from '@mui/icons-material';
import { useCashManagement } from '../context/CashManagementContext';
import { formatCurrency } from '../context/CashManagementContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const BalanceOverview = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { state, stats, currency, isSyncing, lastSynced } = useCashManagement();
  const { balance } = state;
  
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'charts', 'table'
  const [timeRange, setTimeRange] = useState('today'); // 'today', 'week', 'month'
  
  const today = new Date().toISOString().split('T')[0];
  const recentTransactions = state.transactions.slice(0, 6);
  
  // Calculate percentages
  const totalBalance = balance.bank + balance.cash;
  const cashPercentage = totalBalance > 0 ? (balance.cash / totalBalance) * 100 : 0;
  const bankPercentage = totalBalance > 0 ? (balance.bank / totalBalance) * 100 : 0;

  // Today's summary
  const todaysTransactions = state.transactions.filter(t => t.date === today);
  const todaysIncome = todaysTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const todaysExpense = todaysTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const todaysNet = todaysIncome - todaysExpense;

  // Calculate weekly trends
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const weeklyData = useMemo(() => {
    const days = getLast7Days();
    return days.map(date => {
      const dayTransactions = state.transactions.filter(t => t.date === date);
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayIndex = new Date(date).getDay();
      
      return {
        date,
        day: dayNames[dayIndex],
        income,
        expense,
        net: income - expense
      };
    });
  }, [state.transactions]);

  // Calculate category breakdown
  const incomeByCategory = useMemo(() => {
    const categories = {};
    state.transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const category = t.category || 'Other';
        categories[category] = (categories[category] || 0) + t.amount;
      });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [state.transactions]);

  const expenseByCategory = useMemo(() => {
    const categories = {};
    state.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category || 'Other';
        categories[category] = (categories[category] || 0) + t.amount;
      });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [state.transactions]);

  // Calculate loan statistics
  const activeLoans = state.loans.filter(l => l.status === 'active');
  const paidLoans = state.loans.filter(l => l.status === 'paid');
  const loanRecoveryRate = state.loans.length > 0 
    ? (paidLoans.length / state.loans.length) * 100 
    : 0;

  // Calculate debt statistics
  const activeDebts = state.goodsDebt.filter(d => d.status === 'active');
  const paidDebts = state.goodsDebt.filter(d => d.status === 'paid');
  const debtRecoveryRate = state.goodsDebt.length > 0 
    ? (paidDebts.length / state.goodsDebt.length) * 100 
    : 0;

  // Calculate savings statistics
  const totalSavings = state.savings.reduce((sum, s) => sum + (s.currentBalance || 0), 0);
  const savingsCount = state.savings.length;

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Performance indicators
  const performanceIndicators = [
    {
      label: 'Cash Flow Health',
      value: todaysNet >= 0 ? 'Healthy' : 'Alert',
      color: todaysNet >= 0 ? '#16a34a' : '#dc2626',
      icon: todaysNet >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />
    },
    {
      label: 'Loan Recovery',
      value: `${loanRecoveryRate.toFixed(0)}%`,
      color: loanRecoveryRate > 70 ? '#16a34a' : loanRecoveryRate > 40 ? '#f59e0b' : '#dc2626',
      icon: <PeopleIcon />
    },
    {
      label: 'Savings Growth',
      value: savingsCount > 0 ? 'Active' : 'None',
      color: savingsCount > 0 ? '#16a34a' : '#6b7280',
      icon: <WalletIcon />
    },
    {
      label: 'Debt Recovery',
      value: `${debtRecoveryRate.toFixed(0)}%`,
      color: debtRecoveryRate > 70 ? '#16a34a' : debtRecoveryRate > 40 ? '#f59e0b' : '#dc2626',
      icon: <GoodsIcon />
    }
  ];

  return (
    <Box>
      {/* Enhanced Header with Controls */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1e293b" gutterBottom>
            Cash Book Dashboard
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="textSecondary">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
            {lastSynced && (
              <Chip 
                size="small" 
                label={`Synced: ${new Date(lastSynced).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                color="success"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="cards">
              <Tooltip title="Card View">
                <TableIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="charts">
              <Tooltip title="Chart View">
                <ChartIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, newRange) => newRange && setTimeRange(newRange)}
            size="small"
          >
            <ToggleButton value="today">Today</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* Performance Indicators */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {performanceIndicators.map((indicator, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                borderRadius: 2,
                border: `2px solid ${indicator.color}20`,
                bgcolor: `${indicator.color}05`
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ bgcolor: `${indicator.color}20`, width: 32, height: 32 }}>
                  {React.cloneElement(indicator.icon, { 
                    sx: { color: indicator.color, fontSize: 16 } 
                  })}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {indicator.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color={indicator.color}>
                    {indicator.value}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Main Balance Cards with Animations */}
      <Zoom in={true} style={{ transitionDelay: '100ms' }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.3s ease-in-out'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                      <BankIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Bank Balance
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {formatCurrency(balance.bank, currency)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={`${bankPercentage.toFixed(0)}%`} 
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={bankPercentage} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': { 
                      bgcolor: 'white',
                      transition: 'transform 1s ease-in-out'
                    }
                  }}
                />
              </CardContent>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: 100, 
                  height: 100,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                  borderRadius: '50%',
                  transform: 'translate(30%, -30%)'
                }}
              />
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.3s ease-in-out'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                      <CashIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Cash at Hand
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {formatCurrency(balance.cash, currency)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={`${cashPercentage.toFixed(0)}%`} 
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={cashPercentage} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': { 
                      bgcolor: 'white',
                      transition: 'transform 1s ease-in-out'
                    }
                  }}
                />
              </CardContent>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: 100, 
                  height: 100,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                  borderRadius: '50%',
                  transform: 'translate(30%, -30%)'
                }}
              />
            </Card>
          </Grid>
        </Grid>
      </Zoom>

      {/* Total Balance with Charts */}
      <Fade in={true} timeout={500}>
        <Paper 
          elevation={2}
          sx={{ 
            p: 3, 
            mb: 4,
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: 'white',
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Grid container alignItems="center" spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                  Total Balance
                </Typography>
                <Typography variant="h2" fontWeight={700} sx={{ mb: 1 }}>
                  {formatCurrency(balance.total, currency)}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendIcon sx={{ 
                    color: todaysNet >= 0 ? '#38ef7d' : '#ef4444',
                    transform: todaysNet >= 0 ? 'none' : 'rotate(180deg)'
                  }} />
                  <Typography 
                    variant="body1" 
                    fontWeight={600}
                    color={todaysNet >= 0 ? '#38ef7d' : '#ef4444'}
                  >
                    {todaysNet >= 0 ? '+' : ''}{formatCurrency(todaysNet, currency)} today
                  </Typography>
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="day" 
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={12}
                      tickFormatter={(value) => formatCurrency(value, '').replace('$', '')}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: 'none',
                        borderRadius: 8
                      }}
                      formatter={(value) => [formatCurrency(value, currency), 'Amount']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#38ef7d" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Charts View */}
      {viewMode === 'charts' && (
        <Fade in={true} timeout={500}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={600} color="#1e293b" gutterBottom>
                  Income by Category
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value, '').replace('$', '')} />
                      <RechartsTooltip formatter={(value) => [formatCurrency(value, currency), 'Amount']} />
                      <Bar dataKey="value" fill="#38ef7d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={600} color="#1e293b" gutterBottom>
                  Expense by Category
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatCurrency(value, currency)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Fade>
      )}

      {/* Detailed Statistics */}
      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#f8fafc', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" fontWeight={600} color="#1e293b">
                Recent Transactions
              </Typography>
              <Chip 
                label={`${todaysTransactions.length} today`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
            <List sx={{ p: 0 }}>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <Fade in={true} timeout={300} key={transaction.id}>
                    <React.Fragment>
                      <ListItem 
                        sx={{ 
                          py: 1.5, 
                          px: 2,
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                        }}
                      >
                        <ListItemIcon>
                          <Avatar 
                            sx={{ 
                              bgcolor: transaction.type === 'income' ? '#dcfce7' : '#fee2e2',
                              width: 40,
                              height: 40
                            }}
                          >
                            {transaction.type === 'income' ? (
                              <ArrowUpIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                            ) : (
                              <ArrowDownIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                            )}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography fontWeight={500}>
                                {transaction.description || 'No description'}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                fontWeight={600}
                                color={transaction.type === 'income' ? '#16a34a' : '#dc2626'}
                              >
                                {transaction.type === 'income' ? '+' : '-'}
                                {formatCurrency(transaction.amount, currency)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip 
                                  label={transaction.account} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                                <Typography variant="caption" color="textSecondary">
                                  {transaction.date}
                                </Typography>
                              </Stack>
                              {transaction.category && (
                                <Chip 
                                  label={transaction.category}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentTransactions.length - 1 && <Divider />}
                    </React.Fragment>
                  </Fade>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary={
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography color="textSecondary">
                          No transactions today
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Start by adding your first transaction
                        </Typography>
                      </Box>
                    } 
                  />
                </ListItem>
              )}
            </List>
            {recentTransactions.length > 0 && (
              <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  size="small"
                  startIcon={<TrendIcon />}
                >
                  View All Transactions
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Stats with Progress */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight={600} color="#1e293b">
                Financial Overview
              </Typography>
            </Box>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ py: 2, px: 2 }}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: '#dbeafe', width: 40, height: 40 }}>
                    <PeopleIcon sx={{ color: '#2563eb' }} />
                  </Avatar>
                </ListItemIcon>
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Active Loans
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="#2563eb">
                      {formatCurrency(stats.totalLoanPending, currency)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {activeLoans.length} active • {paidLoans.length} paid
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={loanRecoveryRate} 
                    sx={{ 
                      height: 4, 
                      borderRadius: 2,
                      mt: 1,
                      bgcolor: 'rgba(37, 99, 235, 0.1)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#2563eb' }
                    }}
                  />
                </Box>
              </ListItem>
              <Divider />
              
              <ListItem sx={{ py: 2, px: 2 }}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: '#fef3c7', width: 40, height: 40 }}>
                    <GoodsIcon sx={{ color: '#d97706' }} />
                  </Avatar>
                </ListItemIcon>
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Goods Debt
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="#d97706">
                      {formatCurrency(stats.totalGoodsDebtPending, currency)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {activeDebts.length} active • {paidDebts.length} paid
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={debtRecoveryRate} 
                    sx={{ 
                      height: 4, 
                      borderRadius: 2,
                      mt: 1,
                      bgcolor: 'rgba(217, 119, 6, 0.1)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#d97706' }
                    }}
                  />
                </Box>
              </ListItem>
              <Divider />
              
              <ListItem sx={{ py: 2, px: 2 }}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: '#dcfce7', width: 40, height: 40 }}>
                    <WalletIcon sx={{ color: '#16a34a' }} />
                  </Avatar>
                </ListItemIcon>
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Money Keeping
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="#16a34a">
                      {formatCurrency(totalSavings, currency)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {savingsCount} accounts • Average: {savingsCount > 0 ? formatCurrency(totalSavings / savingsCount, currency) : formatCurrency(0, currency)}
                  </Typography>
                </Box>
              </ListItem>
              <Divider />
              
              <ListItem sx={{ py: 2, px: 2 }}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: '#fee2e2', width: 40, height: 40 }}>
                    <CalendarIcon sx={{ color: '#dc2626' }} />
                  </Avatar>
                </ListItemIcon>
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Today's Activity
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={600} 
                      color={todaysNet >= 0 ? '#16a34a' : '#dc2626'}
                    >
                      {formatCurrency(todaysNet, currency)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {todaysIncome > 0 && `${formatCurrency(todaysIncome, currency)} income • `}
                    {todaysExpense > 0 && `${formatCurrency(todaysExpense, currency)} expense`}
                  </Typography>
                  {todaysIncome > 0 && todaysExpense > 0 && (
                    <LinearProgress 
                      variant="determinate" 
                      value={(todaysIncome / (todaysIncome + todaysExpense)) * 100} 
                      sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        mt: 1,
                        bgcolor: 'rgba(220, 38, 38, 0.1)',
                        '& .MuiLinearProgress-bar': { bgcolor: '#16a34a' }
                      }}
                    />
                  )}
                </Box>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Loading State */}
      {isSyncing && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} />
            <Typography variant="caption">Syncing data...</Typography>
          </Paper>
        </Box>
      )}

      {/* Add CSS for animations */}
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default BalanceOverview;