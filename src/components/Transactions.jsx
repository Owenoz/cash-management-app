// Transactions.jsx - Responsive Transactions Management
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Avatar,
  Tooltip,
  Menu
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  MoreVert as MoreIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useCashManagement } from '../context/CashManagementContext';
import { formatCurrency } from '../context/CashManagementContext';

const Transactions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { state, actions, currency } = useCashManagement();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'income',
    account: 'cash',
    date: new Date().toISOString().split('T')[0],
    category: ''
  });

  // Filter transactions
  const filteredTransactions = state.transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(search.toLowerCase()) ||
                         transaction.category?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesAccount = filterAccount === 'all' || transaction.account === filterAccount;
    return matchesSearch && matchesType && matchesAccount;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount || isNaN(newTransaction.amount)) {
      alert('Please fill all required fields with valid data');
      return;
    }

    actions.addTransaction({
      ...newTransaction,
      amount: parseFloat(newTransaction.amount)
    });

    setNewTransaction({
      description: '',
      amount: '',
      type: 'income',
      account: 'cash',
      date: new Date().toISOString().split('T')[0],
      category: ''
    });
    setOpenDialog(false);
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      actions.deleteTransaction(id);
    }
    setAnchorEl(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Description', 'Type', 'Account', 'Amount', 'Category'],
      ...filteredTransactions.map(t => [
        t.date,
        t.description,
        t.type,
        t.account,
        t.amount,
        t.category || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterAccount('all');
    setSearch('');
  };

  // Calculate summary
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netCashFlow = totalIncome - totalExpense;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="#1e293b">
          Cash Book Transactions
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Track and manage all your income and expenses
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#dcfce7', border: '1px solid #bbf7d0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#16a34a', mr: 1.5 }}>
                  <IncomeIcon />
                </Avatar>
                <Typography color="textSecondary" variant="body2">
                  Total Income
                </Typography>
              </Box>
              <Typography variant="h5" color="#16a34a" fontWeight={700}>
                {formatCurrency(totalIncome, currency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#fee2e2', border: '1px solid #fecaca' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#dc2626', mr: 1.5 }}>
                  <ExpenseIcon />
                </Avatar>
                <Typography color="textSecondary" variant="body2">
                  Total Expense
                </Typography>
              </Box>
              <Typography variant="h5" color="#dc2626" fontWeight={700}>
                {formatCurrency(totalExpense, currency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: netCashFlow >= 0 ? '#dbeafe' : '#fef3c7', border: netCashFlow >= 0 ? '1px solid #bfdbfe' : '1px solid #fde68a' }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Net Cash Flow
              </Typography>
              <Typography 
                variant="h5" 
                fontWeight={700}
                color={netCashFlow >= 0 ? '#2563eb' : '#d97706'}
              >
                {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow, currency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                label="Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Account</InputLabel>
              <Select
                value={filterAccount}
                label="Account"
                onChange={(e) => setFilterAccount(e.target.value)}
              >
                <MenuItem value="all">All Accounts</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank">Bank</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={clearFilters}
            >
              Clear
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5a6fd6' } }}
            >
              Add Transaction
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              {!isMobile && <TableCell>Description</TableCell>}
              <TableCell>Type</TableCell>
              {!isMobile && <TableCell>Account</TableCell>}
              {!isMobile && <TableCell>Category</TableCell>}
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    <Typography variant="body2">{transaction.date}</Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {transaction.description}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Chip
                      label={transaction.type === 'income' ? 'Income' : 'Expense'}
                      color={transaction.type === 'income' ? 'success' : 'error'}
                      size="small"
                      icon={transaction.type === 'income' ? <IncomeIcon /> : <ExpenseIcon />}
                    />
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Chip
                        label={transaction.account === 'cash' ? 'Cash' : 'Bank'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell>
                      {transaction.category && (
                        <Chip label={transaction.category} size="small" variant="outlined" />
                      )}
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color={transaction.type === 'income' ? '#16a34a' : '#dc2626'}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount, currency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add Transaction Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          Add New Transaction
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({
                    ...newTransaction,
                    description: e.target.value
                  })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({
                    ...newTransaction,
                    amount: e.target.value
                  })}
                  required
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>{currency}</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newTransaction.type}
                    label="Type"
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      type: e.target.value
                    })}
                  >
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={newTransaction.account}
                    label="Account"
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      account: e.target.value
                    })}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="bank">Bank</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({
                    ...newTransaction,
                    date: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category (Optional)"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({
                    ...newTransaction,
                    category: e.target.value
                  })}
                  placeholder="e.g., Salary, Rent, Supplies"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddTransaction} 
            variant="contained"
            sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5a6fd6' } }}
          >
            Add Transaction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions;

