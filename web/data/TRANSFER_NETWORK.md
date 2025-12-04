# Transfer Network Visualization

## Network Map

```
                    ┌─────────────┐
                    │   ZELLE     │ (Instant, Free from banks)
                    │   $0        │
                    └─────────────┘
                           ▲
                           │ Free Instant
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────────┐      ┌──────────┐    ┌──────────┐
    │ SAVINGS │      │ CHECKING │    │  CREDIT  │
    │ $5,000  │◄────►│  $2,000  │◄──►│  UNION   │
    └─────────┘      └──────────┘    │  $1,200  │
          │          1-day Free       └──────────┘
          │                │
          │                │ Free Instant
          │                ▼
          │          ┌──────────┐
          │          │  VENMO   │
          │          │   $300   │
          │          └──────────┘
          │                │
          │                │ $1.75 instant / Free 1-day
          │                ▼
    Same-day Free    ┌──────────┐
          │          │ PAYPAL   │
          │          │   $450   │
          │          └──────────┘
          │                │
          │                │ $1.50 instant / Free 1-day
          ▼                ▼
    ┌──────────┐     ┌──────────┐
    │ CASH APP │◄───►│ CHECKING │
    │   $800   │     │  $2,000  │
    └──────────┘     └──────────┘
    $2.50 instant         │
    Free 3-day            │ Free Instant
                          ▼
                    ┌──────────┐
                    │  CHIME   │
                    │   $950   │
                    └──────────┘
                          │
                          │ Free Instant
                          ▼
                    ┌──────────┐
                    │  ZELLE   │
                    └──────────┘

    ┌──────────┐
    │   WISE   │
    │   $600   │
    └──────────┘
          │
          │ $0.50 1-day
          ▼
    ┌──────────┐
    │ CHECKING │
    └──────────┘
```

## Transfer Speed Legend

- **Instant** ⚡ - Arrives immediately
- **Same-Day** 🌅 - Arrives same day if before cutoff (5pm EST)
- **1-Day** 📅 - Next business day
- **3-Day** 📆 - 3 business days

## Fee Structure

### Free Instant Routes
Perfect for urgent payments with no fees:
- Bank accounts → Zelle
- Checking → Venmo
- Checking → Cash App  
- Checking → PayPal
- Checking ↔ Chime
- Chime → Zelle

### Paid Instant Routes
When you need it now and willing to pay:
- Cash App → Checking: $2.50
- Venmo → Checking: $1.75
- PayPal → Checking: $1.50

### Free Delayed Routes
Best for non-urgent transfers:
- All bank-to-bank: 1-day free
- Payment apps → Checking: 1-3 days free
- Wise → Checking: 1-day $0.50

## Strategic Routing Examples

### Example 1: Landlord Wants Zelle NOW
**Scenario:** Need $1,500 to Zelle immediately

**Optimal Route:**
1. Checking ($2,000) → Zelle: $1,500 instant, FREE ✅

**Alternative if checking insufficient:**
2. Savings ($5,000) → Zelle: $1,500 instant, FREE ✅

### Example 2: Pay Friend via Venmo
**Scenario:** Need $800 to Venmo

**Optimal Route:**
1. Checking ($2,000) → Venmo: $800 instant, FREE ✅

**Alternative:**
2. Cash App ($800) → Checking (3-day free) → Venmo (instant free)
   Total: 3 days, FREE

### Example 3: Consolidate Everything to Checking
**Scenario:** Need $5,000 in checking, deadline in 2 days

**Optimal Route (Cheapest):**
1. Savings → Checking: $2,000 (1-day, free)
2. Chime → Checking: $950 (instant, free)
3. Cash App → Checking: $800 (3-day, free) ⚠️ Too slow!
   OR Cash App → Checking: $800 (instant, $2.50)
4. PayPal → Checking: $450 (1-day, free)
5. Wise → Checking: $600 (1-day, $0.50)

**Total:** $5,000 in 1-3 days, $3.00 in fees

### Example 4: Emergency Cash to Zelle
**Scenario:** Need $3,000 to Zelle in 1 hour

**Optimal Route:**
1. Checking → Zelle: $2,000 (instant, free)
2. Savings → Zelle: $1,000 (instant, free)

**Total:** $3,000 instant, FREE ✅

## Network Insights

### Hub Accounts
**Checking** is the main hub with most connections:
- Direct instant access to: Zelle, Venmo, Cash App, PayPal, Chime
- 1-day access to: Savings, Credit Union, Wise

### Isolated Accounts
**Wise** has limited connections:
- Only connects to Checking
- Useful for international transfers (not shown in test data)

### Payment App Ecosystem
Venmo ↔ Cash App can transfer via bank intermediary (3-day)
- Useful for moving money between apps without fees
- Requires patience (3 business days)

### Zelle Advantage
- Free instant from any bank account
- Perfect for landlord/rent payments
- No balance (pass-through service)

## Testing Strategies

1. **Test Deadline Pressure:** 
   - 1-hour deadline → Only instant routes
   - 1-day deadline → Mix of instant and 1-day
   - 1-week deadline → All routes available

2. **Test Fee Optimization:**
   - Small amounts → Instant paid might be worth it
   - Large amounts → Free delayed saves money

3. **Test Multi-Source:**
   - Need $8,000 → Must combine multiple accounts
   - Algorithm finds optimal combination

4. **Test Source Restrictions:**
   - Only use payment apps → See different routes
   - Only use banks → Traditional banking routes
