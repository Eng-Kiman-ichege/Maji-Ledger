using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.RentLedger;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record RentPaymentDto(
    Guid Id,
    string PaymentReference,
    string ReceiptNumber,
    Guid TenancyId,
    string? TenancyReference,
    Guid TenantId,
    string TenantName,
    Guid PropertyId,
    string PropertyName,
    Guid ApartmentId,
    string UnitNumber,
    decimal Amount,
    decimal AmountAllocated,
    decimal UnallocatedAmount,
    RentPaymentMethod PaymentMethod,
    string? TransactionReference,
    DateTime PaymentDate,
    string? PayerName,
    string? PayerPhoneNumber,
    RentPaymentStatus PaymentStatus,
    string? Notes,
    DateTime CreatedAt);

public record RentPaymentDetailDto(
    Guid Id,
    string PaymentReference,
    string ReceiptNumber,
    Guid TenancyId,
    string? TenancyReference,
    Guid TenantId,
    string TenantName,
    Guid PropertyId,
    string PropertyName,
    Guid ApartmentId,
    string UnitNumber,
    decimal Amount,
    decimal AmountAllocated,
    decimal UnallocatedAmount,
    RentPaymentMethod PaymentMethod,
    string? TransactionReference,
    DateTime PaymentDate,
    string? PayerName,
    string? PayerPhoneNumber,
    RentPaymentStatus PaymentStatus,
    string? Notes,
    string? ReversalReason,
    DateTime? ReversedAt,
    List<ChargeAllocationDto> Allocations,
    DateTime CreatedAt);

public record ChargeAllocationDto(
    Guid AllocationId,
    Guid ChargeId,
    string ChargeReference,
    string BillingPeriod,
    decimal AllocatedAmount,
    bool IsReversed);

public record RecordRentPaymentResult(
    Guid PaymentId,
    string PaymentReference,
    string ReceiptNumber,
    decimal TotalAllocated,
    decimal UnallocatedCredit,
    List<AllocationResultItem> Allocations);

public record AllocationResultItem(
    string ChargeReference,
    string BillingPeriod,
    decimal AllocatedAmount,
    RentChargeStatus ChargeStatus);

// ── Commands ──────────────────────────────────────────────────────────────────

public record RecordRentPaymentCommand(
    Guid TenancyId,
    decimal Amount,
    RentPaymentMethod PaymentMethod,
    DateTime PaymentDate,
    string? TransactionReference = null,
    string? PayerName = null,
    string? PayerPhoneNumber = null,
    string? Notes = null) : IRequest<RecordRentPaymentResult>;

public record ReverseRentPaymentCommand(
    Guid PaymentId,
    string Reason) : IRequest<Unit>;

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetRentPaymentsQuery(
    Guid? PropertyId = null,
    Guid? TenancyId = null,
    Guid? TenantId = null,
    RentPaymentStatus? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null) : IRequest<List<RentPaymentDto>>;

