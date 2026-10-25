namespace MajiLedger.Domain.Enums;

// ─── Users & Authorization ────────────────────────────────────────────────────
public enum UserRole
{
    Admin = 1,    // Platform-wide access
    Owner = 2,    // Access to owned properties only
    Manager = 3,  // Access to authorized properties
    Staff = 4     // Limited access per PropertyAccess.AccessRole
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
    Active = 1,
    Ended = 2,
    Suspended = 3
}

// ─── Meters ───────────────────────────────────────────────────────────────────
public enum MeterType
{
    Standard = 1,  // Manual-read conventional meter
    Prepaid = 2,   // Token-based STS prepaid meter
    Smart = 3      // IoT-enabled, remote readings
}

public enum MeterStatus
{
    Active = 1,
    Inactive = 2,
    Suspended = 3,
    Decommissioned = 4
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
