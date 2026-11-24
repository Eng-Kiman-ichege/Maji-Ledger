using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.WaterLedger;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record WaterMeterDto(
    Guid Id,
    string MeterNumber,
    string? SerialNumber,
    string? Manufacturer,
    string? Model,
    MeterType Type,
    MeterIntegrationType IntegrationType,
    MeterStatus Status,
    Guid? CurrentApartmentId,
    string? UnitNumber,
    Guid? PropertyId,
    string? PropertyName,
    string? BuildingName,
    DateTime? InstallationDate,
    decimal? LastReading,
    DateTime? LastReadingDate,
    string? Notes,
    string? ActiveQrCodeToken,
    DateTime CreatedAt);

public record WaterMeterDetailDto(
    Guid Id,
    string MeterNumber,
    string? SerialNumber,
    string? Manufacturer,
    string? Model,
    MeterType Type,
    MeterIntegrationType IntegrationType,
    MeterStatus Status,
    Guid? CurrentApartmentId,
    string? UnitNumber,
    Guid? PropertyId,
    string? PropertyName,
    string? BuildingName,
    DateTime? InstallationDate,
    decimal? LastReading,
    DateTime? LastReadingDate,
    string? Notes,
    string? ActiveQrCodeToken,
    List<MeterAssignmentDto> AssignmentHistory,
    List<MeterReadingItemDto> RecentReadings,
    DateTime CreatedAt);

public record MeterAssignmentDto(
    Guid AssignmentId,
    Guid ApartmentId,
    string UnitNumber,
    DateTime AssignedAt,
    DateTime? UnassignedAt,
    string? AssignedBy);

public record MeterReadingItemDto(
    Guid ReadingId,
    decimal ReadingValue,
    MeterReadingSource Source,
    DateTime ReadAt,
    string? RecordedBy);

// ── Commands ──────────────────────────────────────────────────────────────────

public record RegisterWaterMeterCommand(
    string MeterNumber,
    string? SerialNumber,
    string? Manufacturer,
    string? Model,
    MeterType Type,
    MeterIntegrationType IntegrationType,
    Guid? ApartmentId = null,
    DateTime? InstallationDate = null,
    string? Notes = null) : IRequest<Guid>;

public record UpdateWaterMeterCommand(
    Guid Id,
    string? SerialNumber,
    string? Manufacturer,
    string? Model,
    MeterType Type,
    MeterIntegrationType IntegrationType,
    DateTime? InstallationDate,
    string? Notes) : IRequest<Unit>;

public record TransferWaterMeterCommand(
    Guid MeterId,
    Guid NewApartmentId,
    string? Reason = null) : IRequest<Unit>;

public record UpdateWaterMeterStatusCommand(
    Guid MeterId,
    MeterStatus Status,
    string? Notes = null) : IRequest<Unit>;

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetWaterMetersQuery(
    Guid? PropertyId = null,
    MeterStatus? Status = null,
    MeterType? Type = null,
    string? Search = null) : IRequest<List<WaterMeterDto>>;

public record GetWaterMeterByIdQuery(Guid Id) : IRequest<WaterMeterDetailDto>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class RegisterWaterMeterCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<RegisterWaterMeterCommand, Guid>
{
    public async Task<Guid> Handle(RegisterWaterMeterCommand request, CancellationToken ct)
    {
        var existing = await db.Meters.AnyAsync(m => m.MeterNumber == request.MeterNumber.Trim(), ct);
        if (existing)
            throw new ConflictException($"A water meter with number '{request.MeterNumber}' already exists.");

        if (request.ApartmentId.HasValue)
        {
            var apartment = await db.Apartments
                .Include(a => a.Building)
                .FirstOrDefaultAsync(a => a.Id == request.ApartmentId.Value, ct)
                ?? throw new NotFoundException(nameof(Apartment), request.ApartmentId.Value);

            if (!currentUser.HasPropertyAccess(apartment.Building.PropertyId))
                throw new ForbiddenException("You do not have permission to register meters for this property.");

            // Check if apartment already has an active meter
            var activeMeter = await db.Meters.AnyAsync(m =>
                m.CurrentApartmentId == request.ApartmentId.Value &&
                m.Status == MeterStatus.Active, ct);

            if (activeMeter)
                throw new ConflictException($"Unit {apartment.UnitNumber} already has an active water meter assigned.");
        }

        var meter = Meter.Create(
            meterNumber: request.MeterNumber.Trim(),
            type: request.Type,
            serialNumber: request.SerialNumber?.Trim(),
            currentApartmentId: request.ApartmentId,
            createdBy: currentUser.UserId,
            manufacturer: request.Manufacturer?.Trim(),
            model: request.Model?.Trim(),
            integrationType: request.IntegrationType,
            installationDate: request.InstallationDate,
            notes: request.Notes);

        db.Meters.Add(meter);

        if (request.ApartmentId.HasValue)
        {
            var assignment = MeterAssignment.Create(meter.Id, request.ApartmentId.Value, currentUser.UserId);
            db.MeterAssignments.Add(assignment);
        }

        await db.SaveChangesAsync(ct);
        return meter.Id;
    }
}

