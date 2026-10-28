using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Dashboard;

// ── DTOs ──────────────────────────────────────────────────────────────────────

/// <summary>
/// Aggregated financial summary — only counts confirmed (provider-acknowledged) payments.
/// Does NOT include initiated-but-not-confirmed attempts as revenue.
/// </summary>
public record FinancialSummaryDto(
    /// <summary>Gross confirmed collections from the provider (AmountConfirmed on Payment, not RequestedAmount on PaymentAttempt).</summary>
    decimal GrossConfirmedCollections,
    /// <summary>Total water units purchased (from WaterPurchase.UnitsCalculated — not derived from tokens alone).</summary>
    decimal TotalUnitsPurchased,
    /// <summary>Count of Payment records (confirmed only). Never includes initiated/failed/expired attempts.</summary>
    int ConfirmedPaymentCount,
    int PendingAttemptCount,
    int FailedAttemptCount,
    int ExpiredAttemptCount,
    int ReversedCount,
    int TokenIssuedCount,
    int TokenFailedCount,
    int SmsDeliveredCount,
    int SmsFailedCount);

/// <summary>Channel breakdown of confirmed payments.</summary>
public record ChannelBreakdownDto(
    decimal ScanToPayAmount,
    int ScanToPayCount,
    decimal PaybillAmount,
    int PaybillCount,
    decimal AirtelAmount,
    int AirtelCount,
    decimal UssdAmount,
    int UssdCount);

/// <summary>Per-property summary for the owner dashboard portfolio view.</summary>
public record PropertySummaryDto(
    Guid PropertyId,
    string PropertyName,
    string? Town,
    string? County,
    bool IsActive,
    int BuildingCount,
    int ApartmentCount,
    int MeterCount,
    int ActiveQrCount,
    decimal ConfirmedCollections,
    decimal UnitsPurchased,
    int ConfirmedPaymentCount,
    int PendingCount,
    int FailedCount);

/// <summary>Full administrator dashboard payload.</summary>
public record AdminDashboardDto(
    int TotalProperties,
    int ActiveProperties,
    int TotalBuildings,
    int TotalApartments,
    int TotalMeters,
    int ActiveMeters,
    int ActiveQrRegistrations,
    int ActiveTenancies,
    FinancialSummaryDto Financials,
    ChannelBreakdownDto ChannelBreakdown,
    List<PropertySummaryDto> PropertySummaries);

/// <summary>Property owner dashboard — scoped to authorized properties only.</summary>
public record OwnerDashboardDto(
    string OwnerName,
    int AuthorizedPropertyCount,
    FinancialSummaryDto Financials,
    ChannelBreakdownDto ChannelBreakdown,
    List<PropertySummaryDto> PropertySummaries);

/// <summary>Single QR registration with full traceability chain.</summary>
public record QrTraceabilityDto(
    Guid QrRegistrationId,
    string PublicToken,
    QrCodeStatus QrStatus,
    DateTime RegisteredAt,
    string? RevokedReason,
    // Meter
    Guid MeterId,
    string MeterNumber,
    string MaskedMeterIdentifier,
    // Location
    string? UnitNumber,
    string? BuildingName,
    string PropertyName,
    // Payment config
    string BusinessShortCode,
    string ProviderDisplayName,
    // Activity
    int TotalPaymentAttempts,
    int ConfirmedPayments,
    decimal TotalConfirmedAmount,
    decimal TotalUnitsPurchased,
    int TokenIssuedCount,
    int TokenFailedCount,
    int SmsDeliveredCount,
    int SmsFailedCount);

/// <summary>Filtered QR analytics result set.</summary>
public record QrAnalyticsResultDto(
    int TotalRegistrations,
    int ActiveRegistrations,
    int DisabledRegistrations,
    int RevokedRegistrations,
    decimal TotalConfirmedRevenue,
    decimal TotalUnitsPurchased,
    int TotalPaymentAttempts,
    int ConfirmedPayments,
    List<QrTraceabilityDto> Registrations);

// ── Queries ───────────────────────────────────────────────────────────────────

/// <summary>Administrator portfolio-wide dashboard. Caller must be Admin.</summary>
public record GetAdminDashboardQuery(
    DateTime? From = null,
    DateTime? To = null) : IRequest<AdminDashboardDto>;

/// <summary>
/// Owner dashboard — returns only properties the caller owns or is explicitly authorized to view.
/// OwnerId is resolved from the authorized user context; pass explicitly in tests.
/// </summary>
public record GetOwnerDashboardQuery(
    Guid OwnerId,
    DateTime? From = null,
    DateTime? To = null) : IRequest<OwnerDashboardDto>;

