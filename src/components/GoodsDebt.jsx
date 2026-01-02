// GoodsDebt.jsx - Complete Fixed Version
import React, { useState } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, TextField, Button, IconButton, Chip, Typography,
  MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Card, CardContent, useTheme, useMediaQuery, InputAdornment,
  Avatar, Divider, LinearProgress, Collapse, TableSortLabel, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, ShoppingCart as GoodsIcon,
  Payment as PaymentIcon, Person as PersonIcon, CheckCircle as PaidIcon,
  ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
  AddShoppingCart as AddGoodsIcon, History as HistoryIcon,
  Phone as PhoneIcon, Email as EmailIcon
} from '@mui/icons-material';
import { useCashManagement } from '../context/CashManagementContext';
import { formatCurrency } from '../context/CashManagementContext';

const GoodsDebt = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { state, actions, currency } = useCashManagement();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openAddMoreDialog, setOpenAddMoreDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'totalAmount', direction: 'desc' });
  
  const [newDebt, setNewDebt] = useState({
    customerName: '',
    itemDescription: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    contactNumber: '',
    email: ''
  });
  
  const [payment, setPayment] = useState({ 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    notes: '',
    applyTo: 'all'
  });

  const [additionalGoods, setAdditionalGoods] = useState({
    itemDescription: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Group debts by customer
  const customersDebts = React.useMemo(() => {
    const customerMap = new Map();
    
    state.goodsDebt.forEach(debt => {
      const customerKey = debt.customerName.toLowerCase().trim();
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: customerKey,
          customerName: debt.customerName,
          contactNumber: debt.contactNumber,
          email: debt.email,
          debts: [],
          totalAmount: 0,
          totalPaid: 0,
          remainingBalance: 0,
          status: 'active',
          lastTransactionDate: debt.date
        });
      }
      
      const customer = customerMap.get(customerKey);
      customer.debts.push(debt);
      customer.totalAmount += debt.totalAmount;
      customer.totalPaid += (debt.totalAmount - debt.remainingBalance);
      customer.remainingBalance += debt.remainingBalance;
      customer.status = customer.remainingBalance > 0 ? 'active' : 'paid';
      
      const debtDate = new Date(debt.date);
      const customerDate = new Date(customer.lastTransactionDate);
      if (debtDate > customerDate) {
        customer.lastTransactionDate = debt.date;
      }
    });
    
    return Array.from(customerMap.values());
  }, [state.goodsDebt]);

  // Sort customers
  const sortedCustomers = React.useMemo(() => {
    const sortableItems = [...customersDebts];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
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
  }, [customersDebts, sortConfig]);

  // Filter customers by status
  const filteredCustomers = sortedCustomers.filter(customer => {
    if (filterStatus === 'all') return true;
    return customer.status === filterStatus;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAddDebt = () => {
    if (!newDebt.customerName || !newDebt.amount) {
      alert('Please fill in required fields');
      return;
    }
    
    const existingCustomer = customersDebts.find(
      c => c.customerName.toLowerCase().trim() === newDebt.customerName.toLowerCase().trim()
    );
    
    const debtData = {
      customerName: newDebt.customerName.trim(),
      itemDescription: newDebt.itemDescription,
      totalAmount: parseFloat(newDebt.amount),
      remainingBalance: parseFloat(newDebt.amount),
      date: newDebt.date,
      dueDate: newDebt.dueDate,
      contactNumber: newDebt.contactNumber,
      email: newDebt.email,
      status: 'active',
      payments: []
    };
    
    actions.addGoodsDebt(debtData);
    
    setNewDebt({ 
      customerName: '', 
      itemDescription: '', 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      dueDate: '', 
      contactNumber: '',
      email: '' 
    });
    setOpenDialog(false);
  };

  const handleAddPayment = () => {
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    
    if (!selectedCustomer) {
      alert('No customer selected');
      return;
    }
    
    // Prepare payment data
    const paymentData = {
      customerId: selectedCustomer.id, // This is the lowercase customer name
      amount: parseFloat(payment.amount),
      date: payment.date,
      notes: payment.notes,
      applyTo: payment.applyTo
    };
    
    console.log('Adding payment:', paymentData);
    
    // Call the context action to add payment
    actions.addGoodsDebtPayment(paymentData);
    
    // Reset form
    setPayment({ 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      notes: '',
      applyTo: 'all'
    });
    setOpenPaymentDialog(false);
    setSelectedCustomer(null);
  };

  const handleAddMoreGoods = () => {
    if (!additionalGoods.amount || parseFloat(additionalGoods.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!selectedCustomer) {
      alert('No customer selected');
      return;
    }
    
    const debtData = {
      customerName: selectedCustomer.customerName,
      itemDescription: additionalGoods.itemDescription,
      totalAmount: parseFloat(additionalGoods.amount),
      remainingBalance: parseFloat(additionalGoods.amount),
      date: additionalGoods.date,
      contactNumber: selectedCustomer.contactNumber,
      email: selectedCustomer.email,
      status: 'active',
      payments: []
    };
    
    actions.addGoodsDebt(debtData);
    
    setAdditionalGoods({
      itemDescription: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setOpenAddMoreDialog(false);
    setSelectedCustomer(null);
    
    alert(`Added ${formatCurrency(debtData.totalAmount, currency)} worth of goods to ${selectedCustomer.customerName}'s debt`);
  };

  const handleDeleteDebt = (debtId) => {
    if (window.confirm('Are you sure you want to delete this debt record?')) {
      actions.deleteGoodsDebt(debtId);
    }
  };

  const openPaymentForCustomer = (customer) => {
    setSelectedCustomer(customer);
    setOpenPaymentDialog(true);
  };

  const openAddMoreForCustomer = (customer) => {
    setSelectedCustomer(customer);
    setOpenAddMoreDialog(true);
  };

  const toggleCustomerExpansion = (customerId) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const getCustomerProgress = (customer) => {
    if (!customer.totalAmount) return 0;
    return ((customer.totalAmount - customer.remainingBalance) / customer.totalAmount) * 100;
  };

  // Calculate statistics
  const totalDebts = customersDebts.reduce((sum, c) => sum + c.totalAmount, 0);
  const activeCustomers = customersDebts.filter(c => c.status === 'active').length;
  const pendingAmount = customersDebts.reduce((sum, c) => sum + c.remainingBalance, 0);
  const totalDebtItems = state.goodsDebt.length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="#1e293b">Goods Debt Management</Typography>
        <Typography variant="body2" color="textSecondary">Track goods given on credit and manage customer debts</Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#dbeafe', border: '1px solid #bfdbfe' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#2563eb', mr: 1.5 }}><PersonIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Total Customers</Typography>
              </Box>
              <Typography variant="h4" color="#2563eb" fontWeight={700}>{customersDebts.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fef3c7', border: '1px solid #fde68a' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#d97706', mr: 1.5 }}><GoodsIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Total Debt</Typography>
              </Box>
              <Typography variant="h4" color="#d97706" fontWeight={700}>{formatCurrency(totalDebts, currency)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fee2e2', border: '1px solid #fecaca' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#dc2626', mr: 1.5 }}><PaymentIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Pending Amount</Typography>
              </Box>
              <Typography variant="h4" color="#dc2626" fontWeight={700}>{formatCurrency(pendingAmount, currency)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#dcfce7', border: '1px solid #bbf7d0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#16a34a', mr: 1.5 }}><HistoryIcon /></Avatar>
                <Typography color="textSecondary" variant="body2">Total Items</Typography>
              </Box>
              <Typography variant="h4" color="#16a34a" fontWeight={700}>{totalDebtItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All Customers</MenuItem>
            <MenuItem value="active">Active Debts</MenuItem>
            <MenuItem value="paid">Paid Off</MenuItem>
          </Select>
        </FormControl>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5a6fd6' } }}
        >
          New Customer Debt
        </Button>
      </Paper>

      {/* Customers Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell width="50px"></TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'customerName'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('customerName')}
                >
                  Customer
                </TableSortLabel>
              </TableCell>
              {!isMobile && <TableCell>Contact</TableCell>}
              <TableCell align="right">
                <TableSortLabel
                  active={sortConfig.key === 'totalAmount'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('totalAmount')}
                >
                  Total Debt
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortConfig.key === 'remainingBalance'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('remainingBalance')}
                >
                  Pending
                </TableSortLabel>
              </TableCell>
              {!isMobile && <TableCell>Progress</TableCell>}
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 5 : 8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No customers with debts found. Add your first customer!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer) => {
                  const isExpanded = expandedCustomer === customer.id;
                  const progress = getCustomerProgress(customer);
                  
                  return (
                    <React.Fragment key={customer.id}>
                      {/* Main Row */}
                      <TableRow hover sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <IconButton size="small" onClick={() => toggleCustomerExpansion(customer.id)}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ 
                              bgcolor: customer.status === 'active' ? '#f59e0b' : '#16a34a', 
                              width: 40, 
                              height: 40, 
                              mr: 1.5, 
                              fontSize: '1rem' 
                            }}>
                              {customer.customerName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {customer.customerName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {customer.debts.length} debt{item(customer.debts.length)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        {!isMobile && (
                          <TableCell>
                            <Box>
                              {customer.contactNumber && (
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PhoneIcon fontSize="small" /> {customer.contactNumber}
                                </Typography>
                              )}
                              {customer.email && (
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <EmailIcon fontSize="small" /> {customer.email}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight={700}>
                            {formatCurrency(customer.totalAmount, currency)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body1" 
                            fontWeight={700}
                            color={customer.remainingBalance > 0 ? '#dc2626' : '#16a34a'}
                          >
                            {formatCurrency(customer.remainingBalance, currency)}
                          </Typography>
                        </TableCell>
                        {!isMobile && (
                          <TableCell>
                            <Box sx={{ minWidth: 120 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={progress} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  bgcolor: '#e5e7eb',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: progress === 100 ? '#16a34a' : '#2563eb'
                                  }
                                }} 
                              />
                              <Typography variant="caption" color="textSecondary">
                                {Math.round(progress)}% paid
                              </Typography>
                            </Box>
                          </TableCell>
                        )}
                        <TableCell>
                          <Chip 
                            label={customer.status === 'active' ? 'Active' : 'Paid'} 
                            color={customer.status === 'active' ? 'warning' : 'success'} 
                            size="small" 
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <Tooltip title="Add More Goods">
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => openAddMoreForCustomer(customer)}
                                disabled={customer.status === 'paid'}
                              >
                                <AddGoodsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Add Payment">
                              <IconButton 
                                size="small" 
                                color="success" 
                                onClick={() => openPaymentForCustomer(customer)}
                                disabled={customer.remainingBalance <= 0}
                              >
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row - Customer's Debt Details */}
                      <TableRow>
                        <TableCell colSpan={isMobile ? 5 : 8} style={{ paddingBottom: 0, paddingTop: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="h6" gutterBottom>
                                Debt Details for {customer.customerName}
                              </Typography>
                              
                              {/* Payment History Summary */}
                              {customer.totalPaid > 0 && (
                                <Card sx={{ mb: 2, bgcolor: '#f0f9ff', border: '1px solid #e0f2fe' }}>
                                  <CardContent sx={{ py: 1.5 }}>
                                    <Grid container spacing={2}>
                                      <Grid item xs={6} sm={3}>
                                        <Typography variant="caption" color="textSecondary">Total Paid</Typography>
                                        <Typography variant="body1" color="#16a34a" fontWeight={600}>
                                          {formatCurrency(customer.totalPaid, currency)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <Typography variant="caption" color="textSecondary">Remaining</Typography>
                                        <Typography variant="body1" color="#dc2626" fontWeight={600}>
                                          {formatCurrency(customer.remainingBalance, currency)}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <Typography variant="caption" color="textSecondary">Total Items</Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                          {customer.debts.length}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <Typography variant="caption" color="textSecondary">Progress</Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                          {Math.round(progress)}%
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  </CardContent>
                                </Card>
                              )}
                              
                              {/* Debt Items Table */}
                              {customer.debts.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                  <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                      <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Item Description</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell align="right">Paid</TableCell>
                                        <TableCell align="right">Pending</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {customer.debts.map((debt) => (
                                        <TableRow key={debt.id} hover>
                                          <TableCell>
                                            <Typography variant="body2">{debt.date}</Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">{debt.itemDescription || 'Goods'}</Typography>
                                            {debt.notes && (
                                              <Typography variant="caption" color="textSecondary" display="block">
                                                {debt.notes}
                                              </Typography>
                                            )}
                                          </TableCell>
                                          <TableCell align="right">
                                            <Typography variant="body2" fontWeight={500}>
                                              {formatCurrency(debt.totalAmount, currency)}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="right">
                                            <Typography variant="body2" color="#16a34a">
                                              {formatCurrency(debt.totalAmount - debt.remainingBalance, currency)}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="right">
                                            <Typography variant="body2" color="#dc2626">
                                              {formatCurrency(debt.remainingBalance, currency)}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Chip 
                                              label={debt.remainingBalance > 0 ? 'Active' : 'Paid'} 
                                              size="small"
                                              variant="outlined"
                                              color={debt.remainingBalance > 0 ? 'warning' : 'success'}
                                            />
                                          </TableCell>
                                          <TableCell align="center">
                                            <IconButton 
                                              size="small" 
                                              color="error" 
                                              onClick={() => handleDeleteDebt(debt.id)}
                                              title="Delete this debt item"
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              ) : (
                                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', mb: 2 }}>
                                  <Typography color="textSecondary">
                                    No debt items found for this customer
                                  </Typography>
                                </Paper>
                              )}
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
        {filteredCustomers.length > 0 && (
          <TablePagination 
            rowsPerPageOptions={[5, 10, 25]} 
            component="div" 
            count={filteredCustomers.length} 
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

      {/* Add New Customer Debt Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          Add New Customer Debt
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Customer Name" 
                  value={newDebt.customerName} 
                  onChange={(e) => setNewDebt({...newDebt, customerName: e.target.value})} 
                  required 
                  error={!newDebt.customerName.trim()}
                  helperText={!newDebt.customerName.trim() ? "Customer name is required" : ""}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Item Description" 
                  value={newDebt.itemDescription} 
                  onChange={(e) => setNewDebt({...newDebt, itemDescription: e.target.value})} 
                  required 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Amount" 
                  type="number" 
                  value={newDebt.amount} 
                  onChange={(e) => setNewDebt({...newDebt, amount: e.target.value})}
                  InputProps={{ 
                    startAdornment: <Typography sx={{ mr: 1 }}>{currency}</Typography> 
                  }} 
                  required 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Date" 
                  type="date" 
                  value={newDebt.date} 
                  onChange={(e) => setNewDebt({...newDebt, date: e.target.value})} 
                  InputLabelProps={{ shrink: true }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Contact Number" 
                  value={newDebt.contactNumber} 
                  onChange={(e) => setNewDebt({...newDebt, contactNumber: e.target.value})} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Email" 
                  type="email"
                  value={newDebt.email} 
                  onChange={(e) => setNewDebt({...newDebt, email: e.target.value})} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Due Date" 
                  type="date" 
                  value={newDebt.dueDate} 
                  onChange={(e) => setNewDebt({...newDebt, dueDate: e.target.value})} 
                  InputLabelProps={{ shrink: true }} 
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddDebt} 
            variant="contained" 
            disabled={!newDebt.customerName.trim() || !newDebt.amount}
            sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5a6fd6' } }}
          >
            Add Debt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          Add Payment - {selectedCustomer?.customerName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Total Pending: <strong>{formatCurrency(selectedCustomer?.remainingBalance || 0, currency)}</strong>
            </Typography>
            
            {selectedCustomer?.debts && selectedCustomer.debts.filter(d => d.remainingBalance > 0).length > 1 && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Apply Payment To</InputLabel>
                <Select 
                  value={payment.applyTo} 
                  label="Apply Payment To"
                  onChange={(e) => setPayment({...payment, applyTo: e.target.value})}
                >
                  <MenuItem value="all">All Debts (Proportionally)</MenuItem>
                  {selectedCustomer.debts.filter(d => d.remainingBalance > 0).map(debt => (
                    <MenuItem key={debt.id} value={debt.id}>
                      {debt.itemDescription || 'Goods'} - {formatCurrency(debt.remainingBalance, currency)} pending
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <TextField 
              fullWidth 
              label="Payment Amount" 
              type="number" 
              value={payment.amount} 
              onChange={(e) => setPayment({...payment, amount: e.target.value})}
              InputProps={{ 
                startAdornment: <Typography sx={{ mr: 1 }}>{currency}</Typography>,
                endAdornment: selectedCustomer && (
                  <InputAdornment position="end">
                    <Button 
                      size="small" 
                      onClick={() => setPayment({...payment, amount: selectedCustomer.remainingBalance.toString()})}
                    >
                      Full Amount
                    </Button>
                  </InputAdornment>
                )
              }} 
              sx={{ mb: 2 }} 
              required 
              error={selectedCustomer && parseFloat(payment.amount) > selectedCustomer.remainingBalance}
              helperText={selectedCustomer && parseFloat(payment.amount) > selectedCustomer.remainingBalance 
                ? `Payment cannot exceed ${formatCurrency(selectedCustomer.remainingBalance, currency)}` 
                : ""}
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
              multiline 
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPayment} 
            variant="contained" 
            disabled={!payment.amount || parseFloat(payment.amount) <= 0 || 
                     (selectedCustomer && parseFloat(payment.amount) > selectedCustomer.remainingBalance)}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            Add Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add More Goods Dialog */}
      <Dialog open={openAddMoreDialog} onClose={() => setOpenAddMoreDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          Add More Goods - {selectedCustomer?.customerName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Customer currently has {selectedCustomer?.debts?.length || 0} active debt{item(selectedCustomer?.debts?.length || 0)}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Item Description" 
                  value={additionalGoods.itemDescription} 
                  onChange={(e) => setAdditionalGoods({...additionalGoods, itemDescription: e.target.value})} 
                  required 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Amount" 
                  type="number" 
                  value={additionalGoods.amount} 
                  onChange={(e) => setAdditionalGoods({...additionalGoods, amount: e.target.value})}
                  InputProps={{ 
                    startAdornment: <Typography sx={{ mr: 1 }}>{currency}</Typography> 
                  }} 
                  required 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Date" 
                  type="date" 
                  value={additionalGoods.date} 
                  onChange={(e) => setAdditionalGoods({...additionalGoods, date: e.target.value})} 
                  InputLabelProps={{ shrink: true }} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Notes" 
                  value={additionalGoods.notes} 
                  onChange={(e) => setAdditionalGoods({...additionalGoods, notes: e.target.value})} 
                  multiline 
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenAddMoreDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddMoreGoods} 
            variant="contained" 
            disabled={!additionalGoods.amount || parseFloat(additionalGoods.amount) <= 0}
            sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
          >
            Add Goods
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper function for pluralization
const item = (count) => count === 1 ? '' : 's';

export default GoodsDebt;