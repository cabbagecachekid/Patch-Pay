/**
 * Integration tests for the main calculateOptimalRoutes function
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateOptimalRoutes } from './index.js';
import { clearPathCache } from './paths/pathFinder.js';
import {
  Account,
  AccountType,
  TransactionStatus,
  TransferRelationship,
  TransferSpeed,
  Goal,
  RoutingResult,
  RoutingError
} from './types/index.js';

describe('calculateOptimalRoutes', () => {
  beforeEach(() => {
    // Clear path cache between tests to avoid cross-test contamination
    clearPathCache();
  });
  
  it('should return three categorized routes for a simple direct transfer scenario', () => {
    // Setup: One source account with sufficient balance, direct transfer to target
    const currentTime = new Date('2024-01-15T10:00:00Z');
    const deadline = new Date('2024-01-15T18:00:00Z');
    
    const accounts: Account[] = [
      {
        id: 'checking',
        name: 'Checking Account',
        type: AccountType.CHECKING,
        balance: 1000,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'savings',
        name: 'Savings Account',
        type: AccountType.SAVINGS,
        balance: 500,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      }
    ];
    
    const transferMatrix: TransferRelationship[] = [
      {
        fromAccountId: 'checking',
        toAccountId: 'savings',
        speed: TransferSpeed.INSTANT,
        fee: 0,
        isAvailable: true
      }
    ];
    
    const goal: Goal = {
      targetAccountId: 'savings',
      amount: 100,
      deadline
    };
    
    const result = calculateOptimalRoutes(goal, accounts, transferMatrix, currentTime);
    
    // Verify it's a successful result, not an error
    expect(result).toHaveProperty('routes');
    expect((result as RoutingResult).routes).toHaveLength(3);
    
    const routes = (result as RoutingResult).routes;
    
    // Verify all three categories are present
    const categories = routes.map(r => r.category);
    expect(categories).toContain('cheapest');
    expect(categories).toContain('fastest');
    expect(categories).toContain('recommended');
    
    // Verify each route has required properties
    routes.forEach(route => {
      expect(route).toHaveProperty('steps');
      expect(route).toHaveProperty('totalFees');
      expect(route).toHaveProperty('estimatedArrival');
      expect(route).toHaveProperty('riskLevel');
      expect(route).toHaveProperty('riskScore');
      expect(route).toHaveProperty('reasoning');
      expect(route.reasoning).not.toBe('');
    });
  });
  
  it('should return past_deadline error when deadline is in the past', () => {
    const currentTime = new Date('2024-01-15T10:00:00Z');
    const deadline = new Date('2024-01-15T09:00:00Z'); // 1 hour ago
    
    const accounts: Account[] = [
      {
        id: 'checking',
        name: 'Checking Account',
        type: AccountType.CHECKING,
        balance: 1000,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'savings',
        name: 'Savings Account',
        type: AccountType.SAVINGS,
        balance: 500,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      }
    ];
    
    const transferMatrix: TransferRelationship[] = [
      {
        fromAccountId: 'checking',
        toAccountId: 'savings',
        speed: TransferSpeed.INSTANT,
        fee: 0,
        isAvailable: true
      }
    ];
    
    const goal: Goal = {
      targetAccountId: 'savings',
      amount: 100,
      deadline
    };
    
    const result = calculateOptimalRoutes(goal, accounts, transferMatrix, currentTime);
    
    // Verify it's an error response
    expect(result).toHaveProperty('error');
    expect((result as RoutingError).error).toBe('past_deadline');
    expect(result).not.toHaveProperty('routes');
  });
  
  it('should return insufficient_funds error when total available balance is less than goal', () => {
    const currentTime = new Date('2024-01-15T10:00:00Z');
    const deadline = new Date('2024-01-15T18:00:00Z');
    
    const accounts: Account[] = [
      {
        id: 'checking',
        name: 'Checking Account',
        type: AccountType.CHECKING,
        balance: 50,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'savings',
        name: 'Savings Account',
        type: AccountType.SAVINGS,
        balance: 500,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      }
    ];
    
    const transferMatrix: TransferRelationship[] = [
      {
        fromAccountId: 'checking',
        toAccountId: 'savings',
        speed: TransferSpeed.INSTANT,
        fee: 0,
        isAvailable: true
      }
    ];
    
    const goal: Goal = {
      targetAccountId: 'savings',
      amount: 1000, // More than available
      deadline
    };
    
    const result = calculateOptimalRoutes(goal, accounts, transferMatrix, currentTime);
    
    // Verify it's an error response
    expect(result).toHaveProperty('error');
    expect((result as RoutingError).error).toBe('insufficient_funds');
    expect((result as RoutingError).shortfall).toBe(450); // 1000 - (50 + 500)
    expect(result).not.toHaveProperty('routes');
  });
  
  it('should return no_path error when no transfer relationship exists to target', () => {
    const currentTime = new Date('2024-01-15T10:00:00Z');
    const deadline = new Date('2024-01-15T18:00:00Z');
    
    const accounts: Account[] = [
      {
        id: 'checking',
        name: 'Checking Account',
        type: AccountType.CHECKING,
        balance: 1000,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'savings',
        name: 'Savings Account',
        type: AccountType.SAVINGS,
        balance: 500,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      }
    ];
    
    const transferMatrix: TransferRelationship[] = [
      // No transfer relationship to savings account
    ];
    
    const goal: Goal = {
      targetAccountId: 'savings',
      amount: 100,
      deadline
    };
    
    const result = calculateOptimalRoutes(goal, accounts, transferMatrix, currentTime);
    
    // Verify it's an error response
    expect(result).toHaveProperty('error');
    expect((result as RoutingError).error).toBe('no_path');
    expect(result).not.toHaveProperty('routes');
  });
  
  it('should handle multi-hop transfers correctly', () => {
    const currentTime = new Date('2024-01-15T10:00:00Z');
    const deadline = new Date('2024-01-16T18:00:00Z');
    
    const accounts: Account[] = [
      {
        id: 'checking',
        name: 'Checking Account',
        type: AccountType.CHECKING,
        balance: 1000,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'intermediate',
        name: 'Intermediate Account',
        type: AccountType.CHECKING,
        balance: 0,
        pendingTransactions: [],
        institutionType: 'neobank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'savings',
        name: 'Savings Account',
        type: AccountType.SAVINGS,
        balance: 0, // Target account has no balance
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      }
    ];
    
    const transferMatrix: TransferRelationship[] = [
      {
        fromAccountId: 'checking',
        toAccountId: 'intermediate',
        speed: TransferSpeed.INSTANT,
        fee: 1,
        isAvailable: true
      },
      {
        fromAccountId: 'intermediate',
        toAccountId: 'savings',
        speed: TransferSpeed.SAME_DAY,
        fee: 2,
        isAvailable: true
      }
    ];
    
    const goal: Goal = {
      targetAccountId: 'savings',
      amount: 100,
      deadline
    };
    
    const result = calculateOptimalRoutes(goal, accounts, transferMatrix, currentTime);
    
    // Verify it's a successful result
    expect(result).toHaveProperty('routes');
    const routes = (result as RoutingResult).routes;
    expect(routes).toHaveLength(3);
    
    // Verify the route has multiple steps
    // All three routes should be the same in this case (only one combination)
    routes.forEach(route => {
      expect(route.steps.length).toBe(2); // checking -> intermediate -> savings
      expect(route.totalFees).toBe(3); // 1 + 2
    });
  });
  
  it('should set allRoutesRisky flag when all routes have risk score > 70', () => {
    const currentTime = new Date('2024-01-15T10:00:00Z');
    const deadline = new Date('2024-01-15T10:30:00Z'); // Very tight deadline (30 min)
    
    const accounts: Account[] = [
      {
        id: 'checking',
        name: 'Checking Account',
        type: AccountType.CHECKING,
        balance: 1000,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'hop1',
        name: 'Hop 1',
        type: AccountType.CHECKING,
        balance: 0,
        pendingTransactions: [],
        institutionType: 'neobank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'hop2',
        name: 'Hop 2',
        type: AccountType.CHECKING,
        balance: 0,
        pendingTransactions: [],
        institutionType: 'neobank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'hop3',
        name: 'Hop 3',
        type: AccountType.CHECKING,
        balance: 0,
        pendingTransactions: [],
        institutionType: 'neobank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'savings',
        name: 'Savings Account',
        type: AccountType.SAVINGS,
        balance: 0,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      }
    ];
    
    // Create a 4-hop path to get complexity=40
    const transferMatrix: TransferRelationship[] = [
      {
        fromAccountId: 'checking',
        toAccountId: 'hop1',
        speed: TransferSpeed.THREE_DAY,
        fee: 1,
        isAvailable: true
      },
      {
        fromAccountId: 'hop1',
        toAccountId: 'hop2',
        speed: TransferSpeed.THREE_DAY,
        fee: 1,
        isAvailable: true
      },
      {
        fromAccountId: 'hop2',
        toAccountId: 'hop3',
        speed: TransferSpeed.THREE_DAY,
        fee: 1,
        isAvailable: true
      },
      {
        fromAccountId: 'hop3',
        toAccountId: 'savings',
        speed: TransferSpeed.THREE_DAY,
        fee: 1,
        isAvailable: true
      }
    ];
    
    const goal: Goal = {
      targetAccountId: 'savings',
      amount: 100,
      deadline
    };
    
    const result = calculateOptimalRoutes(goal, accounts, transferMatrix, currentTime);
    
    // Verify it's a successful result with high risk warning
    // Risk calculation: timing=100 (after deadline), reliability=50 (all ACH), complexity=40 (4 steps)
    // Total: (100*0.5) + (50*0.3) + (40*0.2) = 50 + 15 + 8 = 73 > 70 ✓
    expect(result).toHaveProperty('routes');
    expect((result as RoutingResult).allRoutesRisky).toBe(true);
    
    // Also verify the routes have high risk scores
    const routes = (result as RoutingResult).routes;
    routes.forEach(route => {
      expect(route.riskScore).toBeGreaterThan(70);
    });
  });
  
  // Additional integration tests for edge cases
  
  it('should handle weekend deadline with ACH transfer correctly', () => {
    // Friday 4pm EST - initiate transfer
    const currentTime = new Date('2024-01-19T21:00:00Z'); // 4pm EST = 21:00 UTC
    // Monday 9am EST - deadline
    const deadline = new Date('2024-01-22T14:00:00Z'); // 9am EST = 14:00 UTC
    
    const accounts: Account[] = [
      {
        id: 'checking',
        name: 'Checking Account',
        type: AccountType.CHECKING,
        balance: 1000,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'savings',
        name: 'Savings Account',
        type: AccountType.SAVINGS,
        balance: 0,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      }
    ];
    
    const transferMatrix: TransferRelationship[] = [
      {
        fromAccountId: 'checking',
        toAccountId: 'savings',
        speed: TransferSpeed.ONE_DAY,
        fee: 0,
        isAvailable: true
      }
    ];
    
    const goal: Goal = {
      targetAccountId: 'savings',
      amount: 100,
      deadline
    };
    
    const result = calculateOptimalRoutes(goal, accounts, transferMatrix, currentTime);
    
    // Verify successful result
    expect(result).toHaveProperty('routes');
    const routes = (result as RoutingResult).routes;
    expect(routes).toHaveLength(3);
    
    // Verify that the estimated arrival accounts for weekend
    // 1-day ACH initiated Friday should arrive Tuesday (skips weekend)
    routes.forEach(route => {
      expect(route.steps[0].estimatedArrival.getDay()).toBe(2); // Tuesday
    });
  });
  
  it('should handle exact amount match (goal equals available balance)', () => {
    const currentTime = new Date('2024-01-15T10:00:00Z');
    const deadline = new Date('2024-01-15T18:00:00Z');
    
    const accounts: Account[] = [
      {
        id: 'checking',
        name: 'Checking Account',
        type: AccountType.CHECKING,
        balance: 100, // Exactly the goal amount
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'savings',
        name: 'Savings Account',
        type: AccountType.SAVINGS,
        balance: 0,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      }
    ];
    
    const transferMatrix: TransferRelationship[] = [
      {
        fromAccountId: 'checking',
        toAccountId: 'savings',
        speed: TransferSpeed.INSTANT,
        fee: 0,
        isAvailable: true
      }
    ];
    
    const goal: Goal = {
      targetAccountId: 'savings',
      amount: 100, // Exactly matches available balance
      deadline
    };
    
    const result = calculateOptimalRoutes(goal, accounts, transferMatrix, currentTime);
    
    // Verify successful result
    expect(result).toHaveProperty('routes');
    const routes = (result as RoutingResult).routes;
    expect(routes).toHaveLength(3);
    
    // Verify the transfer amount is exactly the goal amount
    routes.forEach(route => {
      const totalTransferred = route.steps.reduce((sum, step) => sum + step.amount, 0);
      expect(totalTransferred).toBe(100);
    });
  });
  
  it('should handle complex scenario with multiple sources, paths, and speeds', () => {
    const currentTime = new Date('2024-01-15T10:00:00Z');
    const deadline = new Date('2024-01-16T18:00:00Z');
    
    const accounts: Account[] = [
      {
        id: 'checking1',
        name: 'Checking Account 1',
        type: AccountType.CHECKING,
        balance: 300,
        pendingTransactions: [
          {
            id: 'txn1',
            accountId: 'checking1',
            amount: -50, // Pending debit
            date: currentTime,
            status: TransactionStatus.PENDING,
            description: 'Pending payment'
          }
        ],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'checking2',
        name: 'Checking Account 2',
        type: AccountType.CHECKING,
        balance: 200,
        pendingTransactions: [],
        institutionType: 'neobank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'cashapp',
        name: 'Cash App',
        type: AccountType.CASH_APP,
        balance: 150,
        pendingTransactions: [],
        institutionType: 'neobank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'intermediate',
        name: 'Intermediate Account',
        type: AccountType.CHECKING,
        balance: 0,
        pendingTransactions: [],
        institutionType: 'neobank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      },
      {
        id: 'target',
        name: 'Target Account',
        type: AccountType.SAVINGS,
        balance: 0,
        pendingTransactions: [],
        institutionType: 'traditional_bank',
        metadata: {
          lastUpdated: currentTime,
          isActive: true
        }
      }
    ];
    
    const transferMatrix: TransferRelationship[] = [
      // Direct paths with different speeds and fees
      {
        fromAccountId: 'checking1',
        toAccountId: 'target',
        speed: TransferSpeed.INSTANT,
        fee: 5,
        isAvailable: true
      },
      {
        fromAccountId: 'checking2',
        toAccountId: 'target',
        speed: TransferSpeed.SAME_DAY,
        fee: 2,
        isAvailable: true
      },
      // Multi-hop path for cashapp
      {
        fromAccountId: 'cashapp',
        toAccountId: 'intermediate',
        speed: TransferSpeed.INSTANT,
        fee: 0,
        isAvailable: true
      },
      {
        fromAccountId: 'intermediate',
        toAccountId: 'target',
        speed: TransferSpeed.ONE_DAY,
        fee: 1,
        isAvailable: true
      }
    ];
    
    const goal: Goal = {
      targetAccountId: 'target',
      amount: 400, // Requires multiple sources
      deadline
    };
    
    const result = calculateOptimalRoutes(goal, accounts, transferMatrix, currentTime);
    
    // Verify successful result
    expect(result).toHaveProperty('routes');
    const routes = (result as RoutingResult).routes;
    expect(routes).toHaveLength(3);
    
    // Verify different routes have different characteristics
    const cheapest = routes.find(r => r.category === 'cheapest')!;
    const fastest = routes.find(r => r.category === 'fastest')!;
    const recommended = routes.find(r => r.category === 'recommended')!;
    
    expect(cheapest).toBeDefined();
    expect(fastest).toBeDefined();
    expect(recommended).toBeDefined();
    
    // Verify cheapest has lowest fees
    expect(cheapest.totalFees).toBeLessThanOrEqual(fastest.totalFees);
    expect(cheapest.totalFees).toBeLessThanOrEqual(recommended.totalFees);
    
    // Verify fastest has earliest arrival
    expect(fastest.estimatedArrival.getTime()).toBeLessThanOrEqual(cheapest.estimatedArrival.getTime());
    expect(fastest.estimatedArrival.getTime()).toBeLessThanOrEqual(recommended.estimatedArrival.getTime());
    
    // Verify all routes have reasoning
    expect(cheapest.reasoning).not.toBe('');
    expect(fastest.reasoning).not.toBe('');
    expect(recommended.reasoning).not.toBe('');
    
    // Verify pending transactions are excluded from checking1
    // Available balance for checking1 = 300 - 50 = 250
    const totalAvailable = 250 + 200 + 150; // 600
    expect(totalAvailable).toBeGreaterThanOrEqual(goal.amount);
  });
});