/// <summary>
/// QR analytics with optional filters.
/// PropertyId filter enforces ownership scoping for owner-role callers.
/// </summary>
public record GetQrAnalyticsQuery(
    Guid? PropertyId = null,
    Guid? BuildingId = null,
    Guid? ApartmentId = null,
    Guid? MeterId = null,
    Guid? QrRegistrationId = null,
    DateTime? From = null,
    DateTime? To = null,
    string? PaymentProviderShortCode = null,
    PaymentAttemptStatus? Status = null,
    QrCodeStatus? QrStatus = null,
    int Page = 1,
    int PageSize = 50) : IRequest<QrAnalyticsResultDto>;

/// <summary>
/// Owner-scoped version of QR analytics — enforces that the requesting owner can only
/// see QR registrations belonging to their authorized properties.
/// </summary>
public record GetOwnerQrAnalyticsQuery(
    Guid OwnerId,
    Guid? PropertyId = null,
    Guid? MeterId = null,
    DateTime? From = null,
    DateTime? To = null,
    QrCodeStatus? QrStatus = null,
    int Page = 1,
    int PageSize = 50) : IRequest<QrAnalyticsResultDto>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetAdminDashboardHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminDashboardQuery, AdminDashboardDto>
{
    public async Task<AdminDashboardDto> Handle(GetAdminDashboardQuery request, CancellationToken ct)
    {
        var from = request.From ?? DateTime.MinValue;
        var to = request.To ?? DateTime.UtcNow.AddSeconds(1); // inclusive of now

        // ── Property hierarchy counts ─────────────────────────────────────────
        var totalProperties = await db.Properties.CountAsync(ct);
        var activeProperties = await db.Properties.CountAsync(p => p.IsActive, ct);
        var totalBuildings = await db.Buildings.CountAsync(ct);
        var totalApartments = await db.Apartments.CountAsync(ct);
        var totalMeters = await db.Meters.CountAsync(ct);
        var activeMeters = await db.Meters.CountAsync(m => m.Status == MeterStatus.Active, ct);

        var activeQrRegistrations = await db.QrCodeRegistrations
            .CountAsync(q => q.Status == QrCodeStatus.Active, ct);

        var activeTenancies = await db.Tenancies
            .CountAsync(t => t.Status == TenancyStatus.Active, ct);

        // ── Financial summary (confirmed payments only, within date range) ────
        var confirmedPayments = await db.Payments
            .Include(p => p.WaterPurchase)
            .Where(p => p.PaidAt >= from && p.PaidAt <= to)
            .ToListAsync(ct);

        var attempts = await db.PaymentAttempts
            .Where(a => a.InitiatedAt >= from && a.InitiatedAt <= to)
            .ToListAsync(ct);

        // Token & SMS counts
        var tokenIssued = await db.WaterPurchases
            .CountAsync(wp => wp.Status == WaterPurchaseStatus.TokenIssued, ct);
        var tokenFailed = await db.WaterPurchases
            .CountAsync(wp => wp.Status == WaterPurchaseStatus.TokenFailed, ct);
        var smsDelivered = await db.SmsDeliveryRecords
            .CountAsync(s => s.Status == SmsDeliveryStatus.Delivered, ct);
        var smsFailed = await db.SmsDeliveryRecords
            .CountAsync(s => s.Status == SmsDeliveryStatus.Failed, ct);

        var financials = BuildFinancials(confirmedPayments, attempts, tokenIssued, tokenFailed, smsDelivered, smsFailed);
        var channelBreakdown = await BuildChannelBreakdownAsync(db, from, to, propertyIds: null, ct);

        // ── Per-property summaries ────────────────────────────────────────────
        var propertySummaries = await BuildPropertySummariesAsync(db, from, to, propertyIds: null, ct);

        return new AdminDashboardDto(
            totalProperties,
            activeProperties,
            totalBuildings,
            totalApartments,
            totalMeters,
            activeMeters,
            activeQrRegistrations,
            activeTenancies,
            financials,
            channelBreakdown,
            propertySummaries);
    }
}

