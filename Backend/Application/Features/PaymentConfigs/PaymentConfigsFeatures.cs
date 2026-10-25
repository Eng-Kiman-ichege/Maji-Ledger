using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.PaymentConfigs;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record PaymentProviderConfigDto(
    Guid Id,
    Guid? PropertyId,
    string? PropertyName,
    PaymentProviderType ProviderType,
    string BusinessShortCode,
    string DisplayName,
    EnvironmentType EnvironmentType,
    bool IsActive);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetPaymentConfigsQuery(Guid? PropertyId = null) : IRequest<List<PaymentProviderConfigDto>>;

public record GetPaymentConfigQuery(Guid Id) : IRequest<PaymentProviderConfigDto>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreatePaymentConfigCommand(
    PaymentProviderType ProviderType,
    string BusinessShortCode,
    string DisplayName,
    EnvironmentType EnvironmentType = EnvironmentType.Production,
    Guid? PropertyId = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record DeactivatePaymentConfigCommand(
    Guid Id,
    string UpdatedBy) : IRequest<Unit>;

public record ActivatePaymentConfigCommand(
    Guid Id,
    string UpdatedBy) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetPaymentConfigsHandler(IApplicationDbContext db)
    : IRequestHandler<GetPaymentConfigsQuery, List<PaymentProviderConfigDto>>
{
    public async Task<List<PaymentProviderConfigDto>> Handle(GetPaymentConfigsQuery request, CancellationToken ct)
    {
        var query = db.PaymentProviderConfigs.Include(p => p.Property).AsQueryable();

        if (request.PropertyId.HasValue)
        {
            query = query.Where(p => p.PropertyId == request.PropertyId || p.PropertyId == null);
        }

        return await query
            .OrderBy(p => p.DisplayName)
            .Select(p => new PaymentProviderConfigDto(
                p.Id,
                p.PropertyId,
                p.Property != null ? p.Property.Name : "Platform Default",
                p.ProviderType,
                p.BusinessShortCode,
                p.DisplayName,
                p.EnvironmentType,
                p.IsActive))
            .ToListAsync(ct);
    }
}

public class GetPaymentConfigHandler(IApplicationDbContext db)
    : IRequestHandler<GetPaymentConfigQuery, PaymentProviderConfigDto>
{
    public async Task<PaymentProviderConfigDto> Handle(GetPaymentConfigQuery request, CancellationToken ct)
    {
        var config = await db.PaymentProviderConfigs
            .Include(p => p.Property)
            .FirstOrDefaultAsync(p => p.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(PaymentProviderConfig), request.Id);

        return new PaymentProviderConfigDto(
            config.Id,
            config.PropertyId,
            config.Property != null ? config.Property.Name : "Platform Default",
            config.ProviderType,
            config.BusinessShortCode,
            config.DisplayName,
            config.EnvironmentType,
            config.IsActive);
    }
}

public class CreatePaymentConfigHandler(IApplicationDbContext db)
    : IRequestHandler<CreatePaymentConfigCommand, Guid>
{
    public async Task<Guid> Handle(CreatePaymentConfigCommand cmd, CancellationToken ct)
    {
        if (cmd.PropertyId.HasValue && !await db.Properties.AnyAsync(p => p.Id == cmd.PropertyId && p.IsActive, ct))
            throw new NotFoundException(nameof(Property), cmd.PropertyId.Value);

        if (await db.PaymentProviderConfigs.AnyAsync(
            p => p.PropertyId == cmd.PropertyId &&
                 p.ProviderType == cmd.ProviderType &&
                 p.BusinessShortCode == cmd.BusinessShortCode &&
                 p.IsActive, ct))
        {
            throw new ConflictException(
                $"A payment configuration with shortcode '{cmd.BusinessShortCode}' is already registered for this scope.");
        }

        var config = PaymentProviderConfig.Create(
            cmd.ProviderType,
            cmd.BusinessShortCode,
            cmd.DisplayName,
            cmd.EnvironmentType,
            cmd.PropertyId,
            cmd.CreatedBy);

        db.PaymentProviderConfigs.Add(config);
        await db.SaveChangesAsync(ct);
        return config.Id;
    }
}

public class DeactivatePaymentConfigHandler(IApplicationDbContext db)
    : IRequestHandler<DeactivatePaymentConfigCommand, Unit>
{
    public async Task<Unit> Handle(DeactivatePaymentConfigCommand cmd, CancellationToken ct)
    {
        var config = await db.PaymentProviderConfigs.FindAsync([cmd.Id], ct)
            ?? throw new NotFoundException(nameof(PaymentProviderConfig), cmd.Id);

        config.Deactivate(cmd.UpdatedBy);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
