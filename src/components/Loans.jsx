// Loans.jsx - Responsive Loans Management Component
import React, { useState } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, TextField, Button, IconButton, Chip, Typography,
  MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Card, CardContent, useTheme, useMediaQuery, InputAdornment,
  Avatar, Divider, LinearProgress
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Payment as PaymentIcon,
  AttachMoney as MoneyIcon, Person as PersonIcon, CalendarToday as CalendarIcon,
  TrendingDown as PendingIcon, CheckCircle as PaidIcon
} from '@mui/icons-material';
import { useCashManagement } from '../context/CashManagementContext';
import { formatCurrency } from '../context/CashManagementContext';

// Safe fallback formatCurrency function
const safeFormatCurrency = (amount, currency = '₹') => {
  if (amount === undefined || amount === null || amount === '') {
    return `${currency} 0.00`;
  }
  const num = parseFloat(amount);
  if (isNaN(num)) {
    return `${currency} 0.00`;
  }
  return `${currency} ${num.toFixed(2)}`;
};

const Loans = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { state, actions, currency } = useCashManagement();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [newLoan, setNewLoan] = useState({
    personName: '',
    amount: '',
    interestRate: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: ''
  });
  
  const [payment, setPayment] = useState({ 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    notes: '' 
  });

  const filteredLoans = (state.loans || []).filter(loan => {
    if (!loan) return false;
    if (filterStatus === 'all') return true;
    return loan.status === filterStatus;
  });

  const handleAddLoan = () => {
    if (!newLoan.personName || !newLoan.amount) {
      alert('Please fill in required fields');
      return;
    }
    actions.addLoan({
      ...newLoan,
      amount: parseFloat(newLoan.amount) || 0,
      interestRate: parseFloat(newLoan.interestRate) || 0
    });
    setNewLoan({ 
      personName: '', 
      amount: '', 
      interestRate: '', 
      date: new Date().toISOString().split('T')[0], 
      dueDate: '', 
      description: '' 
    });
    setOpenDialog(false);
  };

  const handleAddPayment = () => {
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    if (!selectedLoan?.id) {
      alert('No loan selected');
      return;
    }
    actions.addLoanInstallment(selectedLoan.id, {
      ...payment,
      amount: parseFloat(payment.amount) || 0
    });
    setPayment({ 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      notes: '' 
    });
    setOpenPaymentDialog(false);
    setSelectedLoan(null);
  };

  const handleDeleteLoan = (id) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      actions.deleteLoan(id);
    }
  };

  const openPaymentForLoan = (loan) => {
    if (!loan?.id) {
      alert('Invalid loan');
      return;
    }
    setSelectedLoan(loan);
    setOpenPaymentDialog(true);
  };

  const getLoanProgress = (loan) => {
    if (!loan || !loan.totalAmount) return 0;
    const remaining = parseFloat(loan.remainingBalance) || 0;
    const total = parseFloat(loan.totalAmount) || 0;
    if (total <= 0) return 0;
    return ((total - remaining) / total) * 100;
  };

  const totalLoans = (state.loans || []).reduce((sum, l) => {
    if (!l) return sum;
    return sum + (parseFloat(l.totalAmount) || 0);
  }, 0);
  
  const activeLoans = (state.loans || []).filter(l => l?.status === 'active').length;
  
  const pendingAmount = (state.loans || []).reduce((sum, l) => {
    if (!l) return sum;
    return sum + (parseFloat(l.remainingBalance) || 0);
  }, 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="#1e293b">Loans Management</Typography>
        <Typography variant="body2" color="textSecondary">Track loans given to others and payments received</Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#dbeafe', border: '1px solid #bfdbfe' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#2563eb', mr: 1.5 }}><MoneyIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Total Loans</Typography>
              </Box>
              <Typography variant="h5" color="#2563eb" fontWeight={700}>
                {safeFormatCurrency(totalLoans, currency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#fef3c7', border: '1px solid #fde68a' }}>
            <CardContent>
              <Box sx={{ display: '-flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#d97706', mr: 1.5 }}><PendingIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Pending Amount</Typography>
              </Box>
              <Typography variant="h5" color="#d97706" fontWeight={700}>
                {safeFormatCurrency(pendingAmount, currency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#dcfce7', border: '1px solid #bbf7d0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#16a34a', mr: 1.5 }}><PaidIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Active Loans</Typography>
              </Box>
              <Typography variant="h5" color="#16a34a" fontWeight={700}>{activeLoans}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select 
            value={filterStatus} 
            label="Status" 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All Loans</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
          </Select>
        </FormControl>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpenDialog(true)}
          sx={{ 
            bgcolor: '#667eea', 
            '&:hover': { bgcolor: '#5a6fd6' } 
          }}
        >
          Add New Loan
        </Button>
      </Paper>

      {/* Loans Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>Person</TableCell>
              <TableCell>Date</TableCell>
              {!isMobile && <TableCell>Due Date</TableCell>}
              <TableCell align="right">Amount</TableCell>
              {!isMobile && <TableCell>Progress</TableCell>}
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 6 : 7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No loans found. Add your first loan!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLoans
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((loan) => (
                  <TableRow key={loan?.id || Math.random()} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ 
                          bgcolor: '#667eea', 
                          width: 36, 
                          height: 36, 
                          mr: 1.5, 
                          fontSize: '0.9rem' 
                        }}>
                          {loan?.personName?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {loan?.personName || 'Unknown Person'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{loan?.date || '-'}</Typography>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Typography variant="body2">{loan?.dueDate || '-'}</Typography>
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight={600}>
                        {safeFormatCurrency(loan?.totalAmount || 0, currency)}
                      </Typography>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Box sx={{ minWidth: 100 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={getLoanProgress(loan)} 
                            sx={{ height: 8, borderRadius: 4 }} 
                          />
                          <Typography variant="caption" color="textSecondary">
                            {safeFormatCurrency(
                              (parseFloat(loan?.totalAmount) || 0) - (parseFloat(loan?.remainingBalance) || 0), 
                              currency
                            )} / {safeFormatCurrency(loan?.totalAmount || 0, currency)}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip 
                        label={loan?.status === 'active' ? 'Active' : 'Paid'} 
                        color={loan?.status === 'active' ? 'warning' : 'success'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {loan?.status === 'active' && (
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => openPaymentForLoan(loan)} 
                            title="Add Payment"
                          >
                            <PaymentIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteLoan(loan?.id)} 
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        {filteredLoans.length > 0 && (
          <TablePagination 
            rowsPerPageOptions={[5, 10, 25]} 
            component="div" 
            count={filteredLoans.length} 
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

      {/* Add Loan Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          Add New Loan
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Person Name" 
                  value={newLoan.personName} 
                  onChange={(e) => setNewLoan({...newLoan, personName: e.target.value})} 
                  required 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Amount" 
                  type="number" 
                  value={newLoan.amount} 
                  onChange={(e) => setNewLoan({...newLoan, amount: e.target.value})}
                  InputProps={{ 
                    startAdornment: <Typography sx={{ mr: 1 }}>{currency}</Typography> 
                  }} 
                  required 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Interest Rate (%)" 
                  type="number" 
                  value={newLoan.interestRate} 
                  onChange={(e) => setNewLoan({...newLoan, interestRate: e.target.value})} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Date" 
                  type="date" 
                  value={newLoan.date} 
                  onChange={(e) => setNewLoan({...newLoan, date: e.target.value})} 
                  InputLabelProps={{ shrink: true }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Due Date" 
                  type="date" 
                  value={newLoan.dueDate} 
                  onChange={(e) => setNewLoan({...newLoan, dueDate: e.target.value})} 
                  InputLabelProps={{ shrink: true }} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Description" 
                  value={newLoan.description} 
                  onChange={(e) => setNewLoan({...newLoan, description: e.target.value})} 
                  multiline 
                  rows={2} 
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddLoan} 
            variant="contained" 
            sx={{ 
              bgcolor: '#667eea', 
              '&:hover': { bgcolor: '#5a6fd6' } 
            }}
          >
            Add Loan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          Add Payment - {selectedLoan?.personName || 'Unknown Person'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Remaining Balance: <strong>
                {selectedLoan && safeFormatCurrency(selectedLoan.remainingBalance || 0, currency)}
              </strong>
            </Typography>
            <TextField 
              fullWidth 
              label="Payment Amount" 
              type="number" 
              value={payment.amount} 
              onChange={(e) => setPayment({...payment, amount: e.target.value})}
              InputProps={{ 
                startAdornment: <Typography sx={{ mr: 1 }}>{currency}</Typography> 
              }} 
              sx={{ mb: 2 }} 
              required 
            />
            <TextField 
              fullWidth 
              label="Date" 
              type="date" 
              value={payment.date} 
              onChange={(e) => setPayment({...payment, date: e.target.value})} 
              InputLabelProps={{ shrink: true }} 
              sx={{ mb: 2 }} 
            />
            <TextField 
              fullWidth 
              label="Notes" 
              value={payment.notes} 
              onChange={(e) => setPayment({...payment, notes: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPayment} 
            variant="contained" 
            sx={{ 
              bgcolor: '#16a34a', 
              '&:hover': { bgcolor: '#15803d' } 
            }}
          >
            Add Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Loans;