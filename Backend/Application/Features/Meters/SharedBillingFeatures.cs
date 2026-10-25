using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Meters;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record SharedBillingAllocationInput(
    Guid ApartmentId,
    decimal AllocationFraction,
    string? Notes = null);

public record SharedMeterBillingPointDto(
    Guid Id,
    Guid MeterId,
    Guid ApartmentId,
    string UnitNumber,
    string BuildingName,
    decimal AllocationFraction,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    bool IsActive,
    string? Notes);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetMeterSharedBillingPointsQuery(Guid MeterId) : IRequest<List<SharedMeterBillingPointDto>>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record ConfigureSharedMeterBillingPointsCommand(
    Guid MeterId,
    List<SharedBillingAllocationInput> Allocations,
    string ConfiguredBy) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetMeterSharedBillingPointsHandler(IApplicationDbContext db)
    : IRequestHandler<GetMeterSharedBillingPointsQuery, List<SharedMeterBillingPointDto>>
{
    public async Task<List<SharedMeterBillingPointDto>> Handle(GetMeterSharedBillingPointsQuery request, CancellationToken ct)
        => await db.SharedMeterBillingPoints
            .Where(s => s.MeterId == request.MeterId)
            .Include(s => s.Apartment).ThenInclude(a => a.Building)
            .OrderBy(s => s.Apartment.UnitNumber)
            .Select(s => new SharedMeterBillingPointDto(
                s.Id,
                s.MeterId,
                s.ApartmentId,
                s.Apartment.UnitNumber,
                s.Apartment.Building.Name,
                s.AllocationFraction,
                s.EffectiveFrom,
                s.EffectiveTo,
                s.EffectiveTo == null,
                s.Notes))
            .ToListAsync(ct);
}

public class ConfigureSharedMeterBillingPointsHandler(IApplicationDbContext db)
    : IRequestHandler<ConfigureSharedMeterBillingPointsCommand, Unit>
{
    public async Task<Unit> Handle(ConfigureSharedMeterBillingPointsCommand cmd, CancellationToken ct)
    {
        if (cmd.Allocations == null || cmd.Allocations.Count < 2)
            throw new ValidationException("Shared meter billing points require at least two participating apartments.");

        var totalFraction = cmd.Allocations.Sum(a => a.AllocationFraction);
        if (Math.Abs(totalFraction - 1.0m) > 0.0001m)
            throw new ValidationException($"Sum of allocation fractions must equal 1.0 (100%). Current sum: {totalFraction}.");

        var meter = await db.Meters.FindAsync([cmd.MeterId], ct)
            ?? throw new NotFoundException(nameof(Meter), cmd.MeterId);

        // Verify all apartments exist and belong to the same property
        var apartmentIds = cmd.Allocations.Select(a => a.ApartmentId).Distinct().ToList();
        var apartments = await db.Apartments
            .Include(a => a.Building)
            .Where(a => apartmentIds.Contains(a.Id) && !a.IsDeleted)
            .ToListAsync(ct);

        if (apartments.Count != apartmentIds.Count)
            throw new NotFoundException(nameof(Apartment), string.Join(", ", apartmentIds.Except(apartments.Select(a => a.Id))));

        var propertyIds = apartments.Select(a => a.Building.PropertyId).Distinct().ToList();
        if (propertyIds.Count > 1)
            throw new ConflictException("All apartments sharing a meter must belong to the same property.");

        // Close existing active shared billing points
        var existingActive = await db.SharedMeterBillingPoints
            .Where(s => s.MeterId == cmd.MeterId && s.EffectiveTo == null)
            .ToListAsync(ct);

        foreach (var oldPoint in existingActive)
        {
            oldPoint.Close("Superceded by new allocation configuration.");
        }

        // Add new points
        foreach (var alloc in cmd.Allocations)
        {
            var point = SharedMeterBillingPoint.Create(
                cmd.MeterId,
                alloc.ApartmentId,
                alloc.AllocationFraction,
                notes: alloc.Notes,
                createdBy: cmd.ConfiguredBy);

            db.SharedMeterBillingPoints.Add(point);
        }

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
