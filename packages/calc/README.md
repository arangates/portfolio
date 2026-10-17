# @portfolio/calc

Pure, zero-dependency financial calculation engine for Selvam.

## Principles

- **Enterprise Core (Clean Architecture)**: Completely decoupled from databases, network APIs, React, and file systems.
- **Deterministic & Pure**: Every function is a pure mathematical calculation. Given identical inputs, it always produces identical outputs.
- **Fully Tested**: 66 unit tests covering all financial scenarios and edge cases.

## Capabilities

- **FIRE Projections**: Deterministic Monte Carlo and baseline FIRE timelines, safe withdrawal rates, corpus targets, and sequence-of-returns risk.
- **XIRR & Returns**: Newton-Raphson cash flow return solver with ambiguous root detection and time-weighted return calculations.
- **Currency Conversion**: ECB daily reference rate math with precision rounding and missing date disclosure.
- **Net Worth Aggregation**: Multi-currency valuation across equities, deposits, cash, commodities, real estate, and liabilities.
- **Capital Deployment Policy**: Non-negative monthly surplus capacity, staging funds, and emergency reserve rules.
