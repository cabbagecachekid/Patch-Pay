# Transfer Network Documentation

## Overview

This document describes the transfer network rules, fees, and timing for all supported financial institutions in PatchPay. The system uses this data to calculate optimal routing paths between accounts.

## Transfer Speed Categories

- **Instant** ⚡ - Arrives immediately (within minutes)
- **Same-Day** 🌅 - Arrives same business day if before cutoff (typically 5pm EST)
- **1-Day** 📅 - Next business day
- **3-Day** 📆 - 3 business days (standard ACH)

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TRANSFER NETWORK                          │
│                                                              │
│  Traditional Banks ──┐                                       │
│  (Chase, BofA, etc)  │                                       │
│                      │                                       │
│  Online Banks ───────┼──► ACH Network ──► External Banks    │
│  (Ally, Marcus)      │    (3-day free)                      │
│                      │                                       │
│  Neobanks ───────────┤                                       │
│  (Chime, SoFi)       │                                       │
│                      │                                       │
│  Payment Apps ───────┘                                       │
│  (Venmo, CashApp)    ──► Instant (fee) or Standard (free)   │
│                                                              │
│  Zelle Network ──────────► Instant (free, bank-to-bank)     │
│                                                              │
│  Wire Transfers ─────────► Same-day ($20-$30 fee)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Transfer Rules by Institution Type

### Traditional Banks (Chase, BofA, Wells Fargo, Citi, etc.)
- **Internal transfers**: Instant, Free
- **External ACH**: 3 business days, Free
- **Domestic wire**: Same day, $25-$30
- **Zelle**: Instant, Free (if both banks support)

### Online Banks (Ally, Marcus, Discover)
- **Internal transfers**: Instant, Free
- **External ACH**: 1-3 business days, Free
- **Domestic wire**: Same day, $20-$30 (Ally: $20, Marcus: N/A)
- **Zelle**: Instant, Free (if supported)

### Neobanks (Chime, SoFi, Varo, Current, Revolut)
- **Internal transfers**: Instant, Free
- **External ACH**: 3 business days, Free
- **Zelle**: Instant, Free (if supported)
- **International** (Revolut): 1 day, 0.5% fee

### Payment Apps

#### Cash App
- **Instant to bank**: 1.5% fee (min $0.25)
- **Standard to bank**: 3 business days, Free
- **To other Cash App users**: Instant, Free

#### Venmo
- **Instant to bank**: 1.75% fee (min $0.25, max $25)
- **Standard to bank**: 1 business day, Free
- **To other Venmo users**: Instant, Free

#### PayPal
- **Instant to bank**: 1.5% fee (max $15)
- **Standard to bank**: 1 business day, Free
- **To other PayPal users**: Instant, Free

#### Wise (formerly TransferWise)
- **Internal**: Instant, Free
- **To US banks (ACH)**: 1 business day, Free
- **International**: 1 day, 0.4% fee + real exchange rate

### Brokerages (Schwab, Fidelity)
- **Internal transfers**: Instant, Free
- **External ACH**: 3 business days, Free
- **Domestic wire**: Same day, Free (Schwab) or varies (Fidelity)

### Zelle Network
- **Bank to bank**: Instant, Free (if both banks enrolled)
- **Availability**: Most major banks support Zelle
- **Limits**: Varies by bank (typically $500-$5,000/day)

## Fee Calculation Examples

### Example 1: Cash App Instant Transfer
- Amount: $1,000
- Fee: 1.5% = $15.00
- Total cost: $15.00
- Arrival: Instant

### Example 2: Venmo Instant Transfer
- Amount: $1,000
- Fee: 1.75% = $17.50 (capped at $25)
- Total cost: $17.50
- Arrival: Instant

### Example 3: PayPal Instant Transfer
- Amount: $1,000
- Fee: 1.5% = $15.00 (capped at $15)
- Total cost: $15.00
- Arrival: Instant

### Example 4: Wire Transfer
- Amount: $10,000
- Fee: $25-$30 (flat fee)
- Total cost: $25-$30
- Arrival: Same business day

### Example 5: Standard ACH (Free)
- Amount: Any
- Fee: $0
- Total cost: $0
- Arrival: 1-3 business days

## Strategic Routing Scenarios

### Scenario 1: Urgent Rent Payment via Zelle
**Goal:** $2,500 to landlord via Zelle, needed today

**Optimal Strategy:**
- Use any bank checking/savings → Zelle
- Cost: $0
- Time: Instant
- Why: Zelle is free and instant from all major banks

### Scenario 2: Consolidate Payment App Balances
**Goal:** Move $1,500 from Venmo + Cash App to checking account

