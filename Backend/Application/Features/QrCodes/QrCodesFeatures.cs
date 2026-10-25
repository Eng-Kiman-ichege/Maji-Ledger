using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.QrCodes;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record QrRegistrationPreviewDto(
    Guid MeterId,
    string MeterNumber,
    string MaskedIdentifier,
    Guid ApartmentId,
    string UnitNumber,
    string BuildingName,
    Guid PropertyId,
    string PropertyName,
    Guid PaymentProviderConfigId,
    PaymentProviderType ProviderType,
    string BusinessShortCode,
    string ProviderDisplayName,
    string PreviewUrl,
    bool IsValid,
    string? ValidationMessage);

public record QrCodeRegistrationDto(
    Guid Id,
    Guid MeterId,
    string MeterNumber,
    string MaskedIdentifier,
    string UnitNumber,
    string BuildingName,
    string PropertyName,
    Guid PaymentProviderConfigId,
    string BusinessShortCode,
    string PublicToken,
    string PaymentUrl,
    QrCodeStatus Status,
    DateTime CreatedAt,
    string? RevokedReason,
    DateTime? RevokedAt);

public record MeterStickerDto(
    Guid RegistrationId,
    string PublicToken,
    string PaymentUrl,
    string PropertyName,
    string BuildingName,
    string UnitNumber,
    string MaskedMeterIdentifier,
    string MeterNumber,
    string ProviderDisplayName,
    string BusinessShortCode,
    string QrCodeSvg,
    string QrCodeDataUri);

public record QrCodeAuditLogDto(
    Guid Id,
    Guid QrCodeRegistrationId,
    QrCodeAuditEvent EventType,
    string PerformedBy,
    string? Notes,
    DateTime OccurredAt);

// ── Queries ───────────────────────────────────────────────────────────────────

public record PreviewQrRegistrationQuery(
    Guid MeterId,
    Guid PaymentProviderConfigId) : IRequest<QrRegistrationPreviewDto>;

public record GetQrRegistrationByTokenQuery(string PublicToken) : IRequest<QrCodeRegistrationDto>;

public record GetMeterActiveQrCodeQuery(Guid MeterId) : IRequest<QrCodeRegistrationDto?>;

public record GetMeterStickerQuery(Guid RegistrationId) : IRequest<MeterStickerDto>;

public record GetQrAuditLogsQuery(Guid RegistrationId) : IRequest<List<QrCodeAuditLogDto>>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record RegisterQrCodeCommand(
    Guid MeterId,
    Guid PaymentProviderConfigId,
    string RegisteredBy) : IRequest<QrCodeRegistrationDto>;

public record ReplaceQrCodeCommand(
    Guid MeterId,
    Guid PaymentProviderConfigId,
    string Reason,
    string ReplacedBy) : IRequest<QrCodeRegistrationDto>;

public record DisableQrCodeCommand(
    Guid RegistrationId,
    string DisabledBy) : IRequest<Unit>;

public record EnableQrCodeCommand(
    Guid RegistrationId,
    string EnabledBy) : IRequest<Unit>;

public record RevokeQrCodeCommand(
    Guid RegistrationId,
    string Reason,
    string RevokedBy) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class PreviewQrRegistrationHandler(IApplicationDbContext db)
    : IRequestHandler<PreviewQrRegistrationQuery, QrRegistrationPreviewDto>
{
    public async Task<QrRegistrationPreviewDto> Handle(PreviewQrRegistrationQuery request, CancellationToken ct)
    {
        var meter = await db.Meters
            .Include(m => m.CurrentApartment)
                .ThenInclude(a => a != null ? a.Building : null)
                .ThenInclude(b => b != null ? b.Property : null)
            .FirstOrDefaultAsync(m => m.Id == request.MeterId, ct)
            ?? throw new NotFoundException(nameof(Meter), request.MeterId);

        var config = await db.PaymentProviderConfigs
            .FirstOrDefaultAsync(p => p.Id == request.PaymentProviderConfigId, ct)
            ?? throw new NotFoundException(nameof(PaymentProviderConfig), request.PaymentProviderConfigId);

        if (meter.CurrentApartment == null)
        {
            throw new ConflictException(
                $"Meter '{meter.MeterNumber}' is not assigned to any apartment. Assign the meter before registering a QR code.");
        }

        var apartment = meter.CurrentApartment;
        var building = apartment.Building;
        var property = building.Property;

        // Validation against cross-property destination mismatch
        bool isValid = true;
        string? validationMessage = null;

        if (!config.IsActive)
        {
            isValid = false;
            validationMessage = $"Payment configuration '{config.DisplayName}' is currently inactive.";
        }
        else if (config.PropertyId.HasValue && config.PropertyId.Value != property.Id)
        {
            isValid = false;
            validationMessage = $"Destination Paybill '{config.BusinessShortCode}' is restricted to another property and cannot be linked to '{property.Name}'.";
        }

        var previewToken = "PREVIEW_TOKEN";
        var previewUrl = $"https://pay.majiledger.com/p/{previewToken}";

        return new QrRegistrationPreviewDto(
            meter.Id,
            meter.MeterNumber,
            meter.MaskedIdentifier,
            apartment.Id,
            apartment.UnitNumber,
            building.Name,
            property.Id,
            property.Name,
            config.Id,
            config.ProviderType,
            config.BusinessShortCode,
            config.DisplayName,
            previewUrl,
            isValid,
            validationMessage);
    }
}

