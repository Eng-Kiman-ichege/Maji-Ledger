using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.RentLedger;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public enum ArrearsAgeBucket
{
    NotDue      = 0,
    Current     = 1,  // Due but ≤ 30 days
    Days31to60  = 2,
    Days61to90  = 3,
    Over90Days  = 4
}

public record ArrearsLineDto(
    Guid ChargeId,
    string ChargeReference,
    string BillingPeriod,
    DateTime DueDate,
    decimal Outstanding,
    int DaysOverdue,
    ArrearsAgeBucket AgeBucket);

public record TenantArrearsDto(
    Guid TenantId,
    string TenantName,
    string PhoneNumber,
    Guid TenancyId,
    string? TenancyReference,
    Guid ApartmentId,
    string UnitNumber,
    Guid PropertyId,
    string PropertyName,
    decimal TotalOutstanding,
    decimal NotDue,
    decimal Current,
    decimal Days31to60,
    decimal Days61to90,
    decimal Over90Days,
    List<ArrearsLineDto> Lines);

public record ArrearsReportDto(
    DateTime AsOf,
    int TenantCount,
    decimal TotalOutstanding,
    decimal NotDue,
    decimal Current,
    decimal Days31to60,
    decimal Days61to90,
    decimal Over90Days,
    List<TenantArrearsDto> Tenants);

public record TenantStatementDto(
    Guid TenantId,
    string TenantName,
    string PhoneNumber,
    Guid TenancyId,
    string? TenancyReference,
    string UnitNumber,
    string PropertyName,
    DateTime StartDate,
    DateTime StatementDate,
    decimal MonthlyRent,
    decimal TotalCharged,
    decimal TotalPaid,
    decimal TotalOutstanding,
    List<StatementLineDto> Lines);

public record StatementLineDto(
    string Type,          // "Charge" | "Payment" | "Credit"
    string Reference,
    string? Description,
    string BillingPeriod,
    DateTime Date,
    decimal Debit,
    decimal Credit,
    decimal RunningBalance);

public record RentDashboardDto(
    int ActiveTenancies,
    decimal TotalRentRoll,
    decimal CollectedThisMonth,
    decimal OutstandingBalance,
    decimal OverdueBalance,
    int TenanciesInArrears,
    List<MonthlyCollectionDto> LastSixMonths);

public record MonthlyCollectionDto(string Period, decimal Charged, decimal Collected);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetArrearsReportQuery(
    Guid? PropertyId = null,
    DateTime? AsOf = null) : IRequest<ArrearsReportDto>;

public record GetTenantStatementQuery(
    Guid TenancyId,
    DateTime? FromDate = null,
    DateTime? ToDate = null) : IRequest<TenantStatementDto>;

