# @portfolio/parsers

Universal document, statement, and tradebook parser engine for Selvam.

## Principles

- **Enterprise Core (Clean Architecture)**: Zero database or network side effects. Functions receive file bytes or strings and return typed domain records.
- **Provider-Specific Adapters**: Dedicated parsers for Zerodha tradebooks, Degiro statements, Dutch & Indian tax filings, and payslips.
- **Auditable Fingerprinting**: Generates cryptographic SHA-256 fingerprints for deduplication.

## Parsers

- **Bank Statements**: Multiformat CSV and XML statement parsing with account masking.
- **Salary Payslips**: In-memory PDF/text extraction normalizing base salary, tax deductions, 30% ruling adjustments, and net payout.
- **Exchange Rates**: Direct European Central Bank (ECB) reference rates XML parser (`parseEcbReferenceRatesXml`).
- **Tax Filings**: Indian ITR JSON and Dutch final-assessment PDF parsers.
