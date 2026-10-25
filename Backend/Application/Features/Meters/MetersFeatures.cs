using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Meters;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record MeterDto(
    Guid Id,
    string MeterNumber,
    string? SerialNumber,
    string MaskedIdentifier,
    MeterType Type,
    MeterStatus Status,
    Guid? CurrentApartmentId,
    string? CurrentUnitNumber,
    bool HasActiveQrCode);

public record MeterDetailDto(
    Guid Id,
    string MeterNumber,
    string? SerialNumber,
    string MaskedIdentifier,
    MeterType Type,
    MeterStatus Status,
    Guid? CurrentApartmentId,
    string? CurrentUnitNumber,
    Guid? TariffId,
    string? TariffName,
    bool HasActiveQrCode,
    string? ActiveQrPublicToken);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetMetersByPropertyQuery(Guid PropertyId) : IRequest<List<MeterDto>>;

public record GetMeterQuery(Guid MeterId) : IRequest<MeterDetailDto>;

public record GetMeterByQrTokenQuery(string PublicToken) : IRequest<MeterDetailDto>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateMeterCommand(
    string MeterNumber,
    MeterType Type,
    string? SerialNumber,
    Guid? ApartmentId,
    string? CreatedBy) : IRequest<Guid>;

public record AssignMeterToApartmentCommand(
    Guid MeterId,
    Guid ApartmentId,
    string? AssignedBy) : IRequest<Unit>;

public record UpdateMeterStatusCommand(
    Guid MeterId,
    MeterStatus Status,
    string? UpdatedBy) : IRequest<Unit>;

public record RegisterQrCodeCommand(
    Guid MeterId,
    Guid PaymentProviderConfigId,
    string RegisteredBy) : IRequest<string>;   // returns PublicToken

public record RevokeQrCodeCommand(
    Guid QrCodeRegistrationId,
    string Reason,
    string RevokedBy) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetMetersByPropertyHandler(IApplicationDbContext db)
    : IRequestHandler<GetMetersByPropertyQuery, List<MeterDto>>
{
    public async Task<List<MeterDto>> Handle(GetMetersByPropertyQuery request, CancellationToken ct)
        => await db.Meters
            .Where(m => m.CurrentApartment != null
                     && m.CurrentApartment.Building.PropertyId == request.PropertyId)
            .OrderBy(m => m.MeterNumber)
            .Select(m => new MeterDto(
                m.Id,
                m.MeterNumber,
                m.SerialNumber,
                m.MaskedIdentifier,
                m.Type,
                m.Status,
                m.CurrentApartmentId,
                m.CurrentApartment != null ? m.CurrentApartment.UnitNumber : null,
                m.ActiveQrCode != null && m.ActiveQrCode.Status == QrCodeStatus.Active))
            .ToListAsync(ct);
}

public class GetMeterHandler(IApplicationDbContext db)
    : IRequestHandler<GetMeterQuery, MeterDetailDto>
{
    public async Task<MeterDetailDto> Handle(GetMeterQuery request, CancellationToken ct)
    {
        var m = await db.Meters
            .Include(x => x.CurrentApartment)
            .Include(x => x.Tariff)
            .Include(x => x.ActiveQrCode)
            .FirstOrDefaultAsync(x => x.Id == request.MeterId, ct)
            ?? throw new NotFoundException(nameof(Meter), request.MeterId);

        return ToDetail(m);
    }
}

public class GetMeterByQrTokenHandler(IApplicationDbContext db)
    : IRequestHandler<GetMeterByQrTokenQuery, MeterDetailDto>
{
    public async Task<MeterDetailDto> Handle(GetMeterByQrTokenQuery request, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations
            .Include(q => q.Meter).ThenInclude(m => m.CurrentApartment)
            .Include(q => q.Meter).ThenInclude(m => m.Tariff)
            .Include(q => q.Meter).ThenInclude(m => m.ActiveQrCode)
            .FirstOrDefaultAsync(q => q.PublicToken == request.PublicToken
                                   && q.Status == QrCodeStatus.Active, ct)
            ?? throw new NotFoundException("QrCodeRegistration", request.PublicToken);

        return ToDetail(qr.Meter);
    }
}

public class CreateMeterHandler(IApplicationDbContext db)
    : IRequestHandler<CreateMeterCommand, Guid>
{
    public async Task<Guid> Handle(CreateMeterCommand cmd, CancellationToken ct)
    {
        if (await db.Meters.AnyAsync(m => m.MeterNumber == cmd.MeterNumber, ct))
            throw new ConflictException($"Meter number '{cmd.MeterNumber}' is already registered.");

        var meter = Meter.Create(cmd.MeterNumber, cmd.Type, cmd.SerialNumber, cmd.ApartmentId, cmd.CreatedBy);
        db.Meters.Add(meter);
        await db.SaveChangesAsync(ct);
        return meter.Id;
    }
}

