# @portfolio/auth

Sovereign authentication and AES-256-GCM hardware vault for Selvam.

## Principles

- **Zero-Cloud Sovereign Mode**: Automatic local session provisioning for `sovereign-user` when `SOVEREIGN_MODE=true`.
- **Hardware-Grade Vault (`vault.ts`)**: AES-256-GCM authenticated cipher with custom `SELV` binary format and PBKDF2-SHA512 key derivation (100,000 iterations).
- **Constant-Time Verification**: Uses `crypto.timingSafeEqual` for tag verification to defeat timing attacks.
- **Relational Integrity**: Enforces owner-scoped boundaries across all application use cases.
