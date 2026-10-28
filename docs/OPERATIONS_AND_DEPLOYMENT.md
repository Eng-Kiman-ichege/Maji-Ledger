# Operations, Deployment & Administration Guide

## 1. Overview & Operational Model

Maji Ledger is engineered as a robust, enterprise-grade cloud native application designed to run on containerized infrastructure (Docker, Kubernetes, Azure Container Apps, or AWS ECS) with a high-availability relational database (Microsoft SQL Server or PostgreSQL).

---

## 2. Administrator & Property Owner Dashboards

Maji Ledger implements a dual-persona administrative frontend built with Next.js App Router, React 19, and Tailwind CSS.

### 2.1. System Administrator Dashboard (`/dashboard`)
Authorized platform administrators manage the full portfolio:
- **Financial & Operational KPIs**: Total collections (KES), token vending volume ($m^3$), active meters, properties, buildings, and registered apartments.
- **Payment Method Distribution**: Real-time breakdown of Scan to Pay QR vs. Direct Paybill vs. USSD transactions.
- **System Exception Alerts**: Centralized triage cards for pending payments, failed STS token mints, SMS delivery timeouts, and reconciliation exceptions.
- **Provider & Gateway Management**: Platform-wide Paybill configuration, service fee percentages, and system-wide audit logging.

### 2.2. Property Owner Dashboard (`/dashboard/owner`)
Property owners and authorized property managers access an isolated portal:
- **Tenant & Property Summary**: Filterable lists of buildings, apartments, and installed meters owned by the logged-in user.
- **Revenue Analytics**: Daily, weekly, and monthly collection curves, net payouts, and purchased token units.
- **QR Sticker Management**: Live inventory tracking showing registered QR stickers, active vs. inactive meters, replacement history, and print-ready PDF exports.
- **Strict Data Isolation**: Multi-tenant authorization filters queries at the database boundary:
  ```csharp
  // Property Owner isolation in DashboardFeatures.cs
  var ownedPropertyIds = await db.PropertyOwnerships
      .Where(po => po.OwnerId == userId && po.IsActive)
      .Select(po => po.PropertyId)
      .ToListAsync(ct);
  ```

---

## 3. Security, Authorization & PII Protection

### 3.1. Authentication & Role-Based Access Control (RBAC)
- **Token Format**: Standard JWT (JSON Web Tokens) with 256-bit asymmetric or HMAC-SHA256 signing.
- **User Roles**:
  - `SystemAdmin`: Unrestricted access across all properties, provider configurations, tariffs, and reconciliation queues.
  - `PropertyOwner`: Scoped access strictly to properties linked via `PropertyOwnership`.
  - `PropertyManager`: Scoped operational access to designated buildings (can view meters and generate QR stickers, cannot alter financial payout destinations).
  - `Auditor`: Read-only access to transaction ledgers and financial reconciliation reports.

### 3.2. Data Protection & Sensitive Data Masking
- **Public QR Identifiers**: The public QR token is a cryptographically random GUID (`QrCodeRegistrations.QrPublicToken`). It conveys no database primary keys or internal serial numbers.
- **PII Masking**: Public-facing landing pages (`/pay/[qrId]`) mask the customer meter identifier:
  $$\text{Full Meter: } \texttt{MTR-0042-NAI} \longrightarrow \text{Masked: } \texttt{MTR-****-NAI}$$
- **Encryption at Rest**: Payment provider API keys, passkeys, and consumer secrets are encrypted using AES-GCM-256 before storage in `PaymentProviderConfigs`.

---

## 4. Environment Variables Specification

Below are the complete environment variable schemas for both Backend (.NET) and Frontend (Next.js). **No secret credentials or production passkeys are committed to version control.**

### 4.1. Backend (`Backend/WebAPI/appsettings.json` or Environment Variables)

```ini
# Database Connection
ConnectionStrings__DefaultConnection="Server=localhost;Database=MajiLedgerDb;User Id=sa;Password=YourStrongPassword!;TrustServerCertificate=True;MultipleActiveResultSets=true"

# ASP.NET Core Runtime
ASPNETCORE_ENVIRONMENT="Development"
ASPNETCORE_URLS="http://+:5000"

# JWT Authentication
JwtSettings__Issuer="https://api.majiledger.co.ke"
JwtSettings__Audience="https://majiledger.co.ke"
JwtSettings__Secret="YOUR_STRONG_HEX_OR_BASE64_SECRET_KEY_MINIMUM_32_BYTES"
JwtSettings__ExpiryMinutes="60"

# Application URLs
AppUrls__FrontendBaseUrl="http://localhost:3000"
AppUrls__ApiBaseUrl="http://localhost:5000"

# Safaricom Daraja M-Pesa Integration (Production Keys)
Mpesa__Environment="Sandbox" # or "Production"
Mpesa__ConsumerKey="YOUR_MPESA_CONSUMER_KEY"
Mpesa__ConsumerSecret="YOUR_MPESA_CONSUMER_SECRET"
Mpesa__Passkey="YOUR_MPESA_PASSKEY"
Mpesa__InitiatorName="YOUR_MPESA_INITIATOR"
Mpesa__CallbackUrl="https://api.majiledger.co.ke/api/v1/payments/mpesa-callback"

# STS Token Vending Service
Sts__ServerUrl="https://sts-kms.majiledger.internal"
Sts__ClientId="MAJI_STS_CLIENT"
Sts__ClientCertificateThumbprint="THUMBPRINT_HEX"
Sts__MockMode="true" # Set to false in live production with STS HSM

# SMS Provider Integration (Africa's Talking / Twilio)
Sms__Provider="AfricasTalking"
Sms__ApiKey="YOUR_AFRICAS_TALKING_API_KEY"
Sms__Username="sandbox"
Sms__SenderId="MAJILEDGER"
Sms__MockMode="true" # Set to false in live production
```