public record GetRentPaymentByIdQuery(Guid Id) : IRequest<RentPaymentDetailDto>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class RecordRentPaymentCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<RecordRentPaymentCommand, RecordRentPaymentResult>
{
    public async Task<RecordRentPaymentResult> Handle(RecordRentPaymentCommand request, CancellationToken ct)
    {
        // 1. Load tenancy and validate access
        var tenancy = await db.Tenancies
            .Include(t => t.Apartment).ThenInclude(a => a.Building).ThenInclude(b => b.Property)
            .Include(t => t.Tenant)
            .FirstOrDefaultAsync(t => t.Id == request.TenancyId, ct)
            ?? throw new NotFoundException(nameof(Tenancy), request.TenancyId);

        var propertyId = tenancy.Apartment.Building.PropertyId;
        if (!currentUser.HasPropertyAccess(propertyId))
            throw new ForbiddenException("You do not have access to record payments for this property.");

        // 2. Check duplicate M-Pesa/bank transaction reference
        if (!string.IsNullOrWhiteSpace(request.TransactionReference))
        {
            var duplicate = await db.RentPayments.AnyAsync(p =>
                p.TransactionReference == request.TransactionReference.Trim() &&
                p.PaymentStatus == RentPaymentStatus.Confirmed, ct);

            if (duplicate)
                throw new ValidationException("TransactionReference",
                    $"A confirmed payment with transaction reference '{request.TransactionReference}' already exists.");
        }

        // 3. Generate unique payment reference and receipt number
        var seq        = new Random().Next(10000, 99999);
        var paymentRef = $"PAY-{request.PaymentDate:yyyyMM}-{seq}";
        var receiptNo  = $"RCP-{request.PaymentDate:yyyyMM}-{seq}";

        // 4. Create payment record
        var payment = RentPayment.Create(
            paymentReference: paymentRef,
            tenancyId: tenancy.Id,
            tenantId: tenancy.TenantId,
            propertyId: propertyId,
            apartmentId: tenancy.ApartmentId,
            amount: request.Amount,
            paymentMethod: request.PaymentMethod,
            paymentDate: request.PaymentDate,
            receiptNumber: receiptNo,
            transactionReference: request.TransactionReference,
            payerName: request.PayerName,
            payerPhoneNumber: request.PayerPhoneNumber,
            notes: request.Notes,
            recordedByUserId: currentUser.UserId,
            initialStatus: RentPaymentStatus.Confirmed);

        db.RentPayments.Add(payment);

        // 5. Load outstanding charges in chronological order (oldest first)
        var openCharges = await db.RentCharges
            .Where(c => c.TenancyId == request.TenancyId &&
                        c.Status != RentChargeStatus.Paid &&
                        c.Status != RentChargeStatus.Cancelled)
            .OrderBy(c => c.BillingDate)
            .ThenBy(c => c.DueDate)
            .ToListAsync(ct);

        // 6. Allocate oldest-first
        var remaining      = request.Amount;
        var allocationItems = new List<AllocationResultItem>();

        foreach (var charge in openCharges)
        {
            if (remaining <= 0) break;

            var toAllocate = Math.Min(remaining, charge.OutstandingAmount);
            if (toAllocate <= 0) continue;

            var allocation = PaymentAllocation.Create(
                rentPaymentId: payment.Id,
                rentChargeId: charge.Id,
                allocatedAmount: toAllocate,
                createdBy: currentUser.UserId);

            charge.ApplyPayment(toAllocate);
            payment.Allocate(toAllocate);
            db.PaymentAllocations.Add(allocation);

            allocationItems.Add(new AllocationResultItem(
                charge.ChargeReference,
                charge.BillingPeriod,
                toAllocate,
                charge.Status));

            remaining -= toAllocate;
        }

        // 7. If overpayment remains, create tenant credit
        if (remaining > 0)
        {
            var creditRef = $"CRD-{request.PaymentDate:yyyyMM}-{new Random().Next(10000, 99999)}";
            var credit = TenantCredit.Create(
                creditReference: creditRef,
                tenantId: tenancy.TenantId,
                propertyId: propertyId,
                amount: remaining,
                reason: "Overpayment credit from payment " + paymentRef,
                tenancyId: tenancy.Id,
                sourcePaymentId: payment.Id);

            db.TenantCredits.Add(credit);
        }

        await db.SaveChangesAsync(ct);

        return new RecordRentPaymentResult(
            payment.Id,
            paymentRef,
            receiptNo,
            payment.AmountAllocated,
            remaining,
            allocationItems);
    }
}

