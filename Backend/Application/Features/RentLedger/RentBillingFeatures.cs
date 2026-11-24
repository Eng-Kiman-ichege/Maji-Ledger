using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.RentLedger;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record RentChargeDto(
    Guid Id,
    string ChargeReference,
    Guid TenancyId,
    string? TenancyReference,
    Guid TenantId,
    string TenantName,
    Guid PropertyId,
    string PropertyName,
    Guid ApartmentId,
    string UnitNumber,
    string BillingPeriod,
    DateTime BillingDate,
    DateTime DueDate,
    decimal Amount,
    decimal AmountPaid,
    decimal OutstandingAmount,
    RentChargeStatus Status,
    string? Description,
    DateTime CreatedAt);

public record PaymentAllocationSummaryDto(
    Guid Id,
    Guid PaymentId,
    string PaymentReference,
    string ReceiptNumber,
    decimal AllocatedAmount,
    DateTime AllocatedAt,
    bool IsReversed);

public record RentChargeDetailDto(
    Guid Id,
    string ChargeReference,
    Guid TenancyId,
    string? TenancyReference,
    Guid TenantId,
    string TenantName,
    Guid PropertyId,
    string PropertyName,
    Guid ApartmentId,
    string UnitNumber,
    string BillingPeriod,
    DateTime BillingDate,
    DateTime DueDate,
    decimal Amount,
    decimal AmountPaid,
    decimal OutstandingAmount,
    RentChargeStatus Status,
    string? Description,
    string? CancellationReason,
    DateTime CreatedAt,
    List<PaymentAllocationSummaryDto> Allocations);

public record GenerateChargesResultDto(
    int GeneratedCount,
    int SkippedCount,
    decimal TotalBilled,
    List<string> ChargeReferences);

// ── Commands ──────────────────────────────────────────────────────────────────

public record GenerateMonthlyRentChargesCommand(
    string BillingPeriod,
    Guid? PropertyId = null) : IRequest<GenerateChargesResultDto>;

public record CreateManualRentChargeCommand(
    Guid TenancyId,
    string BillingPeriod,
    DateTime BillingDate,
    DateTime DueDate,
    decimal Amount,
    string? Description = null) : IRequest<RentChargeDto>;

public record CancelRentChargeCommand(
    Guid Id,
    string Reason) : IRequest<Unit>;

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetRentChargesQuery(
    Guid? PropertyId = null,
    Guid? TenancyId = null,
    Guid? TenantId = null,
    string? BillingPeriod = null,
    RentChargeStatus? Status = null) : IRequest<List<RentChargeDto>>;

