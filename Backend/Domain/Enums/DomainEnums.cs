namespace MajiLedger.Domain.Enums;

// ─── Maintenance ──────────────────────────────────────────────────────────────
public enum MaintenanceCategory
{
    Plumbing = 1,
    Electrical = 2,
    Structural = 3,
    Painting = 4,
    Security = 5,
    Cleaning = 6,
    Appliance = 7,
    Landscaping = 8,
    Other = 99
}

public enum MaintenancePriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum MaintenanceStatus
{
    Submitted = 1,
    Acknowledged = 2,
    InProgress = 3,
    OnHold = 4,
    Completed = 5,
    Cancelled = 6
}

// ─── Notifications ────────────────────────────────────────────────────────────
public enum NotificationType
{
    General = 1,
    RentCharge = 2,
    RentPayment = 3,
    RentArrear = 4,
    WaterPurchase = 5,
    WaterToken = 6,
    MaintenanceUpdate = 7,
    TenancyCreated = 8,
    TenancyEnded = 9,
    SystemAlert = 99
}

// ─── Users & Authorization ────────────────────────────────────────────────────
public enum UserRole
{
    Admin = 1,          // Platform Super Admin
    Owner = 2,          // Property Owner / Landlord
    Manager = 3,        // Property Manager
    Staff = 4,          // Caretaker / Staff
    FinanceOfficer = 5, // Finance Officer
    Tenant = 6          // Tenant
}

public enum PropertyAccessRole
{
    FullAccess = 1,  // Full CRUD on the property
    ReadOnly = 2,    // View only
    Billing = 3      // Can view and initiate payments / reconciliation
}

// ─── Property ─────────────────────────────────────────────────────────────────
public enum PropertyType
{
    Residential = 1,
    Commercial = 2,
    Mixed = 3
}

public enum OwnershipRole
{
    PrimaryOwner = 1,
    CoOwner = 2
}

// ─── Tenancy ──────────────────────────────────────────────────────────────────
public enum TenancyStatus
{
    Pending = 0,
    Active = 1,
    Ended = 2,
    Suspended = 3,
    Expired = 4,
    Terminated = 5,
    Cancelled = 6
}

public enum BillingFrequency
{
    Monthly = 1,
    Quarterly = 2,
    Biannual = 3,
    Annual = 4
}

// ─── Rent Ledger Domain ──────────────────────────────────────────────────────
public enum RentChargeStatus
{
    Pending = 1,
    PartiallyPaid = 2,
    Paid = 3,
    Overdue = 4,
    Cancelled = 5
}

public enum RentPaymentMethod
{
    Mpesa = 1,
    BankTransfer = 2,
    Cash = 3,
    Cheque = 4,
    Other = 5
}

public enum RentPaymentStatus
{
    Pending = 1,
    Confirmed = 2,
    Failed = 3,
    Reversed = 4
}

public enum TenantCreditStatus
{
    Active = 1,
    FullyUtilized = 2,
    Expired = 3,
    Refunded = 4
}

// ─── Meters ───────────────────────────────────────────────────────────────────
public enum MeterType
{
    Standard = 1,        // Manual-read conventional meter
    Prepaid = 2,         // Token-based STS prepaid meter
    Smart = 3,           // IoT-enabled, remote readings
    Postpaid = 4,        // Postpaid billing
    MonitoringOnly = 5   // Monitoring without token billing
}

public enum MeterIntegrationType
{
    ApiIntegrated = 1,   // STS / IoT provider integration
    ManualToken = 2,     // Operator manually inputs tokens
    MonitoringOnly = 3   // No token generation needed
}

public enum MeterStatus
{
    Active = 1,
    Inactive = 2,
    Suspended = 3,
    Decommissioned = 4,
    Faulty = 5,
    Disconnected = 6,
    UnderMaintenance = 7
}

public enum WaterTransactionPaymentStatus
{
    Pending = 1,
    Confirmed = 2,
    Failed = 3,
    Reversed = 4
}

public enum WaterTransactionTokenStatus
{
    NotRequired = 0,
    Pending = 1,
    Generated = 2,
    Delivered = 3,
    Failed = 4
}

public enum WaterPaymentMethod
{
    Mpesa = 1,
    AirtelMoney = 2,
    BankTransfer = 3,
    Cash = 4,
    Other = 5
}

public enum MeterReadingSource
{
    Manual = 1,
    IoT = 2,
    Estimated = 3
}

// ─── Tariffs ──────────────────────────────────────────────────────────────────
public enum BillingCycle
{
    PerUnit = 1,  // Pay-per-unit (no standing charge period)
    Monthly = 2   // Monthly standing charge + consumption
}

// ─── QR Codes ─────────────────────────────────────────────────────────────────
public enum QrCodeStatus
{
    Active = 1,
    Disabled = 2,  // Temporarily disabled, not destroyed
    Revoked = 3    // Permanently revoked (sticker damaged / compromised)
}

public enum QrCodeAuditEvent
{
    Created = 1,
    Disabled = 2,
    Enabled = 3,
    Revoked = 4,
    Replaced = 5  // Revoked and a new registration created for same meter
}

// ─── Payment Providers ────────────────────────────────────────────────────────
public enum PaymentProviderType
{
    MpesaPaybill = 1,
    AirtelMoney = 2
}

public enum EnvironmentType
{
    Sandbox = 1,
    Production = 2
}

public enum PaymentChannel
{
    ScanToPay = 1,       // QR-code initiated
    MpesaPaybill = 2,    // Customer pays via M-Pesa Paybill
    AirtelPaybill = 3,   // Customer pays via Airtel Money
    Ussd = 4             // USSD workflow (future)
}

// ─── Payment Attempts ─────────────────────────────────────────────────────────
public enum PaymentAttemptStatus
{
    Initiated = 1,  // STK push sent / USSD initiated
    Confirmed = 2,  // Provider confirmed receipt
    Failed = 3,     // Provider reported failure
    Expired = 4,    // Timeout before confirmation
    Reversed = 5    // Confirmed but subsequently reversed by provider
}

// ─── Water Purchases ──────────────────────────────────────────────────────────
public enum WaterPurchaseStatus
{
    Pending = 1,      // Payment confirmed, token not yet requested
    TokenIssued = 2,  // Token successfully obtained from STS
    TokenFailed = 3,  // All STS attempts failed — manual intervention needed
    Reconciled = 4    // Verified in period-end reconciliation
}

// ─── Water Tokens ─────────────────────────────────────────────────────────────
public enum WaterTokenStatus
{
    Issued = 1,         // Token obtained from STS
    Delivered = 2,      // SMS confirmed sent
    DeliveryFailed = 3, // SMS gateway failed after retries
    Revoked = 4         // Token revoked by STS (rare)
}

// ─── SMS ──────────────────────────────────────────────────────────────────────
public enum SmsDeliveryStatus
{
    Queued = 1,
    Sent = 2,
    Delivered = 3,
    Failed = 4
}

// ─── Financial Reconciliation ─────────────────────────────────────────────────
public enum ReconciliationLedgerType
{
    Rent = 1,
    Water = 2,
    Consolidated = 3
}

public enum ReconciliationStatus
{
    Draft = 1,
    InProgress = 2,
    Reconciled = 3,
    DiscrepanciesFlagged = 4,
    Closed = 5
}

public enum DiscrepancyStatus
{
    Pending = 1,
    Resolved = 2,
    Ignored = 3
}

// ─── System Settings ──────────────────────────────────────────────────────────
public enum SettingCategory
{
    General = 1,
    Financial = 2,
    Billing = 3,
    Water = 4,
    Notifications = 5,
    Security = 6
}