### 4.2. Frontend (`Frontend/.env.local`)

```ini
# Maji Ledger ASP.NET Core API Base URL
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"

# Public Application Domain
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Environment Identifier
NEXT_PUBLIC_APP_ENV="development"
```

---

## 5. Local Installation & Developer Quickstart

### 5.1. Prerequisites
- **.NET SDK**: Version 10.0 or later (`dotnet --version`)
- **Node.js**: Version 20.x or later with npm (`node --version`)
- **SQL Server**: Local SQL Server 2022, Azure SQL, or Docker instance.

### 5.2. Backend Setup & Run

1. Clone repository and navigate to backend directory:
   ```bash
   cd /Users/evan/Desktop/Maji/Backend
   ```
2. Restore NuGet dependencies:
   ```bash
   dotnet restore
   ```
3. Run database migrations to apply latest schema:
   ```bash
   dotnet ef database update --project Infrastructure --startup-project WebAPI
   ```
4. Start the WebAPI server:
   ```bash
   dotnet run --project WebAPI
   ```
   *The API will be available at `http://localhost:5000`.*

### 5.3. Frontend Setup & Run

1. Navigate to frontend directory:
   ```bash
   cd /Users/evan/Desktop/Maji/Frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:3000`.*

---

## 6. API Documentation & Swagger Access

