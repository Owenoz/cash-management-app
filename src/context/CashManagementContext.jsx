// CashManagementContext.jsx - Complete Fixed Version
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Initial state
const initialState = {
  balance: {
    bank: 0,
    cash: 0,
    total: 0
  },
  transactions: [],
  loans: [],
  savings: [],
  goodsDebt: [],
  ownerWithdrawals: [],
  settings: {
    currency: '₹',
    dateFormat: 'DD/MM/YYYY'
  },
  isLoaded: false,
  isSyncing: false,
  lastSynced: null
};

// Action types
const actionTypes = {
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  ADD_LOAN: 'ADD_LOAN',
  ADD_LOAN_INSTALLMENT: 'ADD_LOAN_INSTALLMENT',
  ADD_SAVING: 'ADD_SAVING',
  ADD_SAVING_TRANSACTION: 'ADD_SAVING_TRANSACTION',
  ADD_GOODS_DEBT: 'ADD_GOODS_DEBT',
  ADD_GOODS_DEBT_PAYMENT: 'ADD_GOODS_DEBT_PAYMENT',
  ADD_OWNER_WITHDRAWAL: 'ADD_OWNER_WITHDRAWAL',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
  DELETE_LOAN: 'DELETE_LOAN',
  DELETE_SAVING: 'DELETE_SAVING',
  DELETE_GOODS_DEBT: 'DELETE_GOODS_DEBT',
  DELETE_SAVING_TRANSACTION: 'DELETE_SAVING_TRANSACTION',
  UPDATE_SAVING_TRANSACTION: 'UPDATE_SAVING_TRANSACTION',
  LOAD_DATA: 'LOAD_DATA',
  RESET_DATA: 'RESET_DATA',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_LOADING: 'SET_LOADING',
  SET_SYNCING: 'SET_SYNCING',
  SET_LAST_SYNCED: 'SET_LAST_SYNCED'
};

