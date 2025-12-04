# Test Data Guide

## Available Accounts (9 total)

### Traditional Banks
1. **High Yield Savings** (`savings`) - $5,000
2. **Main Checking** (`checking`) - $2,000 (has $500 pending)
3. **Credit Union Checking** (`credit_union`) - $1,200

### Neobanks & Payment Apps
4. **Cash App** (`cashapp`) - $800
5. **Venmo** (`venmo`) - $300
6. **Zelle (via Bank)** (`zelle`) - $0 (instant transfer service)
7. **PayPal** (`paypal`) - $450
8. **Wise (TransferWise)** (`wise`) - $600
9. **Chime Checking** (`chime`) - $950

**Total Available Balance:** $10,300

## Transfer Rules (25+ routes)

### Instant Transfers (Free)
- Checking → Zelle
- Savings → Zelle
- Credit Union → Zelle
- Checking → Venmo
- Checking → Cash App
- Checking → PayPal
- Checking ↔ Chime
- Chime → Zelle

### Instant Transfers (With Fees)
- Cash App → Checking: $2.50 (instant)
- Venmo → Checking: $1.75 (instant)
- PayPal → Checking: $1.50 (instant)

### Same-Day Transfers
- Savings → Cash App: Free (before 5pm EST)

### 1-Day Transfers (Free)
- Savings ↔ Checking
- Venmo → Checking
- PayPal → Checking
- Checking ↔ Credit Union
- Savings → Credit Union
- Wise → Checking: $0.50
- Checking → Wise: Free

### 3-Day Transfers (Free)
- Cash App → Checking
- Venmo ↔ Cash App (via bank intermediary)

## Example Use Cases

### Scenario 1: Landlord Wants Zelle Payment
**Goal:** Send $1,500 to Zelle by tomorrow
**Best Route:** 
- Checking → Zelle (instant, free)
- If insufficient: Savings → Zelle (instant, free)

### Scenario 2: Need to Pay via Venmo
**Goal:** Send $800 to Venmo
**Best Route:**
- Checking → Venmo (instant, free)

### Scenario 3: Consolidate from Multiple Apps
**Goal:** Get $2,000 to checking account
**Possible Sources:**
- Savings: $5,000 (1-day, free)
- Cash App: $800 (instant $2.50 OR 3-day free)
- Venmo: $300 (instant $1.75 OR 1-day free)
- PayPal: $450 (instant $1.50 OR 1-day free)
- Wise: $600 (1-day, $0.50)
- Chime: $950 (instant, free)

### Scenario 4: Cheapest Route to Target
**Goal:** Send $1,000 to any account with lowest fees
**Strategy:** Use free instant routes (Zelle, Venmo, Cash App, PayPal, Chime)

## Testing Tips

1. **Test Instant vs Delayed:** Compare routes when deadline is tight vs flexible
2. **Test Fee Optimization:** See how algorithm chooses between instant paid vs free delayed
3. **Test Multi-Hop:** Some routes may require intermediate accounts
4. **Test Insufficient Funds:** Try amounts larger than any single account
5. **Test Source Selection:** Manually select specific source accounts to see different routes

## Updating Test Data

Edit `web/data/transferRules.json` to:
- Add new accounts to the `accounts` array
- Add new transfer rules to the `transferRules` array
- Modify fees, speeds, or balances
- Test different scenarios

Speeds available: `instant`, `same_day`, `1_day`, `3_day`
Fees: `0` for free, or a number for fixed dollar amount