public record GetRentDashboardQuery(
    Guid? PropertyId = null) : IRequest<RentDashboardDto>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetArrearsReportQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetArrearsReportQuery, ArrearsReportDto>
{
    public async Task<ArrearsReportDto> Handle(GetArrearsReportQuery request, CancellationToken ct)
    {
        var asOf = request.AsOf?.ToUniversalTime() ?? DateTime.UtcNow;

        var chargesQuery = db.RentCharges
            .Include(c => c.Tenancy)
            .Include(c => c.Tenant)
            .Include(c => c.Property)
            .Include(c => c.Apartment)
            .Where(c => c.Status != RentChargeStatus.Paid && c.Status != RentChargeStatus.Cancelled)
            .AsNoTracking();

        if (request.PropertyId.HasValue)
        {
            if (!currentUser.HasPropertyAccess(request.PropertyId.Value))
                throw new ForbiddenException("You do not have access to this property.");
            chargesQuery = chargesQuery.Where(c => c.PropertyId == request.PropertyId.Value);
        }
        else if (currentUser.Role == "Owner")
        {
            var allowed = currentUser.AuthorizedPropertyIds;
            chargesQuery = chargesQuery.Where(c => allowed.Contains(c.PropertyId));
        }

        var charges = await chargesQuery.ToListAsync(ct);

        // Group by tenancy
        var grouped = charges
            .GroupBy(c => c.TenancyId)
            .Select(g =>
            {
                var first = g.First();
                var lines = g.Select(c =>
                {
                    var daysOverdue   = c.DueDate < asOf ? (int)(asOf - c.DueDate).TotalDays : 0;
                    var ageBucket     = ClassifyAge(c.DueDate, asOf);
                    return new ArrearsLineDto(c.Id, c.ChargeReference, c.BillingPeriod,
                        c.DueDate, c.OutstandingAmount, daysOverdue, ageBucket);
                }).OrderBy(l => l.DueDate).ToList();

                var buckets = Bucket(lines);

                return new TenantArrearsDto(
                    first.TenantId, first.Tenant.FullName, first.Tenant.PhoneNumber,
                    first.TenancyId, first.Tenancy.TenancyReference,
                    first.ApartmentId, first.Apartment.UnitNumber,
                    first.PropertyId, first.Property.Name,
                    lines.Sum(l => l.Outstanding),
                    buckets[ArrearsAgeBucket.NotDue],
                    buckets[ArrearsAgeBucket.Current],
                    buckets[ArrearsAgeBucket.Days31to60],
                    buckets[ArrearsAgeBucket.Days61to90],
                    buckets[ArrearsAgeBucket.Over90Days],
                    lines);
            })
            .OrderByDescending(t => t.TotalOutstanding)
            .ToList();

        return new ArrearsReportDto(
            asOf,
            grouped.Count,
            grouped.Sum(t => t.TotalOutstanding),
            grouped.Sum(t => t.NotDue),
            grouped.Sum(t => t.Current),
            grouped.Sum(t => t.Days31to60),
            grouped.Sum(t => t.Days61to90),
            grouped.Sum(t => t.Over90Days),
            grouped);
    }

    private static ArrearsAgeBucket ClassifyAge(DateTime dueDate, DateTime asOf)
    {
        if (dueDate >= asOf)       return ArrearsAgeBucket.NotDue;
        var days = (int)(asOf - dueDate).TotalDays;
        return days switch
        {
            <= 30  => ArrearsAgeBucket.Current,
            <= 60  => ArrearsAgeBucket.Days31to60,
            <= 90  => ArrearsAgeBucket.Days61to90,
            _      => ArrearsAgeBucket.Over90Days
        };
    }

    private static Dictionary<ArrearsAgeBucket, decimal> Bucket(List<ArrearsLineDto> lines)
    {
        var dict = new Dictionary<ArrearsAgeBucket, decimal>
        {
            [ArrearsAgeBucket.NotDue]     = 0m,
            [ArrearsAgeBucket.Current]    = 0m,
            [ArrearsAgeBucket.Days31to60] = 0m,
            [ArrearsAgeBucket.Days61to90] = 0m,
            [ArrearsAgeBucket.Over90Days] = 0m,
        };
        foreach (var l in lines)
            dict[l.AgeBucket] += l.Outstanding;
        return dict;
    }
}

public class GetTenantStatementQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetTenantStatementQuery, TenantStatementDto>
{
    public async Task<TenantStatementDto> Handle(GetTenantStatementQuery request, CancellationToken ct)
    {
        var tenancy = await db.Tenancies
            .Include(t => t.Tenant)
            .Include(t => t.Apartment).ThenInclude(a => a.Building).ThenInclude(b => b.Property)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == request.TenancyId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.Tenancy), request.TenancyId);

        if (!currentUser.HasPropertyAccess(tenancy.Apartment.Building.PropertyId))
            throw new ForbiddenException("You do not have access to this tenancy.");

        var from = request.FromDate?.ToUniversalTime() ?? tenancy.StartDate;
        var to   = request.ToDate?.ToUniversalTime()   ?? DateTime.UtcNow;

        var charges = await db.RentCharges
            .Where(c => c.TenancyId == request.TenancyId &&
                        c.Status != RentChargeStatus.Cancelled &&
                        c.BillingDate >= from && c.BillingDate <= to)
            .OrderBy(c => c.BillingDate)
            .AsNoTracking()
            .ToListAsync(ct);

        var payments = await db.RentPayments
            .Where(p => p.TenancyId == request.TenancyId &&
                        p.PaymentStatus == RentPaymentStatus.Confirmed &&
                        p.PaymentDate >= from && p.PaymentDate <= to)
            .OrderBy(p => p.PaymentDate)
            .AsNoTracking()
            .ToListAsync(ct);

        var credits = await db.TenantCredits
            .Where(c => c.TenancyId == request.TenancyId &&
                        c.CreatedAt >= from && c.CreatedAt <= to)
            .OrderBy(c => c.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        // Build merged statement lines
        var allEvents = new List<StatementLineDto>();
        decimal balance = 0m;

        foreach (var c in charges)
        {
            balance += c.Amount;
            allEvents.Add(new StatementLineDto("Charge", c.ChargeReference, c.Description,
                c.BillingPeriod, c.BillingDate, c.Amount, 0m, balance));
        }

        foreach (var p in payments)
        {
            balance -= p.Amount;
            allEvents.Add(new StatementLineDto("Payment", p.PaymentReference,
                $"Payment via {p.PaymentMethod}", "", p.PaymentDate, 0m, p.Amount, balance));
        }

        foreach (var cr in credits)
        {
            balance -= cr.OriginalAmount;
            allEvents.Add(new StatementLineDto("Credit", cr.CreditReference, cr.Reason,
                "", cr.CreatedAt, 0m, cr.OriginalAmount, balance));
        }

        allEvents.Sort((a, b) => a.Date.CompareTo(b.Date));

        // Recalculate running balance in order
        balance = 0m;
        var lines = allEvents.Select(e =>
        {
            balance += e.Debit - e.Credit;
            return e with { RunningBalance = balance };
        }).ToList();

        return new TenantStatementDto(
            tenancy.TenantId, tenancy.Tenant.FullName, tenancy.Tenant.PhoneNumber,
            tenancy.Id, tenancy.TenancyReference,
            tenancy.Apartment.UnitNumber, tenancy.Apartment.Building.Property.Name,
            tenancy.StartDate, DateTime.UtcNow,
            tenancy.MonthlyRent,
            charges.Sum(c => c.Amount),
            payments.Sum(p => p.Amount),
            charges.Sum(c => c.OutstandingAmount),
            lines);
    }
}