- **Interactive Swagger UI**: When running in `Development` mode, open your browser to:
  $$\text{URL: } \texttt{http://localhost:5000/swagger}$$
- **OpenAPI JSON Spec**:
  $$\text{URL: } \texttt{http://localhost:5000/swagger/v1/swagger.json}$$
- **Health Checks**:
  $$\text{URL: } \texttt{http://localhost:5000/health}$$

---

## 7. Database Migration & Backup Procedures

### 7.1. Applying Database Migrations
Migrations are managed using Entity Framework Core code-first tooling:
```bash
# Add a new migration
dotnet ef migrations add <MigrationName> --project Infrastructure --startup-project WebAPI

# Apply pending migrations to target database
dotnet ef database update --project Infrastructure --startup-project WebAPI

# Generate SQL script for DBA manual deployment
dotnet ef migrations script --project Infrastructure --startup-project WebAPI -o update.sql
```

### 7.2. Backup & Disaster Recovery Strategy
- **Point-in-Time Recovery (PITR)**: Enable full recovery model on Microsoft SQL Server with transactional log backups every 15 minutes.
- **Daily Automated Backups**: Full database snapshot taken nightly at 01:00 UTC and replicated to offsite geo-redundant object storage (Azure Blob GRS or AWS S3).
- **Retention Schedule**:
  - Daily snapshots: 30 days.
  - Weekly snapshots: 12 weeks.
  - Monthly snapshots: 7 years (regulatory financial audit compliance).

---

## 8. Test Execution Results & Known Limitations

### 8.1. Test Execution Results
All test suites run via standard .NET CLI and execute with zero errors:
```bash
dotnet test Backend/Tests/MajiLedger.Tests/MajiLedger.Tests.csproj
```
- **Total Tests Passed**: **56 of 56** passing.
- **Coverage Highlights**:
  - `AdministrativeWorkflowTests`: Multi-tenant ownership, property-meter hierarchy, provider scoping.
  - `PaymentWorkflowTests`: QR landing resolution, inactive QR rejection, M-Pesa STK push simulation.
  - `ScanToPayWorkflowTests`: Meter masking, amount validation, tariff calculations.
  - `TokenFulfillmentTests`: STS 20-digit token generation, SMS decoupling, retry recovery.
  - `DashboardWorkflowTests`: Financial KPI aggregations, QR analytics.

### 8.2. Known Limitations & Development Mode Notes
1. **Third-Party Telephony**: Live SMS dispatch requires valid Africa's Talking / Twilio credentials and funded wallet balance; default dev configuration utilizes `MockSmsService`.
2. **STS Key Management Hardware**: Production deployment requires hardware or cloud KMS signing modules; development utilizes `MockStsService` IEC-62055 compatible algorithmic simulation.
3. **Physical Meter Tampering**: Physical QR sticker displacement cannot be detected by software alone; requires the three-tier physical defense described in `SCAN_TO_PAY_AND_QR_LIFECYCLE.md`.

---

## 9. Production Deployment Requirements

### 9.1. Minimum Infrastructure Specifications
- **API Nodes**: 2x Container Instances (2 vCPU, 4GB RAM) with auto-scaling up to 10 nodes during billing peaks (1st–5th of every month).
- **Frontend Nodes**: Vercel Serverless Edge or 2x Next.js Node.js container instances (1 vCPU, 2GB RAM).
- **Database**: Azure SQL Hyperscale / AWS RDS SQL Server (Standard Gen5, 4 vCPU, 16GB RAM) with Read Replica for dashboard reporting queries.

### 9.2. Production Checklist
- [ ] TLS 1.3 enforced across all web and API domains.
- [ ] Safaricom Daraja Production Consumer Key / Secret / Passkey provisioned and stored in Azure Key Vault.
- [ ] Daraja IP Whitelist configured on Webhook ingress firewall.
- [ ] STS Key Server mTLS client certificates installed and verified.
- [ ] Database Connection String configured with `Encrypt=True;TrustServerCertificate=False`.
- [ ] Background worker threads (`SmsDispatcherWorker`, `PaymentTimeoutSweeper`) running as resilient background jobs.

---

## 10. Monitoring, Recovery & Troubleshooting

### 10.1. Health & Liveness Probes
- `/health/live`: Basic process liveness check (HTTP 200).
- `/health/ready`: Deep health check validating database connectivity, Redis cache reachability, and STS server ping.

### 10.2. Troubleshooting Runbook

| Symptom | Root Cause | Remediation Procedure |
| :--- | :--- | :--- |
| **STK Push Timeout** | Customer entered PIN after 120 seconds or telecom gateway delay. | User prompted on frontend with "Retry Payment" button; background sweeper automatically transitions stalled `Initiated` payments to `Expired`. |
| **Token Generated but SMS Not Delivered** | Tenant phone switched off or out of cellular coverage. | 1. Direct tenant to view receipt URL (`/pay/[qrId]`).<br>2. Support agent navigates to Admin Dashboard &rarr; Transactions &rarr; Click "Resend SMS". |
| **M-Pesa Deducted but No Token** | STS server network timeout during callback processing. | 1. Payment status will be `Confirmed` while `WaterPurchase` is `TokenFailed`.<br>2. Background retry worker automatically replays STS minting.<br>3. Admin can click "Force Mint Token" on the reconciliation screen. |
| **QR Code Not Active Error** | QR sticker was printed but not activated via the admin dashboard. | Property Manager navigates to Dashboard &rarr; Meters &rarr; QR Codes &rarr; Click "Activate QR Code". |

---

## 11. Future Roadmap: Rental Payment Reconciliation & SpaceKC

Maji Ledger is architected to seamlessly plug into broader property management and tenant accounting ecosystems:

```
+-----------------------------------------------------------------------------------+
|                           Maji Ledger Water Platform                              |
|                (Meters, QR Scan-to-Pay, STS Token Engine, Paybills)               |
+-----------------------------------------------------------------------------------+
                                   |                   |
            Webhook Events / Kafka |                   | Direct REST Sync
                                   v                   v
+-------------------------------------------+   +------------------------------------+
|   SpaceKC Property Management Platform    |   | Rental Payment Reconciliation Hub  |
| - Tenant Onboarding & Lease Lifecycle     |   | - Unified Tenant Statement         |
| - Rent Invoicing & Deposit Management     |   | - Rent + Water Consolidated Ledger |
| - Maintenance Tickets & Vacancy Tracking  |   | - Automated Defaulter Utility Cut  |
+-------------------------------------------+   +------------------------------------+
```

### 11.1. Rental Payment Reconciliation Integration
- **Unified Tenant Financial Statement**: Synchronizes confirmed water token purchases with the tenant's primary rental ledger so landlords see a consolidated view of rent, water, and service charges.
- **Split-Payment Settlement**: Future support for unified M-Pesa payments where a single payment (e.g. KES 25,000) is split between rent (KES 22,000) and prepaid water credit (KES 3,000).

### 11.2. SpaceKC Ecosystem Federation
- **Automated Meter-to-Lease Binding**: When a tenant is onboarded in SpaceKC, the corresponding apartment's water meter is automatically associated with the tenant's profile and phone number.
- **Move-Out Final Token Audit**: SpaceKC triggers an automated meter audit upon tenant move-out to record remaining credit or pending standing charge balances.