public class UpdateWaterMeterCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<UpdateWaterMeterCommand, Unit>
{
    public async Task<Unit> Handle(UpdateWaterMeterCommand request, CancellationToken ct)
    {
        var meter = await db.Meters
            .Include(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null)
            .FirstOrDefaultAsync(m => m.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Meter), request.Id);

        if (meter.CurrentApartment?.Building != null && !currentUser.HasPropertyAccess(meter.CurrentApartment.Building.PropertyId))
            throw new ForbiddenException("You do not have permission to edit this meter.");

        meter.UpdateDetails(
            request.SerialNumber,
            request.Manufacturer,
            request.Model,
            request.Type,
            request.IntegrationType,
            request.InstallationDate,
            request.Notes,
            currentUser.UserId);

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class TransferWaterMeterCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<TransferWaterMeterCommand, Unit>
{
    public async Task<Unit> Handle(TransferWaterMeterCommand request, CancellationToken ct)
    {
        var meter = await db.Meters
            .Include(m => m.Assignments)
            .FirstOrDefaultAsync(m => m.Id == request.MeterId, ct)
            ?? throw new NotFoundException(nameof(Meter), request.MeterId);

        var newApartment = await db.Apartments
            .Include(a => a.Building)
            .FirstOrDefaultAsync(a => a.Id == request.NewApartmentId, ct)
            ?? throw new NotFoundException(nameof(Apartment), request.NewApartmentId);

        if (!currentUser.HasPropertyAccess(newApartment.Building.PropertyId))
            throw new ForbiddenException("You do not have access to transfer meters to this property.");

        // Check if destination apartment already has an active meter
        var existingActive = await db.Meters.AnyAsync(m =>
            m.Id != meter.Id &&
            m.CurrentApartmentId == request.NewApartmentId &&
            m.Status == MeterStatus.Active, ct);

        if (existingActive)
            throw new ConflictException($"Unit {newApartment.UnitNumber} already has an active water meter.");

        // Close current active assignment
        var activeAssignment = meter.Assignments.FirstOrDefault(a => a.UnassignedAt == null);
        activeAssignment?.Close();

        // Assign to new apartment
        meter.AssignToApartment(request.NewApartmentId, currentUser.UserId);
        var newAssignment = MeterAssignment.Create(meter.Id, request.NewApartmentId, currentUser.UserId);
        db.MeterAssignments.Add(newAssignment);

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class UpdateWaterMeterStatusCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<UpdateWaterMeterStatusCommand, Unit>
{
    public async Task<Unit> Handle(UpdateWaterMeterStatusCommand request, CancellationToken ct)
    {
        var meter = await db.Meters
            .Include(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null)
            .FirstOrDefaultAsync(m => m.Id == request.MeterId, ct)
            ?? throw new NotFoundException(nameof(Meter), request.MeterId);

        if (meter.CurrentApartment?.Building != null && !currentUser.HasPropertyAccess(meter.CurrentApartment.Building.PropertyId))
            throw new ForbiddenException("You do not have access to update status for this meter.");

        meter.UpdateStatus(request.Status, currentUser.UserId);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class GetWaterMetersQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetWaterMetersQuery, List<WaterMeterDto>>
{
    public async Task<List<WaterMeterDto>> Handle(GetWaterMetersQuery request, CancellationToken ct)
    {
        var query = db.Meters
            .Include(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null).ThenInclude(b => b != null ? b.Property : null)
            .Include(m => m.QrCodes)
            .AsNoTracking();

        if (request.PropertyId.HasValue)
        {
            if (!currentUser.HasPropertyAccess(request.PropertyId.Value))
                throw new ForbiddenException("You do not have access to this property's meters.");

            query = query.Where(m => m.CurrentApartment != null && m.CurrentApartment.Building.PropertyId == request.PropertyId.Value);
        }
        else if (currentUser.Role == "Owner")
        {
            var allowed = currentUser.AuthorizedPropertyIds;
            query = query.Where(m => m.CurrentApartment != null && allowed.Contains(m.CurrentApartment.Building.PropertyId));
        }

        if (request.Status.HasValue)
            query = query.Where(m => m.Status == request.Status.Value);

        if (request.Type.HasValue)
            query = query.Where(m => m.Type == request.Type.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim().ToLower();
            query = query.Where(m =>
                m.MeterNumber.ToLower().Contains(s) ||
                (m.SerialNumber != null && m.SerialNumber.ToLower().Contains(s)) ||
                (m.CurrentApartment != null && m.CurrentApartment.UnitNumber.ToLower().Contains(s)));
        }

        var meters = await query
            .OrderBy(m => m.MeterNumber)
            .ToListAsync(ct);

        return meters.Select(m =>
        {
            var apt = m.CurrentApartment;
            var bld = apt?.Building;
            var prop = bld?.Property;
            var activeQr = m.QrCodes.FirstOrDefault(q => q.Status == QrCodeStatus.Active);

            return new WaterMeterDto(
                m.Id,
                m.MeterNumber,
                m.SerialNumber,
                m.Manufacturer,
                m.Model,
                m.Type,
                m.IntegrationType,
                m.Status,
                m.CurrentApartmentId,
                apt?.UnitNumber,
                prop?.Id,
                prop?.Name,
                bld?.Name,
                m.InstallationDate,
                m.LastReading,
                m.LastReadingDate,
                m.Notes,
                activeQr?.PublicToken,
                m.CreatedAt);
        }).ToList();
    }
}

public class GetWaterMeterByIdQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetWaterMeterByIdQuery, WaterMeterDetailDto>
{
    public async Task<WaterMeterDetailDto> Handle(GetWaterMeterByIdQuery request, CancellationToken ct)
    {
        var m = await db.Meters
            .Include(m => m.CurrentApartment).ThenInclude(a => a != null ? a.Building : null).ThenInclude(b => b != null ? b.Property : null)
            .Include(m => m.QrCodes)
            .Include(m => m.Assignments).ThenInclude(a => a.Apartment)
            .Include(m => m.Readings)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Meter), request.Id);

        var prop = m.CurrentApartment?.Building?.Property;
        if (prop != null && !currentUser.HasPropertyAccess(prop.Id))
            throw new ForbiddenException("You do not have access to view this meter.");

        var activeQr = m.QrCodes.FirstOrDefault(q => q.Status == QrCodeStatus.Active);

        var assignments = m.Assignments
            .OrderByDescending(a => a.AssignedAt)
            .Select(a => new MeterAssignmentDto(
                a.Id,
                a.ApartmentId,
                a.Apartment?.UnitNumber ?? "Unknown",
                a.AssignedAt,
                a.UnassignedAt,
                a.AssignedBy))
            .ToList();

        var readings = m.Readings
            .OrderByDescending(r => r.ReadAt)
            .Take(10)
            .Select(r => new MeterReadingItemDto(
                r.Id,
                r.ReadingValue,
                r.Source,
                r.ReadAt,
                r.RecordedBy))
            .ToList();

        return new WaterMeterDetailDto(
            m.Id,
            m.MeterNumber,
            m.SerialNumber,
            m.Manufacturer,
            m.Model,
            m.Type,
            m.IntegrationType,
            m.Status,
            m.CurrentApartmentId,
            m.CurrentApartment?.UnitNumber,
            prop?.Id,
            prop?.Name,
            m.CurrentApartment?.Building?.Name,
            m.InstallationDate,
            m.LastReading,
            m.LastReadingDate,
            m.Notes,
            activeQr?.PublicToken,
            assignments,
            readings,
            m.CreatedAt);
    }
}