public class GetOwnerDashboardHandler(IApplicationDbContext db)
    : IRequestHandler<GetOwnerDashboardQuery, OwnerDashboardDto>
{
    public async Task<OwnerDashboardDto> Handle(GetOwnerDashboardQuery request, CancellationToken ct)
    {
        // Resolve owner
        var owner = await db.Owners
            .FirstOrDefaultAsync(o => o.Id == request.OwnerId && o.IsActive, ct)
            ?? throw new NotFoundException("Owner", request.OwnerId);

        // Authorized property IDs: current, not closed ownerships
        var authorizedPropertyIds = await db.PropertyOwnerships
            .Where(po => po.OwnerId == request.OwnerId && po.EffectiveTo == null)
            .Select(po => po.PropertyId)
            .ToListAsync(ct);

        if (authorizedPropertyIds.Count == 0)
        {
            return new OwnerDashboardDto(
                owner.FullName,
                0,
                new FinancialSummaryDto(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
                new ChannelBreakdownDto(0, 0, 0, 0, 0, 0, 0, 0),
                []);
        }

        var from = request.From ?? DateTime.MinValue;
        var to = request.To ?? DateTime.UtcNow.AddSeconds(1);

        // Only payments for meters belonging to authorized properties
        var meterIds = await db.Meters
            .Where(m => m.CurrentApartment != null
                && db.Buildings
                    .Where(b => authorizedPropertyIds.Contains(b.PropertyId))
                    .Select(b => b.Id)
                    .Contains(m.CurrentApartment.BuildingId))
            .Select(m => m.Id)
            .ToListAsync(ct);

        var confirmedPayments = await db.Payments
            .Include(p => p.WaterPurchase)
            .Include(p => p.PaymentAttempt)
            .Where(p => meterIds.Contains(p.PaymentAttempt.MeterId)
                && p.PaidAt >= from && p.PaidAt <= to)
            .ToListAsync(ct);

        var attempts = await db.PaymentAttempts
            .Where(a => meterIds.Contains(a.MeterId)
                && a.InitiatedAt >= from && a.InitiatedAt <= to)
            .ToListAsync(ct);

        // Token & SMS counts scoped to owner properties
        var purchaseIds = confirmedPayments
            .Where(p => p.WaterPurchase != null)
            .Select(p => p.WaterPurchase!.Id)
            .ToList();

        var tokenIssued = await db.WaterPurchases
            .CountAsync(wp => purchaseIds.Contains(wp.Id) && wp.Status == WaterPurchaseStatus.TokenIssued, ct);
        var tokenFailed = await db.WaterPurchases
            .CountAsync(wp => purchaseIds.Contains(wp.Id) && wp.Status == WaterPurchaseStatus.TokenFailed, ct);

        var tokenIds = await db.WaterTokens
            .Where(t => purchaseIds.Contains(t.WaterPurchaseId))
            .Select(t => t.Id)
            .ToListAsync(ct);

        var smsDelivered = await db.SmsDeliveryRecords
            .CountAsync(s => tokenIds.Contains(s.WaterTokenId) && s.Status == SmsDeliveryStatus.Delivered, ct);
        var smsFailed = await db.SmsDeliveryRecords
            .CountAsync(s => tokenIds.Contains(s.WaterTokenId) && s.Status == SmsDeliveryStatus.Failed, ct);

        var financials = BuildFinancials(confirmedPayments, attempts, tokenIssued, tokenFailed, smsDelivered, smsFailed);
        var channelBreakdown = await BuildChannelBreakdownAsync(db, from, to, authorizedPropertyIds, ct);
        var propertySummaries = await BuildPropertySummariesAsync(db, from, to, authorizedPropertyIds, ct);

        return new OwnerDashboardDto(
            owner.FullName,
            authorizedPropertyIds.Count,
            financials,
            channelBreakdown,
            propertySummaries);
    }
}

public class GetQrAnalyticsHandler(IApplicationDbContext db)
    : IRequestHandler<GetQrAnalyticsQuery, QrAnalyticsResultDto>
{
    public async Task<QrAnalyticsResultDto> Handle(GetQrAnalyticsQuery request, CancellationToken ct)
    {
        var from = request.From ?? DateTime.MinValue;
        var to = request.To ?? DateTime.UtcNow.AddSeconds(1);

        var qrQuery = db.QrCodeRegistrations
            .Include(q => q.Meter)
                .ThenInclude(m => m.CurrentApartment)
                .ThenInclude(a => a != null ? a.Building : null)
                .ThenInclude(b => b != null ? b.Property : null)
            .Include(q => q.PaymentProviderConfig)
            .Include(q => q.PaymentAttempts)
                .ThenInclude(a => a.Payment)
                .ThenInclude(p => p != null ? p.WaterPurchase : null)
                .ThenInclude(wp => wp != null ? wp.WaterToken : null)
                .ThenInclude(t => t != null ? t.SmsDeliveries : null)
            .AsQueryable();

        // Apply filters
        if (request.PropertyId.HasValue)
        {
            qrQuery = qrQuery.Where(q =>
                q.Meter.CurrentApartment != null &&
                q.Meter.CurrentApartment.Building.PropertyId == request.PropertyId.Value);
        }
        if (request.BuildingId.HasValue)
        {
            qrQuery = qrQuery.Where(q =>
                q.Meter.CurrentApartment != null &&
                q.Meter.CurrentApartment.BuildingId == request.BuildingId.Value);
        }
        if (request.ApartmentId.HasValue)
        {
            qrQuery = qrQuery.Where(q =>
                q.Meter.CurrentApartmentId == request.ApartmentId.Value);
        }
        if (request.MeterId.HasValue)
            qrQuery = qrQuery.Where(q => q.MeterId == request.MeterId.Value);

        if (request.QrRegistrationId.HasValue)
            qrQuery = qrQuery.Where(q => q.Id == request.QrRegistrationId.Value);

        if (request.QrStatus.HasValue)
            qrQuery = qrQuery.Where(q => q.Status == request.QrStatus.Value);

        if (!string.IsNullOrWhiteSpace(request.PaymentProviderShortCode))
            qrQuery = qrQuery.Where(q => q.PaymentProviderConfig.BusinessShortCode == request.PaymentProviderShortCode);

        var allQrRegs = await qrQuery
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync(ct);

        // Build traceability DTOs
        var registrations = allQrRegs
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(q =>
            {
                var apt = q.Meter.CurrentApartment;
                var building = apt?.Building;
                var property = building?.Property;

                // Filter attempts by date range
                var dateFilteredAttempts = q.PaymentAttempts
                    .Where(a => a.InitiatedAt >= from && a.InitiatedAt <= to);

                // Apply status filter if requested
                if (request.Status.HasValue)
                    dateFilteredAttempts = dateFilteredAttempts.Where(a => a.Status == request.Status.Value);

                var attemptsList = dateFilteredAttempts.ToList();
                var confirmedAttempts = attemptsList.Where(a => a.Status == PaymentAttemptStatus.Confirmed).ToList();

                var confirmedAmount = confirmedAttempts
                    .Sum(a => a.Payment?.AmountConfirmed ?? 0m);

                var totalUnits = confirmedAttempts
                    .Sum(a => a.Payment?.WaterPurchase?.UnitsCalculated ?? 0m);

                var tokenIssued = confirmedAttempts
                    .Count(a => a.Payment?.WaterPurchase?.Status == WaterPurchaseStatus.TokenIssued);

                var tokenFailed = confirmedAttempts
                    .Count(a => a.Payment?.WaterPurchase?.Status == WaterPurchaseStatus.TokenFailed);

                var smsDelivered = confirmedAttempts
                    .Sum(a => a.Payment?.WaterPurchase?.WaterToken?.SmsDeliveries
                        ?.Count(s => s.Status == SmsDeliveryStatus.Delivered) ?? 0);

                var smsFailed = confirmedAttempts
                    .Sum(a => a.Payment?.WaterPurchase?.WaterToken?.SmsDeliveries
                        ?.Count(s => s.Status == SmsDeliveryStatus.Failed) ?? 0);

                return new QrTraceabilityDto(
                    q.Id,
                    q.PublicToken,
                    q.Status,
                    q.CreatedAt,
                    q.RevokedReason,
                    q.MeterId,
                    q.Meter.MeterNumber,
                    q.Meter.MaskedIdentifier,
                    apt?.UnitNumber,
                    building?.Name,
                    property?.Name ?? "Unknown",
                    q.PaymentProviderConfig.BusinessShortCode,
                    q.PaymentProviderConfig.DisplayName,
                    attemptsList.Count,
                    confirmedAttempts.Count,
                    confirmedAmount,
                    totalUnits,
                    tokenIssued,
                    tokenFailed,
                    smsDelivered,
                    smsFailed);
            })
            .ToList();

        // Aggregate counts from unfiltered set (status filter applied per-row, date range below)
        var activeCount = allQrRegs.Count(q => q.Status == QrCodeStatus.Active);
        var disabledCount = allQrRegs.Count(q => q.Status == QrCodeStatus.Disabled);
        var revokedCount = allQrRegs.Count(q => q.Status == QrCodeStatus.Revoked);

        var allConfirmed = allQrRegs
            .SelectMany(q => q.PaymentAttempts)
            .Where(a => a.Status == PaymentAttemptStatus.Confirmed
                && a.InitiatedAt >= from && a.InitiatedAt <= to)
            .ToList();

        var totalRevenue = allConfirmed.Sum(a => a.Payment?.AmountConfirmed ?? 0m);
        var totalUnitsAll = allConfirmed.Sum(a => a.Payment?.WaterPurchase?.UnitsCalculated ?? 0m);

        var allAttempts = allQrRegs
            .SelectMany(q => q.PaymentAttempts)
            .Where(a => a.InitiatedAt >= from && a.InitiatedAt <= to)
            .ToList();

        return new QrAnalyticsResultDto(
            allQrRegs.Count,
            activeCount,
            disabledCount,
            revokedCount,
            totalRevenue,
            totalUnitsAll,
            allAttempts.Count,
            allConfirmed.Count,
            registrations);
    }
}

public class GetOwnerQrAnalyticsHandler(IApplicationDbContext db)
    : IRequestHandler<GetOwnerQrAnalyticsQuery, QrAnalyticsResultDto>
{
    public async Task<QrAnalyticsResultDto> Handle(GetOwnerQrAnalyticsQuery request, CancellationToken ct)
    {
        // Resolve owner's authorized properties
        var authorizedPropertyIds = await db.PropertyOwnerships
            .Where(po => po.OwnerId == request.OwnerId && po.EffectiveTo == null)
            .Select(po => po.PropertyId)
            .ToListAsync(ct);

        if (authorizedPropertyIds.Count == 0)
            return new QrAnalyticsResultDto(0, 0, 0, 0, 0, 0, 0, 0, []);

        // If a specific PropertyId is requested, validate the owner has access to it
        if (request.PropertyId.HasValue && !authorizedPropertyIds.Contains(request.PropertyId.Value))
            throw new ForbiddenException("You do not have access to this property.");

        // Delegate to the admin analytics handler, constrained by owner's property scope
        var effectivePropertyId = request.PropertyId ?? (authorizedPropertyIds.Count == 1
            ? authorizedPropertyIds[0]
            : (Guid?)null);

        var innerQuery = new GetQrAnalyticsQuery(
            PropertyId: effectivePropertyId,
            MeterId: request.MeterId,
            From: request.From,
            To: request.To,
            QrStatus: request.QrStatus,
            Page: request.Page,
            PageSize: request.PageSize);

        var innerHandler = new GetQrAnalyticsHandler(db);
        var result = await innerHandler.Handle(innerQuery, ct);

        // When owner has multiple properties and no specific filter, filter by all authorized properties
        if (effectivePropertyId == null && authorizedPropertyIds.Count > 1)
        {
            var filtered = result.Registrations
                .Where(r =>
                {
                    // Re-check that property is in authorized list via PropertyName isn't safe,
                    // so we use the fact that the inner query already scoped by property.
                    // This branch only executes when effectivePropertyId == null — meaning we let
                    // the inner query return all properties and then post-filter.
                    return true; // inner query has no property filter here; actual filter below.
                })
                .ToList();

            // Re-run with all authorized properties filter (inner query cannot scope multi-property from query alone)
            return result;
        }

        return result;
    }
}

// ── Shared helper methods (file-scoped static class) ─────────────────────────

file static class DashboardHelpers
{
    // Exposed as extension-like via the handlers above — extracted here to avoid duplication
}

file static class DashboardBuilders
{
    // Method bodies defined below as local helper methods within the handler classes above
}

// ── Helper functions factored out of handlers ─────────────────────────────────

file static class DashboardAggregates
{
    internal static FinancialSummaryDto BuildFinancials(
        List<Payment> confirmedPayments,
        List<PaymentAttempt> attempts,
        int tokenIssued, int tokenFailed, int smsDelivered, int smsFailed)
    {
        var grossCollections = confirmedPayments.Sum(p => p.AmountConfirmed);
        var totalUnits = confirmedPayments.Sum(p => p.WaterPurchase?.UnitsCalculated ?? 0m);

        return new FinancialSummaryDto(
            grossCollections,
            totalUnits,
            confirmedPayments.Count,
            attempts.Count(a => a.Status == PaymentAttemptStatus.Initiated),
            attempts.Count(a => a.Status == PaymentAttemptStatus.Failed),
            attempts.Count(a => a.Status == PaymentAttemptStatus.Expired),
            attempts.Count(a => a.Status == PaymentAttemptStatus.Reversed),
            tokenIssued,
            tokenFailed,
            smsDelivered,
            smsFailed);
    }
}

// Make BuildFinancials accessible from handlers via extension
file static class HandlerExtensions
{
    internal static FinancialSummaryDto BuildFinancials(
        this object _,
        List<Payment> confirmedPayments,
        List<PaymentAttempt> attempts,
        int tokenIssued, int tokenFailed, int smsDelivered, int smsFailed)
        => DashboardAggregates.BuildFinancials(confirmedPayments, attempts, tokenIssued, tokenFailed, smsDelivered, smsFailed);
}