**Option A (Fast, Paid):**
- Venmo ($1,000) → Bank: Instant, $17.50
- Cash App ($500) → Bank: Instant, $7.50
- Total: Instant, $25.00

**Option B (Slow, Free):**
- Venmo ($1,000) → Bank: 1 day, $0
- Cash App ($500) → Bank: 3 days, $0
- Total: 3 days, $0

**Recommendation:** Option B unless urgent need

### Scenario 3: Large Transfer Between Banks
**Goal:** Move $10,000 from Chase to Ally

**Option A (Standard ACH):**
- Chase → Ally: 3 days, $0
- Best for: Non-urgent transfers

**Option B (Wire Transfer):**
- Chase → Ally: Same day, $25
- Best for: Time-sensitive large amounts

**Option C (Multi-hop via Zelle):**
- Not practical for $10,000 (exceeds daily Zelle limits)

### Scenario 4: International Transfer
**Goal:** Send $5,000 to UK bank account

**Using Wise:**
- US Bank → Wise: 1 day, $0 (ACH)
- Wise → UK Bank: 1 day, ~$20 (0.4% fee)
- Total: 2 days, ~$20
- Advantage: Real exchange rate, no markup

**Using Traditional Wire:**
- US Bank → UK Bank: 1-2 days, $45-$75
- Disadvantage: Poor exchange rate + high fees

## Key Network Insights

### 1. Hub Accounts
Traditional bank checking accounts serve as network hubs:
- Connect to all payment apps (Venmo, Cash App, PayPal)
- Connect to Zelle network
- Connect to other banks via ACH
- Connect to wire transfer network

### 2. Payment App Strategy
**For receiving money:**
- Keep in app for peer-to-peer payments (instant, free)
- Transfer to bank when needed (choose speed vs. cost)

**For sending money:**
- Fund from bank account (free, may take 1-3 days)
- Or use app balance (instant)

### 3. Zelle Network Advantage
- **Best for:** Rent, bills, person-to-person urgent payments
- **Pros:** Instant, free, widely supported
- **Cons:** Limited to enrolled banks, daily limits apply
- **Typical limits:** $500-$5,000/day depending on bank

### 4. Wire Transfer Use Cases
**When to use wires:**
- Large amounts ($10,000+) where percentage fees would be high
- Same-day settlement required
- Real estate transactions
- Business payments

**When to avoid wires:**
- Small amounts (flat fee makes it expensive)
- No time pressure (ACH is free)
- International transfers (Wise is cheaper)

### 5. International Transfer Strategy
**Wise advantages:**
- Real exchange rate (no markup)
- Low percentage fee (0.4%)
- Transparent pricing
- Fast (1-2 days)

**Traditional bank disadvantages:**
- Hidden exchange rate markup (3-5%)
- High wire fees ($45-$75)
- Slower processing

## Optimization Principles

### 1. Time vs. Cost Trade-off
```
Instant transfers: High convenience, potential fees
1-day transfers: Good balance, often free
3-day transfers: Maximum savings, requires planning
```

### 2. Multi-Source Routing
When combining multiple accounts:
- Prioritize free instant sources first
- Use free 1-day sources next
- Use paid instant sources only if deadline requires
- Minimize total fees while meeting deadline

### 3. Risk Factors
**Low risk:**
- Internal bank transfers
- Zelle between major banks
- Standard ACH

**Medium risk:**
- Payment app instant transfers (may fail if insufficient funds)
- Same-day wires (cutoff times apply)

**High risk:**
- International transfers (exchange rate fluctuation)
- New account transfers (may be held for verification)

## Business Day Calculations

### Standard Business Days
- Monday-Friday (excluding federal holidays)
- Cutoff times typically 5:00 PM EST
- Transfers initiated after cutoff count as next business day

### Examples
- Friday 6 PM → Tuesday (skips weekend)
- Thursday → Friday (next business day)
- Wednesday before holiday → Friday (skips holiday)

### Payment App Processing
- Instant transfers: Process 24/7 including weekends
- Standard transfers: Follow business day rules
- Funds may be held over weekends even if "instant"

## Database Coverage

**Current institutions:** 26 financial services
- 9 traditional banks
- 7 neobanks
- 4 payment apps
- 2 brokerages
- 2 online banks
- 1 payment network (Zelle)
- 1 international service (Wise)

**Transfer methods supported:**
- Internal transfers (instant, free)
- ACH transfers (1-3 days, free)
- Wire transfers (same day, $20-$30)
- Instant payment app transfers (instant, 1.5-1.75% fee)
- Standard payment app transfers (1-3 days, free)
- Zelle transfers (instant, free)
- International transfers (1-2 days, 0.4-0.5% fee)
