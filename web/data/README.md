# Transfer Rules Configuration

This file (`transferRules.json`) contains all your bank account and transfer fee data. Update it to change how the routing algorithm works.

## File Structure

```json
{
  "accounts": [...],      // Your bank accounts
  "transferRules": [...], // Transfer fees and speeds
  "metadata": {...}       // Version info
}
```

## Accounts

Each account needs:

```json
{
  "id": "unique-id",           // Unique identifier
  "name": "Display Name",      // What users see
  "type": "checking",          // checking, savings, cash_app, venmo, paypal, other
  "institutionType": "traditional_bank", // traditional_bank or neobank
  "balance": 5000,             // Current balance in dollars
  "pendingTransactions": []    // Array of pending transactions
}
```

### Pending Transactions

```json
{
  "id": "tx-1",
  "accountId": "checking",
  "amount": -500,              // Negative for debits, positive for credits
  "date": "2024-01-15T10:00:00Z",
  "status": "pending",         // pending, cleared, or failed
  "description": "Payment"
}
```

## Transfer Rules

Each rule defines how money can move between accounts:

```json
{
  "from": "savings",           // Source account ID
  "to": "checking",            // Target account ID
  "speed": "1_day",            // Transfer speed (see below)
  "fee": 0,                    // Fee in dollars (null = free)
  "notes": "Optional description"
}
```

### Transfer Speeds

- `instant` - Completes in 5 minutes (24/7)
- `same_day` - Completes by 5pm EST same business day
- `1_day` - Next business day
- `3_day` - 3 business days

### Fees

- `null` - Free transfer
- `0` - Free transfer (explicit)
- `2.50` - Fixed $2.50 fee
- Any number - Fixed dollar amount

## Common Transfer Patterns

### Same Bank (Free ACH)
```json
{
  "from": "savings",
  "to": "checking",
  "speed": "1_day",
  "fee": 0,
  "notes": "Free between same bank accounts"
}
```

### Cash App / Venmo (Instant with Fee)
```json
{
  "from": "cashapp",
  "to": "checking",
  "speed": "instant",
  "fee": 2.50,
  "notes": "1.5% fee, $2.50 minimum"
}
```

### Cash App / Venmo (Free but Slow)
```json
{
  "from": "cashapp",
  "to": "checking",
  "speed": "3_day",
  "fee": null,
  "notes": "Free standard transfer"
}
```

### Wire Transfer (Fast but Expensive)
```json
{
  "from": "savings",
  "to": "external",
  "speed": "same_day",
  "fee": 25,
  "notes": "Domestic wire transfer"
}
```

## How to Update

1. **Edit `transferRules.json`** in this directory
2. **Update the version** in metadata
3. **Refresh the browser** - changes load automatically
4. **No code changes needed!**

## Tips

- Add all your real accounts with current balances
- Include all possible transfer paths (even multi-hop)
- Update fees when banks change their pricing
- Use notes to remember why certain rules exist
- Keep the metadata.lastUpdated current

## Example: Adding a New Account

```json
{
  "id": "paypal",
  "name": "PayPal Balance",
  "type": "paypal",
  "institutionType": "neobank",
  "balance": 1200,
  "pendingTransactions": []
}
```

Then add transfer rules:

```json
{
  "from": "paypal",
  "to": "checking",
  "speed": "instant",
  "fee": 1.50,
  "notes": "PayPal instant transfer"
}
```

## Real-World Bank Fees (as of 2024)

### Cash App
- Instant: 1.5% (min $0.25)
- Standard: Free (1-3 days)

### Venmo
- Instant: 1.75% (min $0.25, max $25)
- Standard: Free (1-3 days)

### PayPal
- Instant: 1.5% (max $15)
- Standard: Free (1 day)

### Traditional Banks
- Same bank: Usually free
- ACH: Usually free (1-3 days)
- Wire: $15-$30 (same day)

---

**Questions?** The algorithm will automatically use whatever data you put here!