public record GetRentChargeByIdQuery(Guid Id) : IRequest<RentChargeDetailDto>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GenerateMonthlyRentChargesCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GenerateMonthlyRentChargesCommand, GenerateChargesResultDto>
{
    public async Task<GenerateChargesResultDto> Handle(
        GenerateMonthlyRentChargesCommand request, CancellationToken ct)
    {
        var parts = request.BillingPeriod.Split('-');
        if (parts.Length != 2 ||
            !int.TryParse(parts[0], out var year) ||
            !int.TryParse(parts[1], out var month) ||
            month < 1 || month > 12)
        {
            throw new ValidationException("BillingPeriod",
                "Billing period must follow 'YYYY-MM' format (e.g. 2026-11).");
        }

        var periodStart   = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var daysInMonth   = DateTime.DaysInMonth(year, month);
        var periodEnd     = new DateTime(year, month, daysInMonth, 23, 59, 59, DateTimeKind.Utc);

        var tenanciesQuery = db.Tenancies
            .Include(t => t.Apartment).ThenInclude(a => a.Building).ThenInclude(b => b.Property)
            .Include(t => t.Tenant)
            .Where(t => t.Status == TenancyStatus.Active && t.StartDate <= periodEnd);

        if (request.PropertyId.HasValue)
        {
            if (!currentUser.HasPropertyAccess(request.PropertyId.Value))
                throw new ForbiddenException("You do not have access to this property.");

            tenanciesQuery = tenanciesQuery
                .Where(t => t.Apartment.Building.PropertyId == request.PropertyId.Value);
        }
        else if (currentUser.Role == "Owner")
        {
            var allowed = currentUser.AuthorizedPropertyIds;
            tenanciesQuery = tenanciesQuery
                .Where(t => allowed.Contains(t.Apartment.Building.PropertyId));
        }

        var tenancies = await tenanciesQuery.ToListAsync(ct);

        var existingTenancyIds = await db.RentCharges
            .Where(c => c.BillingPeriod == request.BillingPeriod
                     && c.Status != RentChargeStatus.Cancelled)
            .Select(c => c.TenancyId)
            .ToListAsync(ct);

        var existingSet  = new HashSet<Guid>(existingTenancyIds);
        var generated    = 0;
        var skipped      = 0;
        var totalBilled  = 0m;
        var references   = new List<string>();
        var rng          = new Random();

        foreach (var tenancy in tenancies)
        {
            if (existingSet.Contains(tenancy.Id)) { skipped++; continue; }

            var effectiveStart = tenancy.StartDate > periodStart ? tenancy.StartDate : periodStart;
            var effectiveEnd   = tenancy.ExpectedEndDate.HasValue && tenancy.ExpectedEndDate.Value < periodEnd
                ? tenancy.ExpectedEndDate.Value : periodEnd;

            if (effectiveEnd < effectiveStart) { skipped++; continue; }

            var daysActive = (int)(effectiveEnd.Date - effectiveStart.Date).TotalDays + 1;
            var amount     = daysActive >= daysInMonth
                ? tenancy.MonthlyRent
                : Math.Round(tenancy.MonthlyRent / daysInMonth * daysActive, 2);

            if (amount <= 0) { skipped++; continue; }

            var dueDay  = Math.Min(tenancy.RentPaymentDueDay, daysInMonth);
            var dueDate = new DateTime(year, month, dueDay, 23, 59, 59, DateTimeKind.Utc);
            if (dueDate < effectiveStart) dueDate = effectiveStart.AddDays(7);

            var chargeRef = $"CHG-{year}{month:D2}-{rng.Next(1000, 9999)}-{generated + 1:D3}";
            var desc      = daysActive < daysInMonth
                ? $"Prorated rent for {request.BillingPeriod} ({daysActive}/{daysInMonth} days)"
                : $"Monthly rent for {request.BillingPeriod}";

            var charge = RentCharge.Create(
                chargeReference: chargeRef,
                tenancyId: tenancy.Id,
                tenantId: tenancy.TenantId,
                propertyId: tenancy.Apartment.Building.PropertyId,
                apartmentId: tenancy.ApartmentId,
                billingPeriod: request.BillingPeriod,
                billingDate: effectiveStart,
                dueDate: dueDate,
                amount: amount,
                description: desc,
                createdBy: currentUser.UserId);

            db.RentCharges.Add(charge);
            generated++;
            totalBilled += amount;
            references.Add(chargeRef);
        }

        if (generated > 0)
            await db.SaveChangesAsync(ct);

        return new GenerateChargesResultDto(generated, skipped, totalBilled, references);
    }
}

public class CreateManualRentChargeCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<CreateManualRentChargeCommand, RentChargeDto>
{
    public async Task<RentChargeDto> Handle(CreateManualRentChargeCommand request, CancellationToken ct)
    {
        var tenancy = await db.Tenancies
            .Include(t => t.Apartment).ThenInclude(a => a.Building).ThenInclude(b => b.Property)
            .Include(t => t.Tenant)
            .FirstOrDefaultAsync(t => t.Id == request.TenancyId, ct)
            ?? throw new NotFoundException(nameof(Tenancy), request.TenancyId);

        if (!currentUser.HasPropertyAccess(tenancy.Apartment.Building.PropertyId))
            throw new ForbiddenException("You do not have access to create charges for this property.");

        var chargeRef = $"CHG-MAN-{DateTime.UtcNow:yyyyMM}-{new Random().Next(10000, 99999)}";

        var charge = RentCharge.Create(
            chargeReference: chargeRef,
            tenancyId: tenancy.Id,
            tenantId: tenancy.TenantId,
            propertyId: tenancy.Apartment.Building.PropertyId,
            apartmentId: tenancy.ApartmentId,
            billingPeriod: request.BillingPeriod,
            billingDate: request.BillingDate,
            dueDate: request.DueDate,
            amount: request.Amount,
            description: request.Description,
            createdBy: currentUser.UserId);

        db.RentCharges.Add(charge);
        await db.SaveChangesAsync(ct);

        return MapToDto(charge, tenancy);
    }

    private static RentChargeDto MapToDto(RentCharge c, Tenancy tenancy) => new(
        c.Id, c.ChargeReference, c.TenancyId, tenancy.TenancyReference,
        c.TenantId, tenancy.Tenant.FullName,
        c.PropertyId, tenancy.Apartment.Building.Property.Name,
        c.ApartmentId, tenancy.Apartment.UnitNumber,
        c.BillingPeriod, c.BillingDate, c.DueDate,
        c.Amount, c.AmountPaid, c.OutstandingAmount,
        c.Status, c.Description, c.CreatedAt);
}