public class GetRentDashboardQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetRentDashboardQuery, RentDashboardDto>
{
    public async Task<RentDashboardDto> Handle(GetRentDashboardQuery request, CancellationToken ct)
    {
        var now         = DateTime.UtcNow;
        var currentPeriod = now.ToString("yyyy-MM");

        var tenanciesQuery = db.Tenancies
            .Include(t => t.Apartment).ThenInclude(a => a.Building)
            .Where(t => t.Status == TenancyStatus.Active);

        if (request.PropertyId.HasValue)
        {
            if (!currentUser.HasPropertyAccess(request.PropertyId.Value))
                throw new ForbiddenException("You do not have access to this property.");
            tenanciesQuery = tenanciesQuery.Where(t => t.Apartment.Building.PropertyId == request.PropertyId.Value);
        }
        else if (currentUser.Role == "Owner")
        {
            var allowed = currentUser.AuthorizedPropertyIds;
            tenanciesQuery = tenanciesQuery.Where(t => allowed.Contains(t.Apartment.Building.PropertyId));
        }

        var activeTenancies = await tenanciesQuery.ToListAsync(ct);
        var tenancyIds      = activeTenancies.Select(t => t.Id).ToList();

        // This month collected
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var collectedThisMonth = await db.RentPayments
            .Where(p => tenancyIds.Contains(p.TenancyId) &&
                        p.PaymentStatus == RentPaymentStatus.Confirmed &&
                        p.PaymentDate >= monthStart)
            .SumAsync(p => p.Amount, ct);

        // Open charges
        var openCharges = await db.RentCharges
            .Where(c => tenancyIds.Contains(c.TenancyId) &&
                        c.Status != RentChargeStatus.Paid &&
                        c.Status != RentChargeStatus.Cancelled)
            .ToListAsync(ct);

        var overdueCharges   = openCharges.Where(c => c.DueDate < now).ToList();
        var tenanciesInArrears = overdueCharges.Select(c => c.TenancyId).Distinct().Count();

        // Last 6 months
        var sixMonthsData = new List<MonthlyCollectionDto>();
        for (var i = 5; i >= 0; i--)
        {
            var d       = now.AddMonths(-i);
            var period  = d.ToString("yyyy-MM");
            var mStart  = new DateTime(d.Year, d.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var mEnd    = mStart.AddMonths(1);

            var charged = await db.RentCharges
                .Where(c => tenancyIds.Contains(c.TenancyId) &&
                            c.BillingPeriod == period &&
                            c.Status != RentChargeStatus.Cancelled)
                .SumAsync(c => c.Amount, ct);

            var collected = await db.RentPayments
                .Where(p => tenancyIds.Contains(p.TenancyId) &&
                            p.PaymentStatus == RentPaymentStatus.Confirmed &&
                            p.PaymentDate >= mStart && p.PaymentDate < mEnd)
                .SumAsync(p => p.Amount, ct);

            sixMonthsData.Add(new MonthlyCollectionDto(period, charged, collected));
        }

        return new RentDashboardDto(
            activeTenancies.Count,
            activeTenancies.Sum(t => t.MonthlyRent),
            collectedThisMonth,
            openCharges.Sum(c => c.OutstandingAmount),
            overdueCharges.Sum(c => c.OutstandingAmount),
            tenanciesInArrears,
            sixMonthsData);
    }
}
