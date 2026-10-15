import type { FinancialNote, NoteFolder } from "./types";

export const FOLDERS: NoteFolder[] = [
  { id: "all", name: "All Notes", iconName: "Folder", colorClass: "text-amber-500" },
  { id: "pinned", name: "Pinned", iconName: "Pin", colorClass: "text-amber-500" },
  {
    id: "investments",
    name: "Investment Memos",
    iconName: "TrendingUp",
    colorClass: "text-emerald-500",
  },
  { id: "tax", name: "Tax & Deductions", iconName: "Receipt", colorClass: "text-blue-500" },
  { id: "fire", name: "FIRE & Retirement", iconName: "Flame", colorClass: "text-orange-500" },
  {
    id: "real-estate",
    name: "Real Estate & Mortgage",
    iconName: "Home",
    colorClass: "text-indigo-500",
  },
  { id: "household", name: "Household & Bills", iconName: "Users", colorClass: "text-purple-500" },
  { id: "general", name: "General Notes", iconName: "FileText", colorClass: "text-slate-500" },
];

export const INITIAL_NOTES: FinancialNote[] = [
  {
    id: "note-1-rebalancing",
    slug: "q4-2026-asset-rebalancing",
    title: "Q4 2026 Portfolio Asset Rebalancing & Drift Analysis",
    category: "investments",
    tags: ["rebalancing", "equity", "asset-allocation", "q4-2026"],
    isPinned: true,
    createdAt: "2026-10-14T08:30:00.000Z",
    updatedAt: "2026-10-15T09:15:00.000Z",
    content: `## Portfolio Allocation Checkpoint

Reviewing strategic asset allocation drift across Indian Equity (Zerodha), Global Equity (VWRL / S&P 500), Sovereign Gold & Bullion, and Cash / Fixed Deposits.

### Target vs. Current Weights

| Asset Class | Target % | Current % | Drift | Target Action |
|:---|:---:|:---:|:---:|:---|
| **Indian Equity** | 35.0% | 38.2% | +3.2% | Hold SIP, direct fresh capital to Debt |
| **Global Equity** | 30.0% | 27.8% | -2.2% | Deploy €1,500 surplus into VWRL / IWDA |
| **Gold & Bullion** | 15.0% | 15.4% | +0.4% | Within target tolerance (±1.5%) |
| **Fixed Deposits & Cash** | 20.0% | 18.6% | -1.4% | Rebalance via upcoming monthly savings |

---

### Rebalancing Action Checklist

- [x] Verify Zerodha Kite margin and dividend ledger credits for Q3
- [ ] Direct November salary surplus (€2,100) toward Global ETF allocation
- [ ] Review small-cap allocation threshold (cap at 12% of total equity)
- [ ] Reconcile currency exchange impact (EUR/INR conversion at ~91.2)
- [ ] Schedule Q1 2027 review for mid-January

> **Rule of Thumb**: Only execute direct rebalancing sales if single-asset drift exceeds ±5.0%. Otherwise, correct drift organically using monthly cash flow injections.`,
  },
  {
    id: "note-2-box3-tax",
    slug: "dutch-box3-wealth-tax-strategy",
    title: "Dutch Box 3 Wealth Tax Strategy (2026–2027)",
    category: "tax",
    tags: ["tax", "box3", "netherlands", "belastingdienst"],
    isPinned: true,
    createdAt: "2026-10-10T14:20:00.000Z",
    updatedAt: "2026-10-14T16:45:00.000Z",
    content: `## Dutch Wealth Tax (Box 3) Navigation

Summary of tax optimization following the Supreme Court (*Hoge Raad*) rulings on actual return versus deemed yield (*forfaitair rendement*).

### Key Takeaways for Peildatum (January 1)

1. **Reference Date (*Peildatum*)**:
   - The asset distribution on **January 1st at 00:00** defines your Box 3 base for the entire fiscal year.
   - Bank deposits and savings enjoy a significantly lower deemed yield (~1.03%) compared to other investments (~6.04%).

2. **Deductible Debts & Mortgages**:
   - Primary residence mortgage sits in **Box 1** (*eigenwoningschuld*).
   - Any secondary property or investment loans offset Box 3 taxable assets above the debt threshold (*schuldendrempel*).

---

### Compliance Checklist

- [x] Download 2025 year-end bank balances for ABN AMRO and ING joint accounts
- [x] Obtain Zerodha capital gains statement for overseas asset reporting
- [ ] File objection request (*bezwaarschrift*) if actual equity return is below deemed rate
- [ ] Confirm 30% ruling status timeline and partial non-resident transition rules
- [ ] Archive all broker statements to Google Drive source documents folder`,
  },
  {
    id: "note-3-emergency-fund",
    slug: "emergency-fund-3tier-ladder",
    title: "Emergency Fund Allocation & 3-Tier FD Ladder",
    category: "household",
    tags: ["emergency-fund", "fixed-deposits", "liquidity", "cash"],
    isPinned: false,
    createdAt: "2026-10-08T11:00:00.000Z",
    updatedAt: "2026-10-12T13:30:00.000Z",
    content: `## Emergency Fund Architecture: 6 Months of Living Expenses

Total target buffer: **€18,000** (average household burn: €3,000/month).

### 3-Tier Structure

1. **Tier 1: Immediate Checking & Instant Savings (€4,000)**
   - Stored in ABN AMRO and ING joint current accounts.
   - Purpose: Direct debit coverage, immediate medical or appliance emergencies.
   - Yield: 1.50% p.a.

2. **Tier 2: High-Yield Liquid Buffer (€6,000)**
   - Kept in high-yield European savings (Raisin / Bunq Easy Savings).
   - Withdrawal access: 24 to 48 hours without fee penalties.
   - Yield: 3.25% p.a.

3. **Tier 3: Staggered Fixed Deposit Ladder (€8,000 / ₹7.2 Lakh)**
   - Split into 4 tranches of €2,000 maturing every quarter.
   - Auto-renewal enabled with interest payout into cash reserves.
   - Capital preservation guaranteed under deposit insurance.

---

### Quarterly Maintenance

- [x] October interest review and yield benchmarking
- [ ] Check maturity of FD Tranche #2 due in December 2026
- [ ] Recalculate monthly burn rate after energy contract renewal`,
  },
  {
    id: "note-4-fire-milestones",
    slug: "fire-roadmap-swr-milestones",
    title: "FIRE Roadmap: Safe Withdrawal Rate & Corpus Milestones",
    category: "fire",
    tags: ["fire", "retirement", "swr", "financial-independence"],
    isPinned: false,
    createdAt: "2026-09-28T17:10:00.000Z",
    updatedAt: "2026-10-11T10:05:00.000Z",
    content: `## Financial Independence Roadmap

Simulations based on 28x annual living expenses (€840,000 target corpus at constant 2026 purchasing power).

### Target Milestones

| Stage | Corpus Target | Status | Projected Date |
|:---|:---:|:---:|:---:|
| **Coast FIRE** | €280,000 | Achieved 🎉 | August 2025 |
| **Lean FIRE (Basic Needs)** | €500,000 | 72% Complete | Q3 2028 |
| **Full FIRE (Comfortable)** | €840,000 | 44% Complete | Q4 2033 |
| **Fat FIRE (Travel & Legacy)** | €1,200,000 | Long-term | 2038+ |

---

### Withdrawal Phase Assumptions

- **Safe Withdrawal Rate (SWR)**: 3.50% initially, stepping to 4.0% once Dutch State Pension (*AOW*) and corporate pillar 2 kicks in at age 67.
- **Sequence of Returns Risk Mitigation**: Maintain a 2-year cash and fixed-income bucket so equity sales are never forced during market drawdowns exceeding -20%.

### Action Items

- [x] Run Monte Carlo simulation in Selvām FIRE engine (96% success rate over 35 years)
- [ ] Track corporate pension accrual (*mijnpensioenoverzicht.nl*)
- [ ] Review inflation adjustment assumptions (projected 2.2% annual CPI)`,
  },
  {
    id: "note-5-mortgage-repayment",
    slug: "ing-mortgage-extra-repayment",
    title: "ING Mortgage: Annual 10% Extra Repayment Review",
    category: "real-estate",
    tags: ["mortgage", "ing", "real-estate", "repayment"],
    isPinned: false,
    createdAt: "2026-09-18T09:40:00.000Z",
    updatedAt: "2026-10-05T14:10:00.000Z",
    content: `## Mortgage Optimization & Prepayment Strategy

Evaluating whether to exercise the 10% penalty-free prepayment allowance on the ING Annuity Mortgage (*hypotheek*).

### Mortgage Snapshot

- **Current Principal**: €342,000
- **Fixed Interest Rate**: 3.75% (fixed until 2032)
- **Monthly Net Outlay**: ~€1,480 after *hypotheekrenteaftrek* (HRA)
- **Annual Penalty-Free Allowance**: €34,200 (10% of original principal)

---

### Trade-off Evaluation

1. **Guaranteed Return of Prepayment**:
   - Every €10,000 prepayment permanently reduces interest payments by €375/year.
   - Guaranteed tax-free return of ~3.75% gross (approx 2.4% net of HRA).

2. **Opportunity Cost (Global Equity ETF)**:
   - Historical expected return of MSCI World / VWRL: ~7.5% nominal.
   - Long-term expected spread: +3.75% in favor of equity investing.

### Decision

> **Verdict**: For 2026, retain excess capital in diversified equity funds and high-yield cash buffer. Only make partial mortgage prepayments if mortgage rates rise above 4.5% at renewal.

- [x] Verify HRA tax rebate withholding on monthly payslip
- [ ] Check annual property valuation (*WOZ-waarde*) update from municipality`,
  },
  {
    id: "note-6-household-audit",
    slug: "household-annual-audit-2026",
    title: "Annual Subscriptions & Utility Contracts Audit",
    category: "household",
    tags: ["household", "subscriptions", "contracts", "utilities"],
    isPinned: false,
    createdAt: "2026-09-05T13:00:00.000Z",
    updatedAt: "2026-09-29T18:20:00.000Z",
    content: `## Annual Household Expense & Contract Review

Audit of recurring subscriptions and utility tariffs ahead of Q4 renewals.

### Recurring Service Review

| Service | Cost | Frequency | Action |
|:---|:---:|:---:|:---|
| **Health Insurance (Zorgverzekering)** | €142.50 | Monthly | Review coverage window (Nov 15 - Dec 31) |
| **Energy Contract (Vattenfall/Eneco)** | €185.00 | Monthly | Compare dynamic vs fixed tariff rates |
| **Home Internet (Ziggo / KPN Fiber)** | €52.50 | Monthly | Check annual retention promo deal |
| **Cloud Storage & Software** | €19.99 | Monthly | Consolidate family Google One storage |

---

### Checklist

- [x] Cancel unused streaming trial subscriptions
- [ ] Compare health insurance deductibles (*eigen risico*) for 2027
- [ ] Verify water board tax (*waterschapsbelasting*) payment schedule
- [ ] Check home contents insurance (*inboedelverzekering*) coverage limits`,
  },
  {
    id: "note-7-zerodha-thesis",
    slug: "indian-equity-zerodha-thesis",
    title: "Indian Equity & Sector Allocation Thesis (Zerodha)",
    category: "investments",
    tags: ["zerodha", "india", "large-cap", "mid-cap", "long-term"],
    isPinned: false,
    createdAt: "2026-08-20T10:15:00.000Z",
    updatedAt: "2026-09-22T11:45:00.000Z",
    content: `## Long-Term India Growth Thesis

Capital deployment principles for the Indian equity portfolio held via Zerodha Kite.

### Core vs. Satellite Allocation

- **Core Holdings (75%)**:
  - Nifty 50 Index Fund / Nifty 50 ETF (large-cap stability, low expense ratio)
  - Nifty Next 50 (high-quality emerging large-caps)
  - Parag Parikh Flexi Cap Fund (disciplined value and international exposure)

- **Satellite Growth (25%)**:
  - Mid-cap and small-cap opportunities with ROCE > 18% and low debt
  - Consumption, digital infrastructure, and banking leaders

---

### Discipline Rules

1. **Never stop automated SIPs** during market corrections of 10%–15%.
2. **Reinvest dividends** systematically into the core index.
3. Review portfolio overlap annually using Selvām mutual fund intelligence.

- [x] Set up auto-mandate for 1st of every month
- [ ] Check long-term capital gains (LTCG) tax exemption threshold (₹1.25 Lakh)
- [ ] Update nominee details on Zerodha console`,
  },
];