public class ReverseRentPaymentCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<ReverseRentPaymentCommand, Unit>
{
    public async Task<Unit> Handle(ReverseRentPaymentCommand request, CancellationToken ct)
    {
        var payment = await db.RentPayments
            .Include(p => p.Allocations).ThenInclude(a => a.RentCharge)
            .FirstOrDefaultAsync(p => p.Id == request.PaymentId, ct)
            ?? throw new NotFoundException(nameof(RentPayment), request.PaymentId);

        if (!currentUser.HasPropertyAccess(payment.PropertyId))
            throw new ForbiddenException("You do not have access to reverse this payment.");

        // Reverse all active allocations
        foreach (var allocation in payment.Allocations.Where(a => !a.IsReversed))
        {
            allocation.RentCharge.ReversePayment(allocation.AllocatedAmount);
            payment.Deallocate(allocation.AllocatedAmount);
            allocation.Reverse(request.Reason);
        }

        payment.Reverse(request.Reason);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class GetRentPaymentsQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetRentPaymentsQuery, List<RentPaymentDto>>
{
    public async Task<List<RentPaymentDto>> Handle(GetRentPaymentsQuery request, CancellationToken ct)
    {
        var query = db.RentPayments
            .Include(p => p.Tenancy)
            .Include(p => p.Tenant)
            .Include(p => p.Property)
            .Include(p => p.Apartment)
            .AsNoTracking();

        if (request.PropertyId.HasValue)
        {
            if (!currentUser.HasPropertyAccess(request.PropertyId.Value))
                throw new ForbiddenException("You do not have access to this property.");
            query = query.Where(p => p.PropertyId == request.PropertyId.Value);
        }
        else if (currentUser.Role == "Owner")
        {
            var allowed = currentUser.AuthorizedPropertyIds;
            query = query.Where(p => allowed.Contains(p.PropertyId));
        }

        if (request.TenancyId.HasValue) query = query.Where(p => p.TenancyId == request.TenancyId.Value);
        if (request.TenantId.HasValue)  query = query.Where(p => p.TenantId  == request.TenantId.Value);
        if (request.Status.HasValue)    query = query.Where(p => p.PaymentStatus == request.Status.Value);
        if (request.FromDate.HasValue)  query = query.Where(p => p.PaymentDate  >= request.FromDate.Value);
        if (request.ToDate.HasValue)    query = query.Where(p => p.PaymentDate  <= request.ToDate.Value);

        var payments = await query
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync(ct);

        return payments.Select(MapToDto).ToList();
    }

    private static RentPaymentDto MapToDto(RentPayment p) => new(
        p.Id, p.PaymentReference, p.ReceiptNumber,
        p.TenancyId, p.Tenancy.TenancyReference,
        p.TenantId, p.Tenant.FullName,
        p.PropertyId, p.Property.Name,
        p.ApartmentId, p.Apartment.UnitNumber,
        p.Amount, p.AmountAllocated, p.UnallocatedAmount,
        p.PaymentMethod, p.TransactionReference, p.PaymentDate,
        p.PayerName, p.PayerPhoneNumber, p.PaymentStatus, p.Notes, p.CreatedAt);
}

public class GetRentPaymentByIdQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetRentPaymentByIdQuery, RentPaymentDetailDto>
{
    public async Task<RentPaymentDetailDto> Handle(GetRentPaymentByIdQuery request, CancellationToken ct)
    {
        var p = await db.RentPayments
            .Include(x => x.Tenancy)
            .Include(x => x.Tenant)
            .Include(x => x.Property)
            .Include(x => x.Apartment)
            .Include(x => x.Allocations).ThenInclude(a => a.RentCharge)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(RentPayment), request.Id);

        if (!currentUser.HasPropertyAccess(p.PropertyId))
            throw new ForbiddenException("You do not have access to this payment.");

        var allocations = p.Allocations
            .OrderByDescending(a => a.AllocatedAt)
            .Select(a => new ChargeAllocationDto(
                a.Id, a.RentChargeId, a.RentCharge.ChargeReference,
                a.RentCharge.BillingPeriod, a.AllocatedAmount, a.IsReversed))
            .ToList();

        return new RentPaymentDetailDto(
            p.Id, p.PaymentReference, p.ReceiptNumber,
            p.TenancyId, p.Tenancy.TenancyReference,
            p.TenantId, p.Tenant.FullName,
            p.PropertyId, p.Property.Name,
            p.ApartmentId, p.Apartment.UnitNumber,
            p.Amount, p.AmountAllocated, p.UnallocatedAmount,
            p.PaymentMethod, p.TransactionReference, p.PaymentDate,
            p.PayerName, p.PayerPhoneNumber, p.PaymentStatus,
            p.Notes, p.ReversalReason, p.ReversedAt,
            allocations, p.CreatedAt);
    }
}
