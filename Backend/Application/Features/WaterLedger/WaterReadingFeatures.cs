using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.WaterLedger;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record WaterReadingDto(
    Guid Id,
    Guid WaterMeterId,
    string MeterNumber,
    string? UnitNumber,
    string? PropertyName,
    decimal PreviousReading,
    decimal CurrentReading,
    decimal Consumption,
    DateTime ReadingDate,
    MeterReadingSource ReadingSource,
    string? RecordedByUserId,
    string? Notes,
    DateTime CreatedAt);

// ── Commands ──────────────────────────────────────────────────────────────────

public record RecordWaterReadingCommand(
    Guid WaterMeterId,
    decimal CurrentReading,
    MeterReadingSource ReadingSource = MeterReadingSource.Manual,
    DateTime? ReadingDate = null,
    string? Notes = null,
    bool IsCorrection = false) : IRequest<WaterReadingDto>;

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetWaterReadingsQuery(
    Guid? PropertyId = null,
    Guid? WaterMeterId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null) : IRequest<List<WaterReadingDto>>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class RecordWaterReadingCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<RecordWaterReadingCommand, WaterReadingDto>
{
    public async Task<WaterReadingDto> Handle(RecordWaterReadingCommand request, CancellationToken ct)
    {
        var meter = await db.Meters
            .Include(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null).ThenInclude(b => b != null ? b.Property : null)
            .FirstOrDefaultAsync(m => m.Id == request.WaterMeterId, ct)
            ?? throw new NotFoundException(nameof(Meter), request.WaterMeterId);

        var propertyId = meter.CurrentApartment?.Building?.PropertyId;
        if (propertyId.HasValue && !currentUser.HasPropertyAccess(propertyId.Value))
            throw new ForbiddenException("You do not have permission to record readings for this property.");

        // Get previous reading (from meter's LastReading or last reading record)
        var previousReading = meter.LastReading ?? 0m;
        var readDate = request.ReadingDate ?? DateTime.UtcNow;

        var reading = WaterReading.Create(
            request.WaterMeterId,
            previousReading,
            request.CurrentReading,
            request.ReadingSource,
            readDate,
            currentUser.UserId,
            request.Notes,
            request.IsCorrection);

        db.WaterReadings.Add(reading);

        // Update meter status and latest reading
        meter.RecordReading(request.CurrentReading, readDate, currentUser.UserId);

        await db.SaveChangesAsync(ct);

        return new WaterReadingDto(
            reading.Id,
            reading.WaterMeterId,
            meter.MeterNumber,
            meter.CurrentApartment?.UnitNumber,
            meter.CurrentApartment?.Building?.Property?.Name,
            reading.PreviousReading,
            reading.CurrentReading,
            reading.Consumption,
            reading.ReadingDate,
            reading.ReadingSource,
            reading.RecordedByUserId,
            reading.Notes,
            reading.CreatedAt);
    }
}

public class GetWaterReadingsQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetWaterReadingsQuery, List<WaterReadingDto>>
{
    public async Task<List<WaterReadingDto>> Handle(GetWaterReadingsQuery request, CancellationToken ct)
    {
        var query = db.WaterReadings
            .Include(r => r.WaterMeter).ThenInclude(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null).ThenInclude(b => b != null ? b.Property : null)
            .AsNoTracking();

        if (request.PropertyId.HasValue)
        {
            if (!currentUser.HasPropertyAccess(request.PropertyId.Value))
                throw new ForbiddenException("You do not have access to this property's readings.");

            query = query.Where(r => r.WaterMeter.CurrentApartment != null && r.WaterMeter.CurrentApartment.Building.PropertyId == request.PropertyId.Value);
        }
        else if (currentUser.Role == "Owner")
        {
            var allowed = currentUser.AuthorizedPropertyIds;
            query = query.Where(r => r.WaterMeter.CurrentApartment != null && allowed.Contains(r.WaterMeter.CurrentApartment.Building.PropertyId));
        }

        if (request.WaterMeterId.HasValue)
            query = query.Where(r => r.WaterMeterId == request.WaterMeterId.Value);

        if (request.FromDate.HasValue)
            query = query.Where(r => r.ReadingDate >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            query = query.Where(r => r.ReadingDate <= request.ToDate.Value);

        var list = await query
            .OrderByDescending(r => r.ReadingDate)
            .ToListAsync(ct);

        return list.Select(r => new WaterReadingDto(
            r.Id,
            r.WaterMeterId,
            r.WaterMeter.MeterNumber,
            r.WaterMeter.CurrentApartment?.UnitNumber,
            r.WaterMeter.CurrentApartment?.Building?.Property?.Name,
            r.PreviousReading,
            r.CurrentReading,
            r.Consumption,
            r.ReadingDate,
            r.ReadingSource,
            r.RecordedByUserId,
            r.Notes,
            r.CreatedAt)).ToList();
    }
}
