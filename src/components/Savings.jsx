// Savings.jsx - Complete with working delete/edit functionality
import React, { useState } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, TextField, Button, IconButton, Chip, Typography,
  MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Card, CardContent, useTheme, useMediaQuery, InputAdornment,
  Avatar, Divider, Collapse, TableSortLabel, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, TrendingUp as DepositIcon, TrendingDown as WithdrawIcon,
  AccountBalance as BankIcon, History as HistoryIcon, ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon, ArrowUpward as InflowIcon, ArrowDownward as OutflowIcon,
  Visibility as ViewIcon, Edit as EditIcon, Download as DownloadIcon
} from '@mui/icons-material';
import { useCashManagement } from '../context/CashManagementContext';
import { formatCurrency } from '../context/CashManagementContext';

const Savings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { state, actions, currency } = useCashManagement();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [openEditTransactionDialog, setOpenEditTransactionDialog] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'accountName', direction: 'asc' });
  const [filterType, setFilterType] = useState('all');
  
  const [newSaving, setNewSaving] = useState({
    accountName: '',
    openingBalance: '',
    bank: '',
    notes: ''
  });
  
  const [transaction, setTransaction] = useState({ 
    amount: '', 
    type: 'deposit', 
    date: new Date().toISOString().split('T')[0], 
    notes: '' 
  });

  const [editTransaction, setEditTransaction] = useState({
    id: '',
    amount: '',
    type: 'deposit',
    date: '',
    notes: ''
  });

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredSavings = state.savings || [];

  // Calculate running balance for transactions
  const calculateRunningBalance = (saving) => {
    try {
      if (!saving) {
        return { transactionsWithBalance: [], currentBalance: 0 };
      }
      
      const transactions = saving.transactions || [];
      if (transactions.length === 0) {
        return { 
          transactionsWithBalance: [], 
          currentBalance: parseFloat(saving.openingBalance) || 0 
        };
      }
      
      const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = new Date(a.date || '1970-01-01');
        const dateB = new Date(b.date || '1970-01-01');
        return dateA - dateB;
      });
      
      let balance = parseFloat(saving.openingBalance) || 0;
      const transactionsWithBalance = sortedTransactions.map(trans => {
        const amount = parseFloat(trans.amount) || 0;
        if (trans.type === 'deposit') {
          balance += amount;
        } else {
          balance -= amount;
        }
        return {
          ...trans,
          balanceAfter: balance
        };
      });
      
      return { transactionsWithBalance, currentBalance: balance };
    } catch (error) {
      console.error('Error calculating running balance:', error);
      return { transactionsWithBalance: [], currentBalance: 0 };
    }
  };

  // Sort savings
  const sortedSavings = React.useMemo(() => {
    const sortableItems = [...filteredSavings];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'currentBalance') {
          aVal = parseFloat(a.currentBalance) || 0;
          bVal = parseFloat(b.currentBalance) || 0;
        } else if (sortConfig.key === 'accountName') {
          aVal = (a.accountName || '').toLowerCase();
          bVal = (b.accountName || '').toLowerCase();
        }
        
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredSavings, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAddSaving = () => {
    if (!newSaving.accountName || newSaving.accountName.trim() === '') {
      alert('Please enter account name');
      return;
    }
    
    const openingBalance = parseFloat(newSaving.openingBalance) || 0;
    
    actions.addSaving({
      ...newSaving,
      accountName: newSaving.accountName.trim(),
      openingBalance: openingBalance,
      currentBalance: openingBalance,
      transactions: []
    });
    
    setNewSaving({ accountName: '', openingBalance: '', bank: '', notes: '' });
    setOpenDialog(false);
  };

  const handleAddTransaction = () => {
    if (!transaction.amount || parseFloat(transaction.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!selectedSaving?.id) {
      alert('No saving account selected');
      return;
    }
    
    const transactionData = {
      ...transaction,
      id: Date.now().toString(), // Add transaction ID
      amount: parseFloat(transaction.amount)
    };
    
    actions.addSavingTransaction(selectedSaving.id, transactionData);
    
    setTransaction({ 
      amount: '', 
      type: 'deposit', 
      date: new Date().toISOString().split('T')[0], 
      notes: '' 
    });
    setOpenTransactionDialog(false);
    setSelectedSaving(null);
    
    alert(`${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${formatCurrency(transactionData.amount, currency)} added successfully!`);
  };

  const calculateTransactionBalance = (currentBalance, type, amount) => {
    if (type === 'deposit') {
      return currentBalance + amount;
    } else {
      return currentBalance - amount;
    }
  };

  const handleDeleteSaving = (id) => {
    if (window.confirm('Are you sure you want to delete this savings account?')) {
      actions.deleteSaving(id);
    }
  };

  // WORKING DELETE TRANSACTION FUNCTION
  const handleDeleteTransaction = (savingId, transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      actions.deleteSavingTransaction(savingId, transactionId);
      alert('Transaction deleted successfully!');
    }
  };

  const handleEditTransaction = (saving, transaction) => {
    setSelectedSaving(saving);
    setSelectedTransaction(transaction);
    setEditTransaction({
      id: transaction.id || Date.now().toString(),
      amount: transaction.amount || '',
      type: transaction.type || 'deposit',
      date: transaction.date || new Date().toISOString().split('T')[0],
      notes: transaction.notes || ''
    });
    setOpenEditTransactionDialog(true);
  };

  // WORKING UPDATE TRANSACTION FUNCTION
  const handleUpdateTransaction = () => {
    if (!editTransaction.amount || parseFloat(editTransaction.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!selectedSaving || !selectedTransaction) {
      alert('No transaction selected for update');
      return;
    }
    
    const updates = {
      amount: parseFloat(editTransaction.amount),
      type: editTransaction.type,
      date: editTransaction.date,
      notes: editTransaction.notes,
      updatedAt: new Date().toISOString()
    };
    
    actions.updateSavingTransaction(
      selectedSaving.id,
      editTransaction.id,
      updates
    );
    
    setOpenEditTransactionDialog(false);
    setSelectedSaving(null);
    setSelectedTransaction(null);
    setEditTransaction({
      id: '',
      amount: '',
      type: 'deposit',
      date: '',
      notes: ''
    });
    
    alert('Transaction updated successfully!');
  };

  const openTransactionForSaving = (saving) => {
    if (!saving?.id) {
      alert('Invalid saving account');
      return;
    }
    setSelectedSaving(saving);
    setOpenTransactionDialog(true);
  };

  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const exportSavingsData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalSavings: totalSavings,
      totalDeposits: overallStats.totalDeposits,
      totalWithdrawals: overallStats.totalWithdrawals,
      accounts: state.savings.map(account => ({
        accountName: account.accountName,
        currentBalance: account.currentBalance,
        bank: account.bank,
        transactions: account.transactions || []
      }))
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `savings-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Calculate statistics
  const calculateTransactionStats = (saving) => {
    try {
      if (!saving) {
        return {
          totalDeposits: 0,
          totalWithdrawals: 0,
          netFlow: 0,
          depositCount: 0,
          withdrawalCount: 0,
          transactionCount: 0,
          monthlyStats: {}
        };
      }
      
      const transactions = saving.transactions || [];
      const deposits = transactions.filter(t => t.type === 'deposit');
      const withdrawals = transactions.filter(t => t.type === 'withdrawal');
      
      const totalDeposits = deposits.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const totalWithdrawals = withdrawals.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const netFlow = totalDeposits - totalWithdrawals;
      
      // Calculate monthly stats
      const monthlyStats = {};
      transactions.forEach(trans => {
        try {
          const date = new Date(trans.date || new Date());
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyStats[monthYear]) {
            monthlyStats[monthYear] = { deposits: 0, withdrawals: 0, net: 0 };
          }
          
          const amount = parseFloat(trans.amount) || 0;
          if (trans.type === 'deposit') {
            monthlyStats[monthYear].deposits += amount;
            monthlyStats[monthYear].net += amount;
          } else {
            monthlyStats[monthYear].withdrawals += amount;
            monthlyStats[monthYear].net -= amount;
          }
        } catch (error) {
          console.error('Error processing transaction for monthly stats:', error);
        }
      });
      
      return {
        totalDeposits,
        totalWithdrawals,
        netFlow,
        depositCount: deposits.length,
        withdrawalCount: withdrawals.length,
        transactionCount: transactions.length,
        monthlyStats
      };
    } catch (error) {
      console.error('Error calculating transaction stats:', error);
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        netFlow: 0,
        depositCount: 0,
        withdrawalCount: 0,
        transactionCount: 0,
        monthlyStats: {}
      };
    }
  };

  const totalSavings = React.useMemo(() => {
    return (state.savings || []).reduce((sum, s) => sum + (parseFloat(s.currentBalance) || 0), 0);
  }, [state.savings]);

  const overallStats = React.useMemo(() => {
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalTransactions = 0;
    
    (state.savings || []).forEach(saving => {
      const stats = calculateTransactionStats(saving);
      totalDeposits += stats.totalDeposits;
      totalWithdrawals += stats.totalWithdrawals;
      totalTransactions += stats.transactionCount;
    });
    
    return {
      totalDeposits,
      totalWithdrawals,
      netFlow: totalDeposits - totalWithdrawals,
      totalTransactions
    };
  }, [state.savings]);

  // Calculate monthly summary
  const monthlySummary = React.useMemo(() => {
    const summary = {};
    
    (state.savings || []).forEach(saving => {
      const stats = calculateTransactionStats(saving);
      Object.entries(stats.monthlyStats).forEach(([month, data]) => {
        if (!summary[month]) {
          summary[month] = { deposits: 0, withdrawals: 0, net: 0 };
        }
        summary[month].deposits += data.deposits;
        summary[month].withdrawals += data.withdrawals;
        summary[month].net += data.net;
      });
    });
    
    // Sort by month descending
    return Object.entries(summary)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6); // Last 6 months
  }, [state.savings]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="#1e293b">Savings & Money Keeping</Typography>
        <Typography variant="body2" color="textSecondary">Track your savings accounts and money keeping goals with detailed transaction history</Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#dcfce7', border: '1px solid #bbf7d0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#16a34a', mr: 1.5 }}><BankIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Total Savings</Typography>
              </Box>
              <Typography variant="h4" color="#16a34a" fontWeight={700}>
                {formatCurrency(totalSavings, currency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#dbeafe', border: '1px solid #bfdbfe' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#2563eb', mr: 1.5 }}><InflowIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Total Inflow</Typography>
              </Box>
              <Typography variant="h4" color="#2563eb" fontWeight={700}>
                {formatCurrency(overallStats.totalDeposits, currency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fee2e2', border: '1px solid #fecaca' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#dc2626', mr: 1.5 }}><OutflowIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Total Outflow</Typography>
              </Box>
              <Typography variant="h4" color="#dc2626" fontWeight={700}>
                {formatCurrency(overallStats.totalWithdrawals, currency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fef3c7', border: '1px solid #fde68a' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#d97706', mr: 1.5 }}><HistoryIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Total Transactions</Typography>
              </Box>
              <Typography variant="h4" color="#d97706" fontWeight={700}>
                {overallStats.totalTransactions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Monthly Summary */}
      {monthlySummary.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <HistoryIcon sx={{ mr: 1 }} /> Monthly Summary (Last 6 Months)
            </Typography>
            <Grid container spacing={2}>
              {monthlySummary.map(([month, data]) => (
                <Grid item xs={6} sm={4} md={2} key={month}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {month}
                    </Typography>
                    <Typography variant="body2" color="#16a34a" fontWeight={600}>
                      +{formatCurrency(data.deposits, currency)}
                    </Typography>
                    <Typography variant="caption" color="#dc2626">
                      -{formatCurrency(data.withdrawals, currency)}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography 
                      variant="body1" 
                      fontWeight={700}
                      color={data.net >= 0 ? '#16a34a' : '#dc2626'}
                    >
                      {formatCurrency(data.net, currency)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <BankIcon sx={{ mr: 1 }} /> 
            Savings Accounts ({sortedSavings.length})
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter</InputLabel>
            <Select 
              value={filterType} 
              label="Filter"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Accounts</MenuItem>
              <MenuItem value="active">Active Only</MenuItem>
              <MenuItem value="withBalance">With Balance</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={exportSavingsData}
            sx={{ borderColor: '#667eea', color: '#667eea' }}
          >
            Export
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenDialog(true)}
            sx={{ 
              bgcolor: '#667eea', 
              '&:hover': { bgcolor: '#5a6fd6' } 
            }}
          >
            Add Savings Account
          </Button>
        </Box>
      </Paper>

      {/* Savings Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell width="50px"></TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'accountName'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('accountName')}
                >
                  Account Name
                </TableSortLabel>
              </TableCell>
              {!isMobile && <TableCell>Bank</TableCell>}
              <TableCell align="right">
                <TableSortLabel
                  active={sortConfig.key === 'currentBalance'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('currentBalance')}
                >
                  Current Balance
                </TableSortLabel>
              </TableCell>
              {!isMobile && (
                <>
                  <TableCell align="right">Inflow</TableCell>
                  <TableCell align="right">Outflow</TableCell>
                  <TableCell align="center">Transactions</TableCell>
                </>
              )}
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedSavings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 5 : 8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No savings accounts found. Add your first account!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedSavings
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((saving) => {
                  const stats = calculateTransactionStats(saving);
                  const runningBalance = calculateRunningBalance(saving);
                  const transactionsWithBalance = runningBalance.transactionsWithBalance || [];
                  const currentBalance = runningBalance.currentBalance || 0;
                  const isExpanded = expandedRow === saving.id;
                  
                  return (
                    <React.Fragment key={saving?.id || Math.random()}>
                      {/* Main Row */}
                      <TableRow hover sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <IconButton size="small" onClick={() => toggleRowExpansion(saving.id)}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ 
                              bgcolor: '#667eea', 
                              width: 40, 
                              height: 40, 
                              mr: 1.5, 
                              fontSize: '1rem' 
                            }}>
                              {saving?.accountName?.charAt(0)?.toUpperCase() || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {saving?.accountName || 'Unnamed Account'}
                              </Typography>
                              {isMobile && saving?.bank && (
                                <Typography variant="caption" color="textSecondary">
                                  {saving.bank}
                                </Typography>
                              )}
                              <Typography variant="caption" color="textSecondary" display="block">
                                {stats.transactionCount} transactions
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        {!isMobile && (
                          <TableCell>
                            <Typography variant="body2">{saving?.bank || '-'}</Typography>
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Typography variant="h6" fontWeight={700} color="#16a34a">
                            {formatCurrency(currentBalance, currency)}
                          </Typography>
                        </TableCell>
                        {!isMobile && (
                          <>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <InflowIcon sx={{ color: '#2563eb', fontSize: 16, mr: 0.5 }} />
                                <Typography variant="body2" color="#2563eb" fontWeight={500}>
                                  {formatCurrency(stats.totalDeposits, currency)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <OutflowIcon sx={{ color: '#dc2626', fontSize: 16, mr: 0.5 }} />
                                <Typography variant="body2" color="#dc2626" fontWeight={500}>
                                  {formatCurrency(stats.totalWithdrawals, currency)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={`${stats.depositCount}D / ${stats.withdrawalCount}W`}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                          </>
                        )}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <Tooltip title="View Transactions">
                              <IconButton 
                                size="small" 
                                color="info" 
                                onClick={() => toggleRowExpansion(saving.id)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Add Transaction">
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => openTransactionForSaving(saving)} 
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Account">
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeleteSaving(saving?.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row - Transaction History */}
                      <TableRow>
                        <TableCell colSpan={isMobile ? 5 : 8} style={{ paddingBottom: 0, paddingTop: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6">
                                  Transaction History - {saving.accountName}
                                </Typography>
                                <Chip 
                                  label={`Net Flow: ${formatCurrency(stats.netFlow, currency)}`}
                                  color={stats.netFlow >= 0 ? 'success' : 'error'}
                                  size="small"
                                />
                              </Box>
                              
                              {/* Transaction Stats */}
                              <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={4}>
                                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">Opening Balance</Typography>
                                    <Typography variant="h6" fontWeight={600}>
                                      {formatCurrency(saving.openingBalance || 0, currency)}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">Total Inflow</Typography>
                                    <Typography variant="h6" color="#2563eb" fontWeight={600}>
                                      {formatCurrency(stats.totalDeposits, currency)}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">Total Outflow</Typography>
                                    <Typography variant="h6" color="#dc2626" fontWeight={600}>
                                      {formatCurrency(stats.totalWithdrawals, currency)}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              </Grid>
                              
                              {/* Flow Visualization */}
                              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Money Flow Visualization
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Box sx={{ flex: stats.totalDeposits, height: 8, bgcolor: '#2563eb', borderRadius: 1 }} />
                                  <Box sx={{ flex: stats.totalWithdrawals, height: 8, bgcolor: '#dc2626', borderRadius: 1, ml: 0.5 }} />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" color="#2563eb">
                                    Inflow: {formatCurrency(stats.totalDeposits, currency)}
                                  </Typography>
                                  <Typography variant="caption" color="#dc2626">
                                    Outflow: {formatCurrency(stats.totalWithdrawals, currency)}
                                  </Typography>
                                </Box>
                              </Paper>
                              
                              {/* Transactions Table */}
                              {transactionsWithBalance.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                                  <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                      <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell>Notes</TableCell>
                                        <TableCell align="right">Balance After</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {[...transactionsWithBalance]
                                        .sort((a, b) => {
                                          const dateA = new Date(a.date || '1970-01-01');
                                          const dateB = new Date(b.date || '1970-01-01');
                                          return dateB - dateA;
                                        })
                                        .map((trans, index) => (
                                          <TableRow key={trans.id || index} hover>
                                            <TableCell>
                                              <Typography variant="body2">
                                                {formatDate(trans.date)}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              <Chip 
                                                label={trans.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                                                size="small"
                                                color={trans.type === 'deposit' ? 'success' : 'error'}
                                                variant="outlined"
                                                sx={{ fontWeight: 500 }}
                                              />
                                            </TableCell>
                                            <TableCell align="right">
                                              <Typography 
                                                variant="body2" 
                                                fontWeight={600}
                                                color={trans.type === 'deposit' ? '#16a34a' : '#dc2626'}
                                              >
                                                {trans.type === 'deposit' ? '+' : '-'}
                                                {formatCurrency(parseFloat(trans.amount) || 0, currency)}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                                {trans.notes || '-'}
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                              <Typography variant="body2" fontWeight={500} color="textSecondary">
                                                {formatCurrency(trans.balanceAfter || 0, currency)}
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                <Tooltip title="Edit Transaction">
                                                  <IconButton 
                                                    size="small" 
                                                    color="primary"
                                                    onClick={() => handleEditTransaction(saving, trans)}
                                                  >
                                                    <EditIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Transaction">
                                                  <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleDeleteTransaction(saving.id, trans.id)}
                                                  >
                                                    <DeleteIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              </Box>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              ) : (
                                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                                  <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                  <Typography variant="body1" color="textSecondary" gutterBottom>
                                    No transactions recorded yet
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                    Start by adding your first transaction
                                  </Typography>
                                  <Button 
                                    variant="contained" 
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => openTransactionForSaving(saving)}
                                    sx={{ 
                                      bgcolor: '#667eea', 
                                      '&:hover': { bgcolor: '#5a6fd6' } 
                                    }}
                                  >
                                    Add First Transaction
                                  </Button>
                                </Paper>
                              )}
                              
                              {/* Summary at bottom */}
                              <Paper sx={{ mt: 2, p: 2, bgcolor: '#f0f9ff', border: '1px solid #e0f2fe' }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={4}>
                                    <Typography variant="caption" color="textSecondary">Total Transactions</Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                      {stats.transactionCount}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} sm={4}>
                                    <Typography variant="caption" color="textSecondary">Average Deposit</Typography>
                                    <Typography variant="body1" color="#16a34a" fontWeight={600}>
                                      {stats.depositCount > 0 
                                        ? formatCurrency(stats.totalDeposits / stats.depositCount, currency)
                                        : formatCurrency(0, currency)
                                      }
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} sm={4}>
                                    <Typography variant="caption" color="textSecondary">Current Balance</Typography>
                                    <Typography variant="body1" color="#16a34a" fontWeight={700}>
                                      {formatCurrency(currentBalance, currency)}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Paper>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
            )}
          </TableBody>
        </Table>
        {sortedSavings.length > 0 && (
          <TablePagination 
            rowsPerPageOptions={[5, 10, 25]} 
            component="div" 
            count={sortedSavings.length} 
            rowsPerPage={rowsPerPage} 
            page={page}
            onPageChange={(e, p) => setPage(p)} 
            onRowsPerPageChange={(e) => { 
              setRowsPerPage(parseInt(e.target.value)); 
              setPage(0); 
            }} 
          />
        )}
      </TableContainer>

      {/* Add Savings Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BankIcon sx={{ mr: 1, color: '#667eea' }} />
            Add Savings Account
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Account Name" 
                  value={newSaving.accountName} 
                  onChange={(e) => setNewSaving({...newSaving, accountName: e.target.value})} 
                  required 
                  error={!newSaving.accountName.trim()}
                  helperText={!newSaving.accountName.trim() ? "Account name is required" : ""}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Opening Balance" 
                  type="number" 
                  value={newSaving.openingBalance} 
                  onChange={(e) => setNewSaving({...newSaving, openingBalance: e.target.value})}
                  InputProps={{ 
                    startAdornment: <Typography sx={{ mr: 1 }}>{currency}</Typography> 
                  }} 
                  placeholder="0.00"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Bank Name" 
                  value={newSaving.bank} 
                  onChange={(e) => setNewSaving({...newSaving, bank: e.target.value})} 
                  placeholder="e.g., Chase, Bank of America"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Account Notes" 
                  value={newSaving.notes} 
                  onChange={(e) => setNewSaving({...newSaving, notes: e.target.value})} 
                  multiline 
                  rows={3}
                  placeholder="Add any notes about this account..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddSaving} 
            variant="contained" 
            disabled={!newSaving.accountName.trim()}
            sx={{ 
              bgcolor: '#667eea', 
              '&:hover': { bgcolor: '#5a6fd6' },
              '&.Mui-disabled': { bgcolor: '#e2e8f0' }
            }}
          >
            Create Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={openTransactionDialog} onClose={() => setOpenTransactionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {transaction.type === 'deposit' ? 
              <DepositIcon sx={{ mr: 1, color: '#16a34a' }} /> : 
              <WithdrawIcon sx={{ mr: 1, color: '#dc2626' }} />
            }
            {transaction.type === 'deposit' ? 'Add Deposit' : 'Add Withdrawal'} - {selectedSaving?.accountName || 'Unknown Account'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3 }}>
            <Card sx={{ mb: 3, bgcolor: '#f0f9ff', border: '1px solid #e0f2fe' }}>
              <CardContent sx={{ py: 2 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Current Balance</Typography>
                    <Typography variant="h6" color="#16a34a" fontWeight={700}>
                      {selectedSaving && formatCurrency(parseFloat(selectedSaving.currentBalance) || 0, currency)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">After {transaction.type}</Typography>
                    <Typography 
                      variant="h6" 
                      color={transaction.type === 'deposit' ? '#16a34a' : '#dc2626'} 
                      fontWeight={700}
                    >
                      {selectedSaving && transaction.amount ? 
                        formatCurrency(
                          calculateTransactionBalance(
                            parseFloat(selectedSaving.currentBalance) || 0,
                            transaction.type,
                            parseFloat(transaction.amount) || 0
                          ),
                          currency
                        ) : 
                        formatCurrency(parseFloat(selectedSaving?.currentBalance) || 0, currency)
                      }
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Transaction Type</InputLabel>
                  <Select 
                    value={transaction.type} 
                    label="Transaction Type" 
                    onChange={(e) => setTransaction({...transaction, type: e.target.value})}
                  >
                    <MenuItem value="deposit">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DepositIcon sx={{ mr: 1, color: '#16a34a', fontSize: 20 }} />
                        Deposit (Money In)
                      </Box>
                    </MenuItem>
                    <MenuItem value="withdrawal">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WithdrawIcon sx={{ mr: 1, color: '#dc2626', fontSize: 20 }} />
                        Withdrawal (Money Out)
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Amount" 
                  type="number" 
                  value={transaction.amount} 
                  onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
                  InputProps={{ 
                    startAdornment: <Typography sx={{ mr: 1 }}>{currency}</Typography>,
                    inputProps: { step: "0.01", min: "0.01" }
                  }} 
                  required 
                  error={!transaction.amount || parseFloat(transaction.amount) <= 0}
                  helperText={!transaction.amount || parseFloat(transaction.amount) <= 0 ? "Valid amount is required" : ""}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Date" 
                  type="date" 
                  value={transaction.date} 
                  onChange={(e) => setTransaction({...transaction, date: e.target.value})} 
                  InputLabelProps={{ shrink: true }} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Notes" 
                  value={transaction.notes} 
                  onChange={(e) => setTransaction({...transaction, notes: e.target.value})} 
                  multiline 
                  rows={3}
                  placeholder="Add notes about this transaction..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenTransactionDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddTransaction} 
            variant="contained" 
            disabled={!transaction.amount || parseFloat(transaction.amount) <= 0}
            sx={{ 
              bgcolor: transaction.type === 'deposit' ? '#16a34a' : '#dc2626',
              '&:hover': { 
                bgcolor: transaction.type === 'deposit' ? '#15803d' : '#b91c1c' 
              },
              '&.Mui-disabled': { bgcolor: '#e2e8f0' }
            }}
          >
            {transaction.type === 'deposit' ? 'Add Deposit' : 'Add Withdrawal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={openEditTransactionDialog} onClose={() => setOpenEditTransactionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1, color: '#667eea' }} />
            Edit Transaction - {selectedSaving?.accountName || 'Unknown Account'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Original Transaction Date: <strong>{formatDate(selectedTransaction?.date)}</strong>
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Transaction Type</InputLabel>
                  <Select 
                    value={editTransaction.type} 
                    label="Transaction Type" 
                    onChange={(e) => setEditTransaction({...editTransaction, type: e.target.value})}
                  >
                    <MenuItem value="deposit">Deposit</MenuItem>
                    <MenuItem value="withdrawal">Withdrawal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Amount" 
                  type="number" 
                  value={editTransaction.amount} 
                  onChange={(e) => setEditTransaction({...editTransaction, amount: e.target.value})}
                  InputProps={{ 
                    startAdornment: <Typography sx={{ mr: 1 }}>{currency}</Typography> 
                  }} 
                  required 
                  error={!editTransaction.amount || parseFloat(editTransaction.amount) <= 0}
                  helperText={!editTransaction.amount || parseFloat(editTransaction.amount) <= 0 ? "Valid amount is required" : ""}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Date" 
                  type="date" 
                  value={editTransaction.date} 
                  onChange={(e) => setEditTransaction({...editTransaction, date: e.target.value})} 
                  InputLabelProps={{ shrink: true }} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Notes" 
                  value={editTransaction.notes} 
                  onChange={(e) => setEditTransaction({...editTransaction, notes: e.target.value})} 
                  multiline 
                  rows={3}
                  placeholder="Update transaction notes..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenEditTransactionDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateTransaction} 
            variant="contained" 
            disabled={!editTransaction.amount || parseFloat(editTransaction.amount) <= 0}
            sx={{ 
              bgcolor: '#667eea', 
              '&:hover': { bgcolor: '#5a6fd6' },
              '&.Mui-disabled': { bgcolor: '#e2e8f0' }
            }}
          >
            Update Transaction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Savings;