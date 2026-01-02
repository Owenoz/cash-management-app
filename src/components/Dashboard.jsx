// Dashboard.jsx - Main Dashboard with routing
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BalanceOverview from './BalanceOverview';
import Transactions from './Transactions';
import Loans from './Loans';
import Savings from './Savings';
import GoodsDebt from './GoodsDebt';
import OwnerWithdrawals from './OwnerWithdrawals';
import { Box, Typography } from '@mui/material';

const Dashboard = () => {
  return (
    <Box>
      <Routes>
        <Route path="/" element={<BalanceOverview />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/goods-debt" element={<GoodsDebt />} />
        <Route path="/withdrawals" element={<OwnerWithdrawals />} />
        <Route path="*" element={
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h4" color="textSecondary">
              Page not found
            </Typography>
          </Box>
        } />
      </Routes>
    </Box>
  );
};

export default Dashboard;