public class GetQrRegistrationByTokenHandler(IApplicationDbContext db)
    : IRequestHandler<GetQrRegistrationByTokenQuery, QrCodeRegistrationDto>
{
    public async Task<QrCodeRegistrationDto> Handle(GetQrRegistrationByTokenQuery request, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations
            .Include(q => q.Meter)
                .ThenInclude(m => m.CurrentApartment)
                .ThenInclude(a => a != null ? a.Building : null)
                .ThenInclude(b => b != null ? b.Property : null)
            .Include(q => q.PaymentProviderConfig)
            .FirstOrDefaultAsync(q => q.PublicToken == request.PublicToken, ct)
            ?? throw new NotFoundException(nameof(QrCodeRegistration), request.PublicToken);

        var apt = qr.Meter.CurrentApartment;
        return new QrCodeRegistrationDto(
            qr.Id,
            qr.MeterId,
            qr.Meter.MeterNumber,
            qr.Meter.MaskedIdentifier,
            apt?.UnitNumber ?? "N/A",
            apt?.Building.Name ?? "N/A",
            apt?.Building.Property.Name ?? "N/A",
            qr.PaymentProviderConfigId,
            qr.PaymentProviderConfig.BusinessShortCode,
            qr.PublicToken,
            $"https://pay.majiledger.com/p/{qr.PublicToken}",
            qr.Status,
            qr.CreatedAt,
            qr.RevokedReason,
            qr.RevokedAt);
    }
}

public class GetMeterActiveQrCodeHandler(IApplicationDbContext db)
    : IRequestHandler<GetMeterActiveQrCodeQuery, QrCodeRegistrationDto?>
{
    public async Task<QrCodeRegistrationDto?> Handle(GetMeterActiveQrCodeQuery request, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations
            .Include(q => q.Meter)
                .ThenInclude(m => m.CurrentApartment)
                .ThenInclude(a => a != null ? a.Building : null)
                .ThenInclude(b => b != null ? b.Property : null)
            .Include(q => q.PaymentProviderConfig)
            .FirstOrDefaultAsync(q => q.MeterId == request.MeterId && q.Status == QrCodeStatus.Active, ct);

        if (qr == null)
            return null;

        var apt = qr.Meter.CurrentApartment;
        return new QrCodeRegistrationDto(
            qr.Id,
            qr.MeterId,
            qr.Meter.MeterNumber,
            qr.Meter.MaskedIdentifier,
            apt?.UnitNumber ?? "N/A",
            apt?.Building.Name ?? "N/A",
            apt?.Building.Property.Name ?? "N/A",
            qr.PaymentProviderConfigId,
            qr.PaymentProviderConfig.BusinessShortCode,
            qr.PublicToken,
            $"https://pay.majiledger.com/p/{qr.PublicToken}",
            qr.Status,
            qr.CreatedAt,
            qr.RevokedReason,
            qr.RevokedAt);
    }
}

public class GetMeterStickerHandler(IApplicationDbContext db, IQrCodeGeneratorService qrGenerator)
    : IRequestHandler<GetMeterStickerQuery, MeterStickerDto>
{
    public async Task<MeterStickerDto> Handle(GetMeterStickerQuery request, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations
            .Include(q => q.Meter)
                .ThenInclude(m => m.CurrentApartment)
                .ThenInclude(a => a != null ? a.Building : null)
                .ThenInclude(b => b != null ? b.Property : null)
            .Include(q => q.PaymentProviderConfig)
            .FirstOrDefaultAsync(q => q.Id == request.RegistrationId, ct)
            ?? throw new NotFoundException(nameof(QrCodeRegistration), request.RegistrationId);

        var paymentUrl = $"https://pay.majiledger.com/p/{qr.PublicToken}";
        var svg = qrGenerator.GenerateSvg(paymentUrl);
        var dataUri = qrGenerator.GenerateDataUriSvg(paymentUrl);

        var apt = qr.Meter.CurrentApartment;
        return new MeterStickerDto(
            qr.Id,
            qr.PublicToken,
            paymentUrl,
            apt?.Building.Property.Name ?? "Unknown Property",
            apt?.Building.Name ?? "Unknown Building",
            apt?.UnitNumber ?? "Unknown Unit",
            qr.Meter.MaskedIdentifier,
            qr.Meter.MeterNumber,
            qr.PaymentProviderConfig.DisplayName,
            qr.PaymentProviderConfig.BusinessShortCode,
            svg,
            dataUri);
    }
}

