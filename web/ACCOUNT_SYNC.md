# Account Synchronization System

## Overview
User accounts are now centrally managed and synchronized across all components in real-time using React Context and localStorage.

## How It Works

### 1. Central State Management
- **Provider**: `UserAccountsProvider` wraps the entire app in `App.tsx`
- **Hook**: `useUserAccounts()` provides access to accounts anywhere in the app
- **Storage**: Accounts persist in `localStorage` under `patchpay_user_accounts`

### 2. Real-Time Updates
When a user adds or removes an account:
1. The change is saved to localStorage
2. A custom event `userAccountsChanged` is dispatched
3. All components using `useUserAccounts()` automatically re-render
4. The account appears immediately in:
   - Switchboard (as new jacks)
   - Route Calculator (in source selection)
   - Account count displays
   - Quick Account Add panel

### 3. Session Persistence
- Accounts persist across page refreshes
- No login required - works for demo/judging
- Can be cleared with `clearAccounts()` method

## Components Updated

### Core Components
- **App.tsx**: Wrapped with `UserAccountsProvider`
- **ControlRoom.tsx**: Uses `useUserAccounts()` hook
- **Switchboard.tsx**: Dynamically generates jacks from user accounts
- **RouteCalculator.tsx**: Shows user accounts in source selection
- **AccountSetup.tsx**: Saves accounts to central state
- **QuickAccountAdd.tsx**: Adds/removes from central state

### Account Display
- Account counts are always accurate and reactive
- Switchboard shows all user accounts as jacks (no 5-account limit)
- Route calculator shows user accounts in a separate section
- Balance information flows through to all displays

## Usage Example

```typescript
import { useUserAccounts } from '../hooks/useUserAccounts';

function MyComponent() {
  const { userAccounts, addAccount, removeAccount } = useUserAccounts();
  
  // userAccounts is always up-to-date
  // Changes made here appear everywhere instantly
  
  return <div>{userAccounts.length} accounts</div>;
}
```

## Benefits
- ✅ No prop drilling
- ✅ Single source of truth
- ✅ Automatic persistence
- ✅ Real-time synchronization
- ✅ Works without backend
- ✅ Perfect for demo/MVP
