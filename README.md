# Maji Ledger — Smart Prepaid Water Metering & Revenue Platform

[![.NET 10.0](https://img.shields.io/badge/.NET-10.0-purple.svg)](https://dotnet.microsoft.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)]()

Maji Ledger is an enterprise multi-tenant prepaid water management and revenue collection platform. It connects physical smart water meters, property owners, and tenants via **Scan to Pay QR stickers**, automated **M-Pesa payment routing**, **Standard Transfer Specification (STS IEC 62055) 20-digit token generation**, and **decoupled SMS dispatch**.

---

## 📑 Complete Technical Documentation Index

Detailed architectural blueprints and operating guides are organized in the [`docs/`](docs/) directory:

1. [**System Architecture & Domain Model**](docs/ARCHITECTURE.md)
   - Clean Architecture layers, folder structure, CQRS with MediatR.
   - Complete Entity-Relationship (ER) diagram and database schema.
   - Next.js frontend App Router structure, routes, and security isolation.
2. [**Scan to Pay & QR-Code Lifecycle Guide**](docs/SCAN_TO_PAY_AND_QR_LIFECYCLE.md)
   - 7-stage QR lifecycle: Registration, Activation, Printing, Verification, Disabling, Replacement, Revocation.
   - Physical displacement attack analysis and 3-layer anti-tamper mitigations.
   - Mobile-first Scan to Pay customer journey & sequence diagram.
3. [**Payment Routing & Multi-Provider Guide**](docs/PAYMENT_ROUTING_AND_PROVIDERS.md)
   - Multi-tenant Paybill routing (platform-wide vs. dedicated landlord shortcodes).
   - Direct Paybill C2B & USSD workflows with account reference matching.
   - Verified vs. mock integration disclosure and Safaricom Daraja setup requirements.
4. [**Tariffs, STS Token Generation & SMS Fulfillment**](docs/TARIFFS_AND_TOKEN_FULFILLMENT.md)
   - Stepped/tiered tariff block algorithm with standing charges and taxes.
   - STS (IEC 62055-41) 20-digit token generation and TID replay protection.
   - Decoupled SMS delivery architecture, phone normalization, and reconciliation state machine.
5. [**Operations, Deployment & Integration Guide**](docs/OPERATIONS_AND_DEPLOYMENT.md)
   - Dual dashboards (System Administrator & Property Owner).
   - Environment variables, local setup, migrations, backups, and Swagger access.
   - Test suite results, known limitations, troubleshooting runbook, and SpaceKC integration roadmap.

---

## ⚡ Quick Start: Install, Configure, Run & Test

### 1. Prerequisites
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20.x or later](https://nodejs.org/) & `npm`
- [Microsoft SQL Server 2022+](https://www.microsoft.com/en-us/sql-server/) or LocalDB / Docker SQL Server

---

### 2. Configure Environment Variables

#### Backend Configuration
Copy the configuration template or set environment variables in `Backend/WebAPI/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=MajiLedgerDb;User Id=sa;Password=YourStrongPassword!;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "JwtSettings": {
    "Issuer": "https://api.majiledger.co.ke",
    "Audience": "https://majiledger.co.ke",
    "Secret": "A_VERY_LONG_SECRET_KEY_WITH_AT_LEAST_32_CHARACTERS_FOR_HMAC256",
    "ExpiryMinutes": 60
  },
  "Sts": {
    "MockMode": true
  },
  "Sms": {
    "MockMode": true
  }
}
```

#### Frontend Configuration
Create `Frontend/.env.local`:
```ini
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
```

---

### 3. Database Migration & Seeding

Navigate to the `Backend/` directory and apply the EF Core migrations:
```bash
cd Backend
dotnet restore
dotnet ef database update --project Infrastructure --startup-project WebAPI
```

---

### 4. Running Locally

#### Run Backend API (Port 5000)
```bash
cd Backend
dotnet run --project WebAPI
```
* Interactive Swagger UI: `http://localhost:5000/swagger`
* Health Check Endpoint: `http://localhost:5000/health`

#### Run Frontend Next.js Web App (Port 3000)
In a separate terminal:
```bash
cd Frontend
npm install
npm run dev
```
* Landing & Scan to Pay: `http://localhost:3000`
* Test Meter QR Landing: `http://localhost:3000/pay/MTR-0042-QR-TOKEN`
* Administrator Dashboard: `http://localhost:3000/dashboard`
* Property Owner Dashboard: `http://localhost:3000/dashboard/owner`

---

### 5. Running the Test Suite

Execute the comprehensive automated test suite (56 integration and unit tests):
```bash
cd Backend
dotnet test Tests/MajiLedger.Tests/MajiLedger.Tests.csproj
```

Build the production frontend bundle to verify Next.js static and dynamic routes:
```bash
cd Frontend
npm run build
```

---

## 🏛️ High-Level System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    Next.js 16 Frontend                                  |
|   /pay/[qrId] (Public Scan to Pay)  |  /dashboard (Admin)  |  /dashboard/owner (Owner)  |
+-----------------------------------------------------------------------------------------+
                                             |
                                  HTTPS / REST JSON API
                                             v
+-----------------------------------------------------------------------------------------+
|                                ASP.NET Core 10 WebAPI                                   |
|   Controllers  |  Global Exception Middleware  |  JWT Auth  |  Swagger OpenAPI Spec     |
+-----------------------------------------------------------------------------------------+
                                             |
                                    MediatR CQRS Pipeline
                                             v
+-----------------------------------------------------------------------------------------+
|                                   Application Layer                                     |
|   Commands, Queries, Validators (FluentValidation), Payment Fulfillment Engine          |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                    Domain Model                                         |
|   Property -> Building -> Apartment -> Meter -> QrCodeRegistration -> Payment           |
|                                         |                                               |
|                                         v                                               |
|                       Tariff -> WaterPurchase -> WaterToken                             |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                 Infrastructure Layer                                    |
|   EF Core 10 | SQL Server | Daraja M-Pesa | STS 20-Digit Vending | Africa's Talking SMS |
+-----------------------------------------------------------------------------------------+
```

---

## 🔍 Honest Integration Status Disclosure

| External Boundary | Codebase Component | Implementation Status | Note |
| :--- | :--- | :--- | :--- |
| **Mobile Money (M-Pesa)** | `IPaymentGateway` | **Verified Architecture Mock** | Simulates STK Push, validation, and confirmation webhooks with deterministic test states. Production Daraja requires merchant shortcode approval. |
| **STS Water Token Dispenser** | `IStsService` | **Verified Algorithmic Mock** | Minting conforms to IEC 62055-41 20-digit token spec with TID timestamping. Hardware Security Module (HSM) is configured via mTLS in production. |
| **SMS Notification Gateway** | `ISmsService` | **Verified Architecture Mock** | Dispatches asynchronous queued messages with status updates and phone normalization. Production connects to Africa's Talking / Twilio. |
| **Database & CQRS Core** | EF Core 10 / MediatR | **Production Complete** | Fully implemented, migrated, and verified across all entity relationships and tenant boundaries. |

---

## 🛡️ QR-Code Physical Security

Maji Ledger implements a three-tier defense against the physical relocation or swapping of printed QR stickers:
1. **Material Defense**: Tamper-evident frangible vinyl stickers that self-destruct upon attempted removal.
2. **Visual Verification Defense**: The Scan to Pay landing page explicitly displays the verified Estate, Building, House Number, and masked meter number (`MTR-****-NAI`) for tenant confirmation prior to entering funds.
3. **Audit Trail**: QR codes support rapid disabling, replacement, and permanent revocation directly from the Property Owner and Admin dashboards.

---

## 🤝 Handover & Review

This documentation represents the completed Step 9 handover for Maji Ledger. All source code, database migrations, tests, and documentation are committed and verified.

**Awaiting user review and authorization prior to production deployment.**