public class GetQrAuditLogsHandler(IApplicationDbContext db)
    : IRequestHandler<GetQrAuditLogsQuery, List<QrCodeAuditLogDto>>
{
    public async Task<List<QrCodeAuditLogDto>> Handle(GetQrAuditLogsQuery request, CancellationToken ct)
        => await db.QrCodeAuditLogs
            .Where(l => l.QrCodeRegistrationId == request.RegistrationId)
            .OrderByDescending(l => l.OccurredAt)
            .Select(l => new QrCodeAuditLogDto(
                l.Id,
                l.QrCodeRegistrationId,
                l.EventType,
                l.PerformedBy,
                l.Notes,
                l.OccurredAt))
            .ToListAsync(ct);
}

public class RegisterQrCodeFeatureHandler(IApplicationDbContext db)
    : IRequestHandler<RegisterQrCodeCommand, QrCodeRegistrationDto>
{
    public async Task<QrCodeRegistrationDto> Handle(RegisterQrCodeCommand cmd, CancellationToken ct)
    {
        var meter = await db.Meters
            .Include(m => m.CurrentApartment)
                .ThenInclude(a => a != null ? a.Building : null)
                .ThenInclude(b => b != null ? b.Property : null)
            .FirstOrDefaultAsync(m => m.Id == cmd.MeterId, ct)
            ?? throw new NotFoundException(nameof(Meter), cmd.MeterId);

        if (meter.Status != MeterStatus.Active)
            throw new ConflictException($"Meter '{meter.MeterNumber}' is not active (current status: {meter.Status}).");

        if (meter.CurrentApartment == null)
            throw new ConflictException($"Meter '{meter.MeterNumber}' must be assigned to an apartment before registering a QR code.");

        var config = await db.PaymentProviderConfigs.FindAsync([cmd.PaymentProviderConfigId], ct)
            ?? throw new NotFoundException(nameof(PaymentProviderConfig), cmd.PaymentProviderConfigId);

        if (!config.IsActive)
            throw new ConflictException($"Payment configuration '{config.DisplayName}' is disabled.");

        // Prevent cross-property mismatch
        var property = meter.CurrentApartment.Building.Property;
        if (config.PropertyId.HasValue && config.PropertyId.Value != property.Id)
        {
            throw new ConflictException(
                $"Payment configuration '{config.DisplayName}' (Paybill {config.BusinessShortCode}) cannot be used for property '{property.Name}'.");
        }

        // Revoke existing active QR code for this meter
        var existing = await db.QrCodeRegistrations
            .FirstOrDefaultAsync(q => q.MeterId == cmd.MeterId && q.Status == QrCodeStatus.Active, ct);

        if (existing != null)
        {
            existing.Revoke("Superseded by new QR code registration.", cmd.RegisteredBy);
            db.QrCodeAuditLogs.Add(QrCodeAuditLog.Record(
                existing.Id, QrCodeAuditEvent.Revoked, cmd.RegisteredBy, "Superseded by new registration."));
        }

        var registration = QrCodeRegistration.Create(cmd.MeterId, cmd.PaymentProviderConfigId, cmd.RegisteredBy);
        db.QrCodeRegistrations.Add(registration);

        db.QrCodeAuditLogs.Add(QrCodeAuditLog.Record(
            registration.Id, QrCodeAuditEvent.Created, cmd.RegisteredBy, "Initial registration created."));

        await db.SaveChangesAsync(ct);

        var apt = meter.CurrentApartment;
        return new QrCodeRegistrationDto(
            registration.Id,
            registration.MeterId,
            meter.MeterNumber,
            meter.MaskedIdentifier,
            apt.UnitNumber,
            apt.Building.Name,
            property.Name,
            registration.PaymentProviderConfigId,
            config.BusinessShortCode,
            registration.PublicToken,
            $"https://pay.majiledger.com/p/{registration.PublicToken}",
            registration.Status,
            registration.CreatedAt,
            null,
            null);
    }
}