public class AssignMeterToApartmentHandler(IApplicationDbContext db)
    : IRequestHandler<AssignMeterToApartmentCommand, Unit>
{
    public async Task<Unit> Handle(AssignMeterToApartmentCommand cmd, CancellationToken ct)
    {
        var meter = await db.Meters.FindAsync([cmd.MeterId], ct)
            ?? throw new NotFoundException(nameof(Meter), cmd.MeterId);

        if (!await db.Apartments.AnyAsync(a => a.Id == cmd.ApartmentId && !a.IsDeleted, ct))
            throw new NotFoundException(nameof(Apartment), cmd.ApartmentId);

        // Close existing assignment
        var existing = await db.MeterAssignments
            .FirstOrDefaultAsync(ma => ma.MeterId == cmd.MeterId && ma.UnassignedAt == null, ct);
        if (existing is not null)
            existing.Close(cmd.AssignedBy);

        // Create new assignment
        var assignment = MeterAssignment.Create(cmd.MeterId, cmd.ApartmentId, cmd.AssignedBy);
        db.MeterAssignments.Add(assignment);

        meter.AssignToApartment(cmd.ApartmentId, cmd.AssignedBy);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class UpdateMeterStatusHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateMeterStatusCommand, Unit>
{
    public async Task<Unit> Handle(UpdateMeterStatusCommand cmd, CancellationToken ct)
    {
        var meter = await db.Meters.FindAsync([cmd.MeterId], ct)
            ?? throw new NotFoundException(nameof(Meter), cmd.MeterId);

        meter.UpdateStatus(cmd.Status, cmd.UpdatedBy);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class RegisterQrCodeHandler(IApplicationDbContext db)
    : IRequestHandler<RegisterQrCodeCommand, string>
{
    public async Task<string> Handle(RegisterQrCodeCommand cmd, CancellationToken ct)
    {
        if (!await db.Meters.AnyAsync(m => m.Id == cmd.MeterId, ct))
            throw new NotFoundException(nameof(Meter), cmd.MeterId);

        if (!await db.PaymentProviderConfigs.AnyAsync(p => p.Id == cmd.PaymentProviderConfigId && p.IsActive, ct))
            throw new NotFoundException(nameof(PaymentProviderConfig), cmd.PaymentProviderConfigId);

        // Revoke existing active QR code for this meter
        var existingQr = await db.QrCodeRegistrations
            .FirstOrDefaultAsync(q => q.MeterId == cmd.MeterId && q.Status == QrCodeStatus.Active, ct);
        if (existingQr is not null)
        {
            existingQr.Revoke("Superseded by new registration.", cmd.RegisteredBy);
            db.QrCodeAuditLogs.Add(QrCodeAuditLog.Write(
                existingQr.Id, QrCodeEventType.Revoked, cmd.RegisteredBy, "Superseded by new QR registration."));
        }

        var registration = QrCodeRegistration.Create(cmd.MeterId, cmd.PaymentProviderConfigId, cmd.RegisteredBy);
        db.QrCodeRegistrations.Add(registration);

        db.QrCodeAuditLogs.Add(QrCodeAuditLog.Write(
            registration.Id, QrCodeEventType.Registered, cmd.RegisteredBy));

        await db.SaveChangesAsync(ct);
        return registration.PublicToken;
    }
}

public class RevokeQrCodeHandler(IApplicationDbContext db)
    : IRequestHandler<RevokeQrCodeCommand, Unit>
{
    public async Task<Unit> Handle(RevokeQrCodeCommand cmd, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations.FindAsync([cmd.QrCodeRegistrationId], ct)
            ?? throw new NotFoundException(nameof(QrCodeRegistration), cmd.QrCodeRegistrationId);

        qr.Revoke(cmd.Reason, cmd.RevokedBy);
        db.QrCodeAuditLogs.Add(QrCodeAuditLog.Write(
            qr.Id, QrCodeEventType.Revoked, cmd.RevokedBy, cmd.Reason));

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// ── Private helpers ───────────────────────────────────────────────────────────

file static class MeterDtoMapper
{
    internal static MeterDetailDto ToDetail(Meter m)
        => new(
            m.Id, m.MeterNumber, m.SerialNumber, m.MaskedIdentifier,
            m.Type, m.Status,
            m.CurrentApartmentId,
            m.CurrentApartment?.UnitNumber,
            m.TariffId,
            m.Tariff?.Name,
            m.ActiveQrCode is { Status: QrCodeStatus.Active },
            m.ActiveQrCode?.PublicToken);
}

// Make the file-local extension accessible in handlers
file static class MeterHandlerExtensions
{
    internal static MeterDetailDto ToDetail(this Meter m) => MeterDtoMapper.ToDetail(m);
}