// Reducer
function cashManagementReducer(state, action) {
  console.log('🔄 Reducer action:', action.type, action.payload);
  
  switch (action.type) {
    case actionTypes.ADD_TRANSACTION:
      const newTransaction = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        date: action.payload.date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      
      const updatedBalance = { ...state.balance };
      if (newTransaction.type === 'income') {
        if (newTransaction.account === 'bank') {
          updatedBalance.bank += newTransaction.amount;
        } else {
          updatedBalance.cash += newTransaction.amount;
        }
      } else {
        if (newTransaction.account === 'bank') {
          updatedBalance.bank -= newTransaction.amount;
        } else {
          updatedBalance.cash -= newTransaction.amount;
        }
      }
      updatedBalance.total = updatedBalance.bank + updatedBalance.cash;
      
      return {
        ...state,
        balance: updatedBalance,
        transactions: [newTransaction, ...state.transactions]
      };

    case actionTypes.ADD_LOAN:
      const loanAmount = parseFloat(action.payload.amount) || 0;
      const newLoan = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        date: action.payload.date || new Date().toISOString().split('T')[0],
        amount: loanAmount,
        installments: [],
        totalAmount: loanAmount,
        remainingBalance: loanAmount,
        status: 'active',
        isPaid: false
      };
      
      console.log('📝 Created new loan:', newLoan);
      
      return {
        ...state,
        loans: [newLoan, ...state.loans]
      };

    case actionTypes.ADD_LOAN_INSTALLMENT:
      console.log('💰 Processing installment for loan:', action.payload.loanId);
      
      return {
        ...state,
        loans: state.loans.map(loan => {
          if (loan.id === action.payload.loanId) {
            console.log('🎯 Found loan to update:', loan);
            
            const installment = {
              id: Date.now().toString(),
              amount: parseFloat(action.payload.amount) || 0,
              date: action.payload.date || new Date().toISOString().split('T')[0],
              notes: action.payload.notes || '',
              timestamp: new Date().toISOString()
            };
            
            const updatedInstallments = [...(loan.installments || []), installment];
            const totalPaid = updatedInstallments.reduce((sum, inst) => sum + inst.amount, 0);
            const remainingBalance = Math.max(0, (loan.totalAmount || loan.amount || 0) - totalPaid);
            
            const updatedLoan = {
              ...loan,
              installments: updatedInstallments,
              remainingBalance: remainingBalance,
              status: remainingBalance <= 0 ? 'paid' : 'active',
              isPaid: remainingBalance <= 0
            };
            
            console.log('✅ Updated loan after payment:', updatedLoan);
            return updatedLoan;
          }
          return loan;
        })
      };

    case actionTypes.ADD_SAVING:
      const newSaving = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        date: action.payload.date || new Date().toISOString().split('T')[0],
        transactions: [],
        currentBalance: action.payload.openingBalance || 0,
        status: 'active'
      };
      return {
        ...state,
        savings: [newSaving, ...state.savings]
      };

    case actionTypes.ADD_SAVING_TRANSACTION:
      return {
        ...state,
        savings: state.savings.map(saving => {
          if (saving.id === action.payload.savingId) {
            const transaction = {
              ...action.payload,
              id: action.payload.id || Date.now().toString(),
              date: action.payload.date || new Date().toISOString().split('T')[0]
            };
            
            const updatedTransactions = [...(saving.transactions || []), transaction];
            const currentBalance = updatedTransactions.reduce((sum, t) => {
              return sum + (t.type === 'deposit' ? t.amount : -t.amount);
            }, saving.openingBalance || 0);
            
            return {
              ...saving,
              transactions: updatedTransactions,
              currentBalance,
              lastUpdated: new Date().toISOString()
            };
          }
          return saving;
        })
      };

    case actionTypes.DELETE_SAVING_TRANSACTION:
      return {
        ...state,
        savings: state.savings.map(saving => {
          if (saving.id === action.payload.savingId) {
            const updatedTransactions = (saving.transactions || []).filter(
              transaction => transaction.id !== action.payload.transactionId
            );
            
            const currentBalance = updatedTransactions.reduce((sum, t) => {
              return sum + (t.type === 'deposit' ? t.amount : -t.amount);
            }, saving.openingBalance || 0);
            
            return {
              ...saving,
              transactions: updatedTransactions,
              currentBalance,
              lastUpdated: new Date().toISOString()
            };
          }
          return saving;
        })
      };

    case actionTypes.UPDATE_SAVING_TRANSACTION:
      return {
        ...state,
        savings: state.savings.map(saving => {
          if (saving.id === action.payload.savingId) {
            const updatedTransactions = (saving.transactions || []).map(transaction => {
              if (transaction.id === action.payload.transactionId) {
                return {
                  ...transaction,
                  ...action.payload.updates,
                  updatedAt: new Date().toISOString()
                };
              }
              return transaction;
            });
            
            const currentBalance = updatedTransactions.reduce((sum, t) => {
              return sum + (t.type === 'deposit' ? t.amount : -t.amount);
            }, saving.openingBalance || 0);
            
            return {
              ...saving,
              transactions: updatedTransactions,
              currentBalance,
              lastUpdated: new Date().toISOString()
            };
          }
          return saving;
        })
      };

    case actionTypes.ADD_GOODS_DEBT:
      const newGoodsDebt = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        date: action.payload.date || new Date().toISOString().split('T')[0],
        payments: [],
        remainingBalance: action.payload.totalAmount,
        isPaid: false,
        status: 'active'
      };
      return {
        ...state,
        goodsDebt: [newGoodsDebt, ...state.goodsDebt]
      };

    case actionTypes.ADD_GOODS_DEBT_PAYMENT:
      return {
        ...state,
        goodsDebt: action.payload.updatedDebts
      };

    case actionTypes.ADD_OWNER_WITHDRAWAL:
      const newWithdrawal = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        date: action.payload.date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      
      const balanceAfterWithdrawal = { ...state.balance };
      if (newWithdrawal.account === 'bank') {
        balanceAfterWithdrawal.bank -= newWithdrawal.amount;
      } else {
        balanceAfterWithdrawal.cash -= newWithdrawal.amount;
      }
      balanceAfterWithdrawal.total = balanceAfterWithdrawal.bank + balanceAfterWithdrawal.cash;
      
      return {
        ...state,
        balance: balanceAfterWithdrawal,
        ownerWithdrawals: [newWithdrawal, ...state.ownerWithdrawals]
      };

    case actionTypes.DELETE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      };

    case actionTypes.DELETE_LOAN:
      console.log('🗑️ Deleting loan:', action.payload);
      return {
        ...state,
        loans: state.loans.filter(loan => loan.id !== action.payload)
      };

    case actionTypes.DELETE_SAVING:
      return {
        ...state,
        savings: state.savings.filter(saving => saving.id !== action.payload)
      };

    case actionTypes.DELETE_GOODS_DEBT:
      return {
        ...state,
        goodsDebt: state.goodsDebt.filter(debt => debt.id !== action.payload)
      };

    case actionTypes.LOAD_DATA:
      console.log('📂 Loading data:', action.payload);
      
      // Normalize loan data when loading
      const loadedLoans = (action.payload.loans || []).map(loan => ({
        ...loan,
        amount: parseFloat(loan.amount) || 0,
        totalAmount: loan.totalAmount || loan.amount || 0,
        remainingBalance: loan.remainingBalance || loan.amount || 0,
        installments: loan.installments || [],
        status: loan.status || (loan.remainingBalance <= 0 ? 'paid' : 'active'),
        isPaid: loan.isPaid || (loan.remainingBalance <= 0)
      }));
      
      return {
        ...action.payload,
        loans: loadedLoans,
        balance: {
          ...action.payload.balance,
          total: (action.payload.balance?.bank || 0) + (action.payload.balance?.cash || 0)
        },
        isLoaded: true
      };

    case actionTypes.RESET_DATA:
      return { ...initialState, isLoaded: true };

    case actionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoaded: action.payload
      };

    case actionTypes.SET_SYNCING:
      return {
        ...state,
        isSyncing: action.payload
      };

    case actionTypes.SET_LAST_SYNCED:
      return {
        ...state,
        lastSynced: action.payload
      };

    default:
      return state;
  }
}