public class ReplaceQrCodeFeatureHandler(IApplicationDbContext db)
    : IRequestHandler<ReplaceQrCodeCommand, QrCodeRegistrationDto>
{
    public async Task<QrCodeRegistrationDto> Handle(ReplaceQrCodeCommand cmd, CancellationToken ct)
    {
        var meter = await db.Meters
            .Include(m => m.CurrentApartment)
                .ThenInclude(a => a != null ? a.Building : null)
                .ThenInclude(b => b != null ? b.Property : null)
            .FirstOrDefaultAsync(m => m.Id == cmd.MeterId, ct)
            ?? throw new NotFoundException(nameof(Meter), cmd.MeterId);

        var config = await db.PaymentProviderConfigs.FindAsync([cmd.PaymentProviderConfigId], ct)
            ?? throw new NotFoundException(nameof(PaymentProviderConfig), cmd.PaymentProviderConfigId);

        if (!config.IsActive)
            throw new ConflictException($"Payment configuration '{config.DisplayName}' is disabled.");

        if (meter.CurrentApartment == null)
            throw new ConflictException($"Meter '{meter.MeterNumber}' is not assigned to an apartment.");

        var property = meter.CurrentApartment.Building.Property;
        if (config.PropertyId.HasValue && config.PropertyId.Value != property.Id)
        {
            throw new ConflictException(
                $"Payment configuration '{config.DisplayName}' cannot be used for property '{property.Name}'.");
        }

        // Revoke previous QR registration and log as Replaced
        var existing = await db.QrCodeRegistrations
            .FirstOrDefaultAsync(q => q.MeterId == cmd.MeterId && q.Status == QrCodeStatus.Active, ct);

        if (existing != null)
        {
            existing.Revoke(cmd.Reason, cmd.ReplacedBy);
            db.QrCodeAuditLogs.Add(QrCodeAuditLog.Record(
                existing.Id, QrCodeAuditEvent.Replaced, cmd.ReplacedBy, $"Replaced: {cmd.Reason}"));
        }

        var registration = QrCodeRegistration.Create(cmd.MeterId, cmd.PaymentProviderConfigId, cmd.ReplacedBy);
        db.QrCodeRegistrations.Add(registration);

        db.QrCodeAuditLogs.Add(QrCodeAuditLog.Record(
            registration.Id, QrCodeAuditEvent.Created, cmd.ReplacedBy, "Created as replacement sticker."));

        await db.SaveChangesAsync(ct);

        var apt = meter.CurrentApartment;
        return new QrCodeRegistrationDto(
            registration.Id,
            registration.MeterId,
            meter.MeterNumber,
            meter.MaskedIdentifier,
            apt.UnitNumber,
            apt.Building.Name,
            property.Name,
            registration.PaymentProviderConfigId,
            config.BusinessShortCode,
            registration.PublicToken,
            $"https://pay.majiledger.com/p/{registration.PublicToken}",
            registration.Status,
            registration.CreatedAt,
            null,
            null);
    }
}

public class DisableQrCodeHandler(IApplicationDbContext db)
    : IRequestHandler<DisableQrCodeCommand, Unit>
{
    public async Task<Unit> Handle(DisableQrCodeCommand cmd, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations.FindAsync([cmd.RegistrationId], ct)
            ?? throw new NotFoundException(nameof(QrCodeRegistration), cmd.RegistrationId);

        if (qr.Status == QrCodeStatus.Revoked)
            throw new ConflictException("A revoked QR registration cannot be disabled.");

        qr.Disable(cmd.DisabledBy);
        db.QrCodeAuditLogs.Add(QrCodeAuditLog.Record(
            qr.Id, QrCodeAuditEvent.Disabled, cmd.DisabledBy, "Temporarily disabled by manager."));

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class EnableQrCodeHandler(IApplicationDbContext db)
    : IRequestHandler<EnableQrCodeCommand, Unit>
{
    public async Task<Unit> Handle(EnableQrCodeCommand cmd, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations.FindAsync([cmd.RegistrationId], ct)
            ?? throw new NotFoundException(nameof(QrCodeRegistration), cmd.RegistrationId);

        qr.Enable(cmd.EnabledBy);
        db.QrCodeAuditLogs.Add(QrCodeAuditLog.Record(
            qr.Id, QrCodeAuditEvent.Enabled, cmd.EnabledBy, "Re-enabled by manager."));

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class RevokeQrCodeFeatureHandler(IApplicationDbContext db)
    : IRequestHandler<RevokeQrCodeCommand, Unit>
{
    public async Task<Unit> Handle(RevokeQrCodeCommand cmd, CancellationToken ct)
    {
        var qr = await db.QrCodeRegistrations.FindAsync([cmd.RegistrationId], ct)
            ?? throw new NotFoundException(nameof(QrCodeRegistration), cmd.RegistrationId);

        qr.Revoke(cmd.Reason, cmd.RevokedBy);
        db.QrCodeAuditLogs.Add(QrCodeAuditLog.Record(
            qr.Id, QrCodeAuditEvent.Revoked, cmd.RevokedBy, cmd.Reason));

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