public class CancelRentChargeCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<CancelRentChargeCommand, Unit>
{
    public async Task<Unit> Handle(CancelRentChargeCommand request, CancellationToken ct)
    {
        var charge = await db.RentCharges.FirstOrDefaultAsync(c => c.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(RentCharge), request.Id);

        if (!currentUser.HasPropertyAccess(charge.PropertyId))
            throw new ForbiddenException("You do not have access to modify charges for this property.");

        charge.Cancel(request.Reason);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class GetRentChargesQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetRentChargesQuery, List<RentChargeDto>>
{
    public async Task<List<RentChargeDto>> Handle(GetRentChargesQuery request, CancellationToken ct)
    {
        var query = db.RentCharges
            .Include(c => c.Tenancy)
            .Include(c => c.Tenant)
            .Include(c => c.Property)
            .Include(c => c.Apartment)
            .AsNoTracking();

        if (request.PropertyId.HasValue)
        {
            if (!currentUser.HasPropertyAccess(request.PropertyId.Value))
                throw new ForbiddenException("You do not have access to this property.");
            query = query.Where(c => c.PropertyId == request.PropertyId.Value);
        }
        else if (currentUser.Role == "Owner")
        {
            var allowed = currentUser.AuthorizedPropertyIds;
            query = query.Where(c => allowed.Contains(c.PropertyId));
        }

        if (request.TenancyId.HasValue)   query = query.Where(c => c.TenancyId == request.TenancyId.Value);
        if (request.TenantId.HasValue)     query = query.Where(c => c.TenantId  == request.TenantId.Value);
        if (!string.IsNullOrWhiteSpace(request.BillingPeriod))
                                           query = query.Where(c => c.BillingPeriod == request.BillingPeriod);
        if (request.Status.HasValue)       query = query.Where(c => c.Status == request.Status.Value);

        var charges = await query
            .OrderByDescending(c => c.BillingDate)
            .ThenBy(c => c.DueDate)
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        return charges.Select(c =>
        {
            var status = c.Status == RentChargeStatus.Pending && now > c.DueDate
                ? RentChargeStatus.Overdue : c.Status;
            return new RentChargeDto(c.Id, c.ChargeReference, c.TenancyId, c.Tenancy.TenancyReference,
                c.TenantId, c.Tenant.FullName, c.PropertyId, c.Property.Name,
                c.ApartmentId, c.Apartment.UnitNumber, c.BillingPeriod, c.BillingDate,
                c.DueDate, c.Amount, c.AmountPaid, c.OutstandingAmount, status,
                c.Description, c.CreatedAt);
        }).ToList();
    }
}

public class GetRentChargeByIdQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetRentChargeByIdQuery, RentChargeDetailDto>
{
    public async Task<RentChargeDetailDto> Handle(GetRentChargeByIdQuery request, CancellationToken ct)
    {
        var c = await db.RentCharges
            .Include(x => x.Tenancy)
            .Include(x => x.Tenant)
            .Include(x => x.Property)
            .Include(x => x.Apartment)
            .Include(x => x.Allocations).ThenInclude(a => a.RentPayment)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(RentCharge), request.Id);

        if (!currentUser.HasPropertyAccess(c.PropertyId))
            throw new ForbiddenException("You do not have access to this rent charge.");

        var status = c.Status == RentChargeStatus.Pending && DateTime.UtcNow > c.DueDate
            ? RentChargeStatus.Overdue : c.Status;

        var allocations = c.Allocations
            .OrderByDescending(a => a.AllocatedAt)
            .Select(a => new PaymentAllocationSummaryDto(
                a.Id, a.RentPaymentId, a.RentPayment.PaymentReference,
                a.RentPayment.ReceiptNumber, a.AllocatedAmount, a.AllocatedAt, a.IsReversed))
            .ToList();

        return new RentChargeDetailDto(
            c.Id, c.ChargeReference, c.TenancyId, c.Tenancy.TenancyReference,
            c.TenantId, c.Tenant.FullName, c.PropertyId, c.Property.Name,
            c.ApartmentId, c.Apartment.UnitNumber, c.BillingPeriod, c.BillingDate,
            c.DueDate, c.Amount, c.AmountPaid, c.OutstandingAmount, status,
            c.Description, c.CancellationReason, c.CreatedAt, allocations);
    }
}
