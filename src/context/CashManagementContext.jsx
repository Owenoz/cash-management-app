// CashManagementContext.jsx - Fixed with all required actions
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Initial state with more detailed structure
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
    currency: 'USH',
    dateFormat: 'DD/MM/YYYY'
  },
  isLoaded: false,
  isSyncing: false,
  lastSynced: null
};

// Enhanced action types
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
  UPDATE_SAVING_TRANSACTION: 'UPDATE_SAVING_TRANSACTION', // Added this
  LOAD_DATA: 'LOAD_DATA',
  RESET_DATA: 'RESET_DATA',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_LOADING: 'SET_LOADING',
  SET_SYNCING: 'SET_SYNCING',
  SET_LAST_SYNCED: 'SET_LAST_SYNCED'
};

// Enhanced reducer with more functionality
function cashManagementReducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_TRANSACTION:
      const newTransaction = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        date: action.payload.date || new Date().toISOString().split('T')[0],
        timestamp: action.payload.timestamp || new Date().toISOString()
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
      const newLoan = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        date: action.payload.date || new Date().toISOString().split('T')[0],
        installments: action.payload.installments || [],
        totalAmount: action.payload.amount,
        remainingBalance: action.payload.amount,
        isPaid: false,
        status: 'active'
      };
      return {
        ...state,
        loans: [newLoan, ...state.loans]
      };

    case actionTypes.ADD_LOAN_INSTALLMENT:
      return {
        ...state,
        loans: state.loans.map(loan => {
          if (loan.id === action.payload.loanId) {
            const installment = {
              ...action.payload,
              id: action.payload.id || Date.now().toString(),
              date: action.payload.date || new Date().toISOString().split('T')[0]
            };
            
            const updatedInstallments = [...(loan.installments || []), installment];
            const totalPaid = updatedInstallments.reduce((sum, inst) => sum + inst.amount, 0);
            const remainingBalance = loan.totalAmount - totalPaid;
            
            return {
              ...loan,
              installments: updatedInstallments,
              remainingBalance,
              isPaid: remainingBalance <= 0,
              status: remainingBalance <= 0 ? 'paid' : 'active'
            };
          }
          return loan;
        })
      };

    case actionTypes.ADD_SAVING:
      const newSaving = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        date: action.payload.date || new Date().toISOString().split('T')[0],
        transactions: action.payload.transactions || [],
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
            }, 0);
            
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

    // ADD THIS CASE - DELETE_SAVING_TRANSACTION
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

    // ADD THIS CASE - UPDATE_SAVING_TRANSACTION
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
        payments: action.payload.payments || [],
        totalAmount: action.payload.totalAmount,
        remainingBalance: action.payload.remainingBalance,
        isPaid: action.payload.remainingBalance <= 0,
        status: action.payload.remainingBalance <= 0 ? 'paid' : 'active'
      };
      return {
        ...state,
        goodsDebt: [newGoodsDebt, ...state.goodsDebt]
      };

    case actionTypes.ADD_GOODS_DEBT_PAYMENT:
      // The action.payload should contain updatedDebts array
      return {
        ...state,
        goodsDebt: action.payload.updatedDebts || state.goodsDebt
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
      return {
        ...action.payload,
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

// Helper function for formatting currency
const formatCurrency = (amount, currency = '$') => {
  return `${currency}${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

// Provider
export function CashManagementProvider({ children }) {
  const [state, dispatch] = useReducer(cashManagementReducer, initialState);
  const [currentUser, setCurrentUser] = React.useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        loadUserData(user.uid);
      } else {
        loadLocalData();
      }
    });

    return unsubscribe;
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

  // Save data to localStorage (always)
  const saveToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem('cashManagementData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  // Save data to Firestore (when user is logged in)
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

  // Save data (both local and cloud)
  const saveData = useCallback((newState) => {
    saveToLocalStorage(newState);
    
    if (currentUser) {
      saveToFirestore(currentUser.uid, newState);
    }
  }, [currentUser, saveToLocalStorage, saveToFirestore]);

  // Enhanced actions - ADD THE MISSING ACTIONS HERE
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
    
    addLoan: (loan) => {
      const newLoan = {
        ...loan,
        id: Date.now().toString()
      };
      dispatch({ type: actionTypes.ADD_LOAN, payload: newLoan });
      saveData({ ...state, loans: [newLoan, ...state.loans] });
    },
    
    addLoanInstallment: (loanId, installment) => {
      const newInstallment = {
        ...installment,
        id: Date.now().toString()
      };
      dispatch({ type: actionTypes.ADD_LOAN_INSTALLMENT, payload: { loanId, ...newInstallment } });
      const updatedLoans = state.loans.map(loan => {
        if (loan.id === loanId) {
          const updatedInstallments = [...(loan.installments || []), newInstallment];
          const totalPaid = updatedInstallments.reduce((sum, inst) => sum + inst.amount, 0);
          const remainingBalance = loan.totalAmount - totalPaid;
          return {
            ...loan,
            installments: updatedInstallments,
            remainingBalance,
            isPaid: remainingBalance <= 0,
            status: remainingBalance <= 0 ? 'paid' : 'active'
          };
        }
        return loan;
      });
      saveData({ ...state, loans: updatedLoans });
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
    
    // ADD THIS ACTION - DELETE SAVING TRANSACTION
    deleteSavingTransaction: (savingId, transactionId) => {
      dispatch({ 
        type: actionTypes.DELETE_SAVING_TRANSACTION, 
        payload: { savingId, transactionId } 
      });
      
      // Update the state for saving
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
    
    // ADD THIS ACTION - UPDATE SAVING TRANSACTION
    updateSavingTransaction: (savingId, transactionId, updates) => {
      dispatch({ 
        type: actionTypes.UPDATE_SAVING_TRANSACTION, 
        payload: { savingId, transactionId, updates } 
      });
      
      // Update the state for saving
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
      console.log('Processing payment:', paymentData);
      
      // Validate payment amount
      const paymentAmount = parseFloat(paymentData.amount);
      if (!paymentAmount || paymentAmount <= 0) {
        alert('Please enter a valid payment amount');
        return false;
      }
      
      // Find all debts for this customer
      const customerDebts = state.goodsDebt.filter(debt => {
        const customerKey = debt.customerName.toLowerCase().trim();
        const paymentCustomerKey = paymentData.customerId.toLowerCase().trim();
        return customerKey === paymentCustomerKey && debt.remainingBalance > 0;
      });
      
      if (customerDebts.length === 0) {
        alert('No active debts found for this customer');
        return false;
      }
      
      // Calculate total remaining balance
      const totalRemaining = customerDebts.reduce((sum, debt) => sum + debt.remainingBalance, 0);
      
      if (paymentAmount > totalRemaining) {
        alert(`Payment amount (${formatCurrency(paymentAmount, state.settings.currency)}) cannot exceed total remaining balance (${formatCurrency(totalRemaining, state.settings.currency)})`);
        return false;
      }
      
      // Update debts based on payment distribution
      let remainingPayment = paymentAmount;
      const updatedDebts = state.goodsDebt.map(debt => {
        const customerKey = debt.customerName.toLowerCase().trim();
        const paymentCustomerKey = paymentData.customerId.toLowerCase().trim();
        
        if (customerKey !== paymentCustomerKey || debt.remainingBalance <= 0) {
          return debt;
        }
        
        let paymentForThisDebt = 0;
        
        if (paymentData.applyTo === 'all') {
          // Calculate proportional payment
          const proportion = debt.remainingBalance / totalRemaining;
          paymentForThisDebt = paymentAmount * proportion;
        } else if (paymentData.applyTo === debt.id) {
          // Apply full payment to this specific debt
          paymentForThisDebt = Math.min(paymentAmount, debt.remainingBalance);
        } else {
          // Not applying to this specific debt
          return debt;
        }
        
        // Round to 2 decimal places
        paymentForThisDebt = Math.min(paymentForThisDebt, remainingPayment);
        paymentForThisDebt = Math.round(paymentForThisDebt * 100) / 100;
        remainingPayment -= paymentForThisDebt;
        
        if (paymentForThisDebt <= 0) {
          return debt;
        }
        
        // Create payment record
        const paymentRecord = {
          id: `${Date.now()}_${debt.id}`,
          amount: paymentForThisDebt,
          date: paymentData.date || new Date().toISOString().split('T')[0],
          notes: paymentData.notes || '',
          timestamp: new Date().toISOString()
        };
        
        // Update debt
        const newRemainingBalance = Math.max(0, debt.remainingBalance - paymentForThisDebt);
        
        return {
          ...debt,
          remainingBalance: newRemainingBalance,
          status: newRemainingBalance <= 0 ? 'paid' : 'active',
          isPaid: newRemainingBalance <= 0,
          payments: [
            ...(debt.payments || []),
            paymentRecord
          ]
        };
      });
      
      // If there's any remaining payment after distribution (due to rounding), 
      // apply it to the first debt
      if (remainingPayment > 0.01) {
        const firstDebt = customerDebts[0];
        if (firstDebt) {
          const firstDebtIndex = updatedDebts.findIndex(d => d.id === firstDebt.id);
          if (firstDebtIndex !== -1) {
            const debt = updatedDebts[firstDebtIndex];
            const finalPayment = Math.min(remainingPayment, debt.remainingBalance);
            
            updatedDebts[firstDebtIndex] = {
              ...debt,
              remainingBalance: Math.max(0, debt.remainingBalance - finalPayment),
              status: debt.remainingBalance - finalPayment <= 0 ? 'paid' : 'active',
              isPaid: debt.remainingBalance - finalPayment <= 0
            };
          }
        }
      }
      
      // Dispatch the updated state
      dispatch({ 
        type: actionTypes.ADD_GOODS_DEBT_PAYMENT, 
        payload: { 
          paymentData,
          updatedDebts 
        } 
      });
      
      // Save to storage
      saveData({ ...state, goodsDebt: updatedDebts });
      
      // Calculate new remaining balance for feedback
      const newRemainingBalance = updatedDebts
        .filter(debt => {
          const customerKey = debt.customerName.toLowerCase().trim();
          const paymentCustomerKey = paymentData.customerId.toLowerCase().trim();
          return customerKey === paymentCustomerKey;
        })
        .reduce((sum, debt) => sum + debt.remainingBalance, 0);
      
      alert(`✅ Payment of ${formatCurrency(paymentAmount, state.settings.currency)} added successfully!\nRemaining balance: ${formatCurrency(newRemainingBalance, state.settings.currency)}`);
      
      return true;
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
    const totalLoanAmount = state.loans.reduce((sum, loan) => sum + loan.totalAmount, 0);
    const totalLoanPaid = state.loans.reduce((sum, loan) => sum + (loan.totalAmount - loan.remainingBalance), 0);
    const totalLoanPending = state.loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
    
    const totalSavings = state.savings.reduce((sum, saving) => sum + (saving.currentBalance || 0), 0);
    
    const totalGoodsDebt = state.goodsDebt.reduce((sum, debt) => sum + debt.totalAmount, 0);
    const totalGoodsDebtPaid = state.goodsDebt.reduce((sum, debt) => sum + (debt.totalAmount - debt.remainingBalance), 0);
    const totalGoodsDebtPending = state.goodsDebt.reduce((sum, debt) => sum + debt.remainingBalance, 0);
    
    const totalWithdrawals = state.ownerWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    
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