// OwnerWithdrawals.jsx - Responsive Owner Withdrawals Component
import React, { useState } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, TextField, Button, IconButton, Chip, Typography,
  MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Card, CardContent, useTheme, useMediaQuery, InputAdornment,
  Avatar, Divider
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, AccountBalanceWallet as WalletIcon,
  TrendingDown as WithdrawIcon, Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useCashManagement } from '../context/CashManagementContext';
import { formatCurrency } from '../context/CashManagementContext';

const OwnerWithdrawals = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { state, actions, currency } = useCashManagement();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [filterAccount, setFilterAccount] = useState('all');
  
  const [newWithdrawal, setNewWithdrawal] = useState({
    amount: '',
    reason: '',
    account: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const filteredWithdrawals = state.ownerWithdrawals.filter(w => {
    if (filterAccount === 'all') return true;
    return w.account === filterAccount;
  });

  const handleAddWithdrawal = () => {
    if (!newWithdrawal.amount || parseFloat(newWithdrawal.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    actions.addOwnerWithdrawal({
      ...newWithdrawal,
      amount: parseFloat(newWithdrawal.amount)
    });
    setNewWithdrawal({
      amount: '',
      reason: '',
      account: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setOpenDialog(false);
  };

  const handleDeleteWithdrawal = (id) => {
    if (window.confirm('Are you sure you want to delete this withdrawal record?')) {
      actions.deleteTransaction(id);
    }
  };

  const totalWithdrawals = state.ownerWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const cashWithdrawals = state.ownerWithdrawals.filter(w => w.account === 'cash').reduce((sum, w) => sum + w.amount, 0);
  const bankWithdrawals = state.ownerWithdrawals.filter(w => w.account === 'bank').reduce((sum, w) => sum + w.amount, 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="#1e293b">Owner Withdrawals</Typography>
        <Typography variant="body2" color="textSecondary">Track money withdrawn from the business for personal use</Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#fee2e2', border: '1px solid #fecaca' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#dc2626', mr: 1.5 }}><WithdrawIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Total Withdrawals</Typography>
              </Box>
              <Typography variant="h5" color="#dc2626" fontWeight={700}>{formatCurrency(totalWithdrawals, currency)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#dcfce7', border: '1px solid #bbf7d0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#16a34a', mr: 1.5 }}><WalletIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Cash Withdrawals</Typography>
              </Box>
              <Typography variant="h5" color="#16a34a" fontWeight={700}>{formatCurrency(cashWithdrawals, currency)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#dbeafe', border: '1px solid #bfdbfe' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#2563eb', mr: 1.5 }}><ReceiptIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Bank Withdrawals</Typography>
              </Box>
              <Typography variant="h5" color="#2563eb" fontWeight={700}>{formatCurrency(bankWithdrawals, currency)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Account</InputLabel>
          <Select value={filterAccount} label="Account" onChange={(e) => setFilterAccount(e.target.value)}>
            <MenuItem value="all">All Accounts</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="bank">Bank</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5a6fd6' } }}>
          Record Withdrawal
        </Button>
      </Paper>

      {/* Withdrawals Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              {!isMobile && <TableCell>Reason</TableCell>}
              <TableCell>Account</TableCell>
              <TableCell align="right">Amount</TableCell>
              {!isMobile && <TableCell>Notes</TableCell>}
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredWithdrawals.length > 0 ? (
              filteredWithdrawals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((withdrawal) => (
                <TableRow key={withdrawal.id} hover>
                  <TableCell>
                    <Typography variant="body2">{withdrawal.date}</Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{withdrawal.reason || '-'}</Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Chip 
                      label={withdrawal.account === 'cash' ? 'Cash' : 'Bank'} 
                      color={withdrawal.account === 'cash' ? 'success' : 'primary'}
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" fontWeight={600} color="#dc2626">
                      -{formatCurrency(withdrawal.amount, currency)}
                    </Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {withdrawal.notes || '-'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => handleDeleteWithdrawal(withdrawal.id)} title="Delete">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No withdrawals recorded yet</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredWithdrawals.length} rowsPerPage={rowsPerPage} page={page}
          onPageChange={(e, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} />
      </TableContainer>

      {/* Add Withdrawal Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Record Owner Withdrawal</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Amount" type="number" value={newWithdrawal.amount} onChange={(e) => setNewWithdrawal({...newWithdrawal, amount: e.target.value})}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>{currency}</Typography> }} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Account</InputLabel>
                  <Select value={newWithdrawal.account} label="Account" onChange={(e) => setNewWithdrawal({...newWithdrawal, account: e.target.value})}>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="bank">Bank</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Reason" value={newWithdrawal.reason} onChange={(e) => setNewWithdrawal({...newWithdrawal, reason: e.target.value})}
                  placeholder="e.g., Personal expenses, Salary, Investment" required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Date" type="date" value={newWithdrawal.date} onChange={(e) => setNewWithdrawal({...newWithdrawal, date: e.target.value})} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Notes" value={newWithdrawal.notes} onChange={(e) => setNewWithdrawal({...newWithdrawal, notes: e.target.value})} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddWithdrawal} variant="contained" sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>
            Record Withdrawal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OwnerWithdrawals;

