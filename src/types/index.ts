/**
 * Core type definitions for the Transfer Routing Algorithm system
 */

/**
 * Account type enumeration
 */
export enum AccountType {
  CHECKING = "checking",
  SAVINGS = "savings",
  CASH_APP = "cash_app",
  VENMO = "venmo",
  PAYPAL = "paypal",
  OTHER = "other"
}

/**
 * Transaction status enumeration
 */
export enum TransactionStatus {
  PENDING = "pending",
  CLEARED = "cleared",
  FAILED = "failed"
}

/**
 * Transfer speed enumeration
 */
export enum TransferSpeed {
  INSTANT = "instant",
  SAME_DAY = "same_day",
  ONE_DAY = "1_day",
  THREE_DAY = "3_day"
}

/**
 * Transaction record
 */
export interface Transaction {
  id: string;
  accountId: string;
  amount: number; // Negative for debits, positive for credits
  date: Date;
  status: TransactionStatus;
  description: string;
  category?: string;
}

/**
 * Account information
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  pendingTransactions: Transaction[];
  institutionType: "traditional_bank" | "neobank";
  metadata: {
    lastUpdated: Date;
    isActive: boolean;
  };
}

/**
 * Transfer relationship between two accounts
 */
export interface TransferRelationship {
  fromAccountId: string;
  toAccountId: string;
  speed: TransferSpeed;
  fee: number | null; // null = free, number = fixed fee in dollars
  isAvailable: boolean;
}

/**
 * Transfer goal specification
 */
export interface Goal {
  targetAccountId: string;
  amount: number;
  deadline: Date;
}

/**
 * Individual transfer step in a route
 */
export interface TransferStep {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  method: TransferSpeed;
  fee: number;
  estimatedArrival: Date;
}

/**
 * Complete transfer route
 */
export interface Route {
  category: "cheapest" | "fastest" | "recommended";
  steps: TransferStep[];
  totalFees: number;
  estimatedArrival: Date;
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  reasoning: string;
}

/**
 * Successful routing result
 */
export interface RoutingResult {
  routes: Route[];
  allRoutesRisky?: boolean;
}

/**
 * Error response for routing failures
 */
export interface RoutingError {
  error: "insufficient_funds" | "no_path" | "past_deadline";
  message: string;
  shortfall?: number;
  suggestion?: string;
}

/**
 * Account combination for route generation
 */
export interface AccountCombination {
  accounts: Account[];
  totalAvailable: number;
}

/**
 * Transfer path from source to target
 */
export interface TransferPath {
  sourceAccountId: string;
  targetAccountId: string;
  hops: TransferRelationship[];
  totalSteps: number;
}

/**
 * Risk assessment breakdown
 */
export interface RiskAssessment {
  score: number;
  timing: number;
  reliability: number;
  complexity: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
