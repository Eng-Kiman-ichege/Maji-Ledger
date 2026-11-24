using MajiLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Common.Interfaces;

/// <summary>
/// Defines the EF Core DbContext surface exposed to the Application layer.
/// Application never references EF Core SQL Server provider directly — only this abstraction.
/// </summary>
public interface IApplicationDbContext
{
    // ── Authorization ─────────────────────────────────────────────────────────
    DbSet<ApplicationUser> ApplicationUsers { get; }
    DbSet<PropertyAccess> PropertyAccesses { get; }

    // ── Property Domain ───────────────────────────────────────────────────────
    DbSet<Owner> Owners { get; }
    DbSet<Property> Properties { get; }
    DbSet<PropertyOwnership> PropertyOwnerships { get; }
    DbSet<Building> Buildings { get; }
    DbSet<UnitType> UnitTypes { get; }
    DbSet<Apartment> Apartments { get; }
    DbSet<Tenant> Tenants { get; }
    DbSet<Tenancy> Tenancies { get; }
    DbSet<TenancyTenant> TenancyTenants { get; }

    // ── Meter Domain ──────────────────────────────────────────────────────────
    DbSet<Meter> Meters { get; }
    DbSet<MeterAssignment> MeterAssignments { get; }
    DbSet<SharedMeterBillingPoint> SharedMeterBillingPoints { get; }
    DbSet<MeterReading> MeterReadings { get; }
    DbSet<WaterReading> WaterReadings { get; }
    DbSet<WaterTransaction> WaterTransactions { get; }

    // ── Tariff Domain ─────────────────────────────────────────────────────────
    DbSet<WaterTariff> WaterTariffs { get; }
    DbSet<TariffTier> TariffTiers { get; }

    // ── QR & Payment Config ───────────────────────────────────────────────────
    DbSet<PaymentProviderConfig> PaymentProviderConfigs { get; }
    DbSet<QrCodeRegistration> QrCodeRegistrations { get; }
    DbSet<QrCodeAuditLog> QrCodeAuditLogs { get; }

    // ── Rent Ledger Domain ────────────────────────────────────────────────────
    DbSet<RentCharge> RentCharges { get; }
    DbSet<RentPayment> RentPayments { get; }
    DbSet<PaymentAllocation> PaymentAllocations { get; }
    DbSet<TenantCredit> TenantCredits { get; }

    // ── Transaction Domain ────────────────────────────────────────────────────
    DbSet<PaymentAttempt> PaymentAttempts { get; }
    DbSet<Payment> Payments { get; }
    DbSet<WaterPurchase> WaterPurchases { get; }
    DbSet<WaterToken> WaterTokens { get; }
    DbSet<TokenGenerationAttempt> TokenGenerationAttempts { get; }
    DbSet<SmsDeliveryRecord> SmsDeliveryRecords { get; }
    DbSet<TransactionAuditLog> TransactionAuditLogs { get; }

    // ── Landlord Portal ───────────────────────────────────────────────────────
    DbSet<MaintenanceRequest> MaintenanceRequests { get; }
    DbSet<AppNotification> AppNotifications { get; }

    // ── Financial Reconciliation & Platform Operations ─────────────────────────
    DbSet<ReconciliationSession> ReconciliationSessions { get; }
    DbSet<ReconciliationDiscrepancy> ReconciliationDiscrepancies { get; }
    DbSet<SystemSetting> SystemSettings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