// Context
const CashManagementContext = createContext();

// Helper function
const formatCurrency = (amount, currency = '₹') => {
  if (amount === undefined || amount === null || amount === '') {
    return `${currency}0.00`;
  }
  const num = parseFloat(amount);
  if (isNaN(num)) {
    return `${currency}0.00`;
  }
  return `${currency}${num.toFixed(2)}`;
};

// Provider
export function CashManagementProvider({ children }) {
  const [state, dispatch] = useReducer(cashManagementReducer, initialState);
  const [currentUser, setCurrentUser] = React.useState(null);
  const currentUserRef = React.useRef(null);
  const unsubscribeRef = React.useRef(null);

  // Update ref when currentUser changes
  React.useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Listen for auth state changes
  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('👤 Auth state changed:', user?.uid);
      setCurrentUser(user);
      if (user) {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeRef.current = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.data) {
              dispatch({ type: actionTypes.LOAD_DATA, payload: userData.data });
            }
          }
        }, (error) => {
          console.error('Real-time sync error:', error);
          loadLocalData();
        });
        
        loadUserData(user.uid);
      } else {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        loadLocalData();
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      unsubscribe();
    };
  }, []);

  // Load data from localStorage
  const loadLocalData = useCallback(() => {
    try {
      const savedData = localStorage.getItem('cashManagementData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: actionTypes.LOAD_DATA, payload: parsedData });
      } else {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
    }
  }, []);

  // Load user data from Firestore
  const loadUserData = useCallback(async (userId) => {
    dispatch({ type: actionTypes.SET_SYNCING, payload: true });
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        dispatch({ type: actionTypes.LOAD_DATA, payload: userData.data || {} });
      } else {
        loadLocalData();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      loadLocalData();
    } finally {
      dispatch({ type: actionTypes.SET_SYNCING, payload: false });
    }
  }, [loadLocalData]);

  // Save data to localStorage
  const saveToLocalStorage = useCallback((data) => {
    try {
      console.log('💾 Saving to localStorage:', data);
      localStorage.setItem('cashManagementData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  // Save data to Firestore
  const saveToFirestore = useCallback(async (userId, data) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        data: data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      dispatch({ type: actionTypes.SET_LAST_SYNCED, payload: new Date().toISOString() });
    } catch (error) {
      console.error('Error saving to Firestore:', error);
    }
  }, []);

  // Save data
  const saveData = useCallback((newState) => {
    console.log('💿 Saving data:', newState);
    saveToLocalStorage(newState);
    
    if (currentUserRef.current) {
      saveToFirestore(currentUserRef.current.uid, newState);
    }
  }, [saveToLocalStorage, saveToFirestore]);

  // Enhanced actions
  const actions = {
    addTransaction: (transaction) => {
      const newTransaction = {
        ...transaction,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      dispatch({ type: actionTypes.ADD_TRANSACTION, payload: newTransaction });
      saveData({ ...state, transactions: [newTransaction, ...state.transactions] });
    },
    
    // FIXED: Correct addLoan with all required fields
    addLoan: (loan) => {
      const loanAmount = parseFloat(loan.amount) || 0;
      
      const newLoan = {
        ...loan,
        id: Date.now().toString(),
        date: loan.date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        amount: loanAmount,
        interestRate: parseFloat(loan.interestRate) || 0,
        totalAmount: loanAmount,
        remainingBalance: loanAmount,
        installments: [],
        status: 'active',
        isPaid: false
      };
      
      console.log('➕ Adding loan:', newLoan);
      dispatch({ type: actionTypes.ADD_LOAN, payload: newLoan });
      
      const updatedState = {
        ...state,
        loans: [newLoan, ...state.loans]
      };
      saveData(updatedState);
      
      return newLoan.id;
    },
    
    // FIXED: Correct addLoanInstallment - this was the main issue
    addLoanInstallment: (loanId, installment) => {
      console.log('💰 Adding installment for loan:', loanId, installment);
      
      if (!loanId) {
        console.error('No loanId provided');
        alert('Error: No loan selected');
        return false;
      }
      
      const paymentAmount = parseFloat(installment.amount) || 0;
      if (!paymentAmount || paymentAmount <= 0) {
        alert('Please enter a valid payment amount');
        return false;
      }
      
      // Find the loan first to validate
      const loan = state.loans.find(l => l.id === loanId);
      if (!loan) {
        console.error('Loan not found:', loanId);
        alert('Error: Loan not found');
        return false;
      }
      
      // Check if payment exceeds remaining balance
      const remainingBalance = parseFloat(loan.remainingBalance) || 0;
      if (paymentAmount > remainingBalance) {
        alert(`Payment amount (${formatCurrency(paymentAmount, state.settings.currency)}) exceeds remaining balance (${formatCurrency(remainingBalance, state.settings.currency)})`);
        return false;
      }
      
      const newInstallment = {
        ...installment,
        id: Date.now().toString(),
        date: installment.date || new Date().toISOString().split('T')[0],
        amount: paymentAmount
      };
      
      console.log('📝 Dispatching installment:', { loanId, ...newInstallment });
      dispatch({ 
        type: actionTypes.ADD_LOAN_INSTALLMENT, 
        payload: { 
          loanId, 
          ...newInstallment 
        } 
      });
      
      // Calculate updated loans for saving
      const updatedLoans = state.loans.map(loan => {
        if (loan.id === loanId) {
          const updatedInstallments = [...(loan.installments || []), newInstallment];
          const totalPaid = updatedInstallments.reduce((sum, inst) => sum + inst.amount, 0);
          const newRemainingBalance = Math.max(0, (loan.totalAmount || loan.amount || 0) - totalPaid);
          
          return {
            ...loan,
            installments: updatedInstallments,
            remainingBalance: newRemainingBalance,
            status: newRemainingBalance <= 0 ? 'paid' : 'active',
            isPaid: newRemainingBalance <= 0
          };
        }
        return loan;
      });
      
      const updatedState = { ...state, loans: updatedLoans };
      saveData(updatedState);
      
      return true;
    },
    
    addSaving: (saving) => {
      const newSaving = {
        ...saving,
        id: Date.now().toString()
      };
      dispatch({ type: actionTypes.ADD_SAVING, payload: newSaving });
      saveData({ ...state, savings: [newSaving, ...state.savings] });
    },
    
    addSavingTransaction: (savingId, transaction) => {
      const newTransaction = {
        ...transaction,
        id: Date.now().toString()
      };
      dispatch({ type: actionTypes.ADD_SAVING_TRANSACTION, payload: { savingId, ...newTransaction } });
      const updatedSavings = state.savings.map(saving => {
        if (saving.id === savingId) {
          const updatedTransactions = [...(saving.transactions || []), newTransaction];
          const currentBalance = updatedTransactions.reduce((sum, t) => {
            return sum + (t.type === 'deposit' ? t.amount : -t.amount);
          }, saving.openingBalance || 0);
          return {
            ...saving,
            transactions: updatedTransactions,
            currentBalance,
            lastUpdated: new Date().toISOString()
          };
        }
        return saving;
      });
      saveData({ ...state, savings: updatedSavings });
    },
    
    deleteSavingTransaction: (savingId, transactionId) => {
      dispatch({ 
        type: actionTypes.DELETE_SAVING_TRANSACTION, 
        payload: { savingId, transactionId } 
      });
      
      const updatedSavings = state.savings.map(saving => {
        if (saving.id === savingId) {
          const updatedTransactions = (saving.transactions || []).filter(
            transaction => transaction.id !== transactionId
          );
          
          const currentBalance = updatedTransactions.reduce((sum, t) => {
            return sum + (t.type === 'deposit' ? t.amount : -t.amount);
          }, saving.openingBalance || 0);
          
          return {
            ...saving,
            transactions: updatedTransactions,
            currentBalance,
            lastUpdated: new Date().toISOString()
          };
        }
        return saving;
      });
      
      saveData({ ...state, savings: updatedSavings });
    },
    
    updateSavingTransaction: (savingId, transactionId, updates) => {
      dispatch({ 
        type: actionTypes.UPDATE_SAVING_TRANSACTION, 
        payload: { savingId, transactionId, updates } 
      });
      
      const updatedSavings = state.savings.map(saving => {
        if (saving.id === savingId) {
          const updatedTransactions = (saving.transactions || []).map(transaction => {
            if (transaction.id === transactionId) {
              return {
                ...transaction,
                ...updates,
                updatedAt: new Date().toISOString()
              };
            }
            return transaction;
          });
          
          const currentBalance = updatedTransactions.reduce((sum, t) => {
            return sum + (t.type === 'deposit' ? t.amount : -t.amount);
          }, saving.openingBalance || 0);
          
          return {
            ...saving,
            transactions: updatedTransactions,
            currentBalance,
            lastUpdated: new Date().toISOString()
          };
        }
        return saving;
      });
      
      saveData({ ...state, savings: updatedSavings });
    },
    
    addGoodsDebt: (debt) => {
      const newDebt = {
        ...debt,
        id: Date.now().toString(),
        status: 'active',
        isPaid: false,
        payments: []
      };
      dispatch({ type: actionTypes.ADD_GOODS_DEBT, payload: newDebt });
      saveData({ ...state, goodsDebt: [newDebt, ...state.goodsDebt] });
    },
    
    addGoodsDebtPayment: (paymentData) => {
      // ... keep existing code ...
    },
    
    addOwnerWithdrawal: (withdrawal) => {
      const newWithdrawal = {
        ...withdrawal,
        id: Date.now().toString()
      };
      dispatch({ type: actionTypes.ADD_OWNER_WITHDRAWAL, payload: newWithdrawal });
      saveData({ ...state, ownerWithdrawals: [newWithdrawal, ...state.ownerWithdrawals] });
    },
    
    deleteTransaction: (id) => {
      dispatch({ type: actionTypes.DELETE_TRANSACTION, payload: id });
      saveData({ ...state, transactions: state.transactions.filter(t => t.id !== id) });
    },
    
    deleteLoan: (id) => {
      console.log('🗑️ Deleting loan in action:', id);
      dispatch({ type: actionTypes.DELETE_LOAN, payload: id });
      saveData({ ...state, loans: state.loans.filter(loan => loan.id !== id) });
    },
    
    deleteSaving: (id) => {
      dispatch({ type: actionTypes.DELETE_SAVING, payload: id });
      saveData({ ...state, savings: state.savings.filter(saving => saving.id !== id) });
    },
    
    deleteGoodsDebt: (id) => {
      dispatch({ type: actionTypes.DELETE_GOODS_DEBT, payload: id });
      saveData({ ...state, goodsDebt: state.goodsDebt.filter(debt => debt.id !== id) });
    },
    
    resetData: () => {
      dispatch({ type: actionTypes.RESET_DATA });
      localStorage.removeItem('cashManagementData');
      if (currentUser) {
        saveToFirestore(currentUser.uid, initialState);
      }
    },
    
    updateSettings: (settings) => {
      dispatch({ type: actionTypes.UPDATE_SETTINGS, payload: settings });
      saveData({ ...state, settings: { ...state.settings, ...settings } });
    },
    
    exportData: () => {
      const dataStr = JSON.stringify(state, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `cash-management-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  // Calculate statistics
  const getStats = () => {
    const totalLoanAmount = state.loans.reduce((sum, loan) => sum + (loan.totalAmount || loan.amount || 0), 0);
    const totalLoanPaid = state.loans.reduce((sum, loan) => {
      const paid = (loan.totalAmount || loan.amount || 0) - (loan.remainingBalance || 0);
      return sum + Math.max(0, paid);
    }, 0);
    const totalLoanPending = state.loans.reduce((sum, loan) => sum + (loan.remainingBalance || 0), 0);
    
    const totalSavings = state.savings.reduce((sum, saving) => sum + (saving.currentBalance || 0), 0);
    
    const totalGoodsDebt = state.goodsDebt.reduce((sum, debt) => sum + (debt.totalAmount || 0), 0);
    const totalGoodsDebtPaid = state.goodsDebt.reduce((sum, debt) => {
      const paid = (debt.totalAmount || 0) - (debt.remainingBalance || 0);
      return sum + Math.max(0, paid);
    }, 0);
    const totalGoodsDebtPending = state.goodsDebt.reduce((sum, debt) => sum + (debt.remainingBalance || 0), 0);
    
    const totalWithdrawals = state.ownerWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = state.transactions.filter(t => t.date === today);
    const todaysTotal = todaysTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
    
    return {
      totalLoanAmount,
      totalLoanPaid,
      totalLoanPending,
      totalSavings,
      totalGoodsDebt,
      totalGoodsDebtPaid,
      totalGoodsDebtPending,
      totalWithdrawals,
      todaysTransactions: todaysTransactions.length,
      todaysTotal
    };
  };

  const value = {
    state,
    actions,
    stats: getStats(),
    currency: state.settings.currency,
    isLoaded: state.isLoaded,
    isSyncing: state.isSyncing,
    lastSynced: state.lastSynced
  };

  return (
    <CashManagementContext.Provider value={value}>
      {children}
    </CashManagementContext.Provider>
  );
}

// Hook
export function useCashManagement() {
  const context = useContext(CashManagementContext);
  if (!context) {
    throw new Error('useCashManagement must be used within a CashManagementProvider');
  }
  return context;
}

// Export helper function
export { formatCurrency };