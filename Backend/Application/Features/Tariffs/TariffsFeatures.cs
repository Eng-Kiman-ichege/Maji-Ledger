using MajiLedger.Application.Common.Exceptions;
using MajiLedger.Application.Common.Interfaces;
using MajiLedger.Domain.Entities;
using MajiLedger.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MajiLedger.Application.Features.Tariffs;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record TariffTierDto(
    Guid Id,
    int TierOrder,
    decimal FromUnits,
    decimal? ToUnits,
    decimal RatePerUnit);

public record WaterTariffDto(
    Guid Id,
    Guid? PropertyId,
    string Name,
    string? Description,
    BillingCycle BillingCycle,
    decimal BaseCharge,
    decimal UnitRate,
    bool IsTiered,
    bool IsActive,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    List<TariffTierDto> Tiers);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetTariffsQuery(Guid? PropertyId = null) : IRequest<List<WaterTariffDto>>;

public record GetTariffQuery(Guid Id) : IRequest<WaterTariffDto>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateFlatTariffCommand(
    string Name,
    decimal UnitRate,
    decimal BaseCharge = 0,
    BillingCycle BillingCycle = BillingCycle.PerUnit,
    Guid? PropertyId = null,
    DateTime? EffectiveFrom = null,
    string? CreatedBy = null) : IRequest<Guid>;

public record CreateTieredTariffTierInput(
    int TierOrder,
    decimal FromUnits,
    decimal RatePerUnit,
    decimal? ToUnits = null);

public record CreateTieredTariffCommand(
    string Name,
    List<CreateTieredTariffTierInput> Tiers,
    decimal BaseCharge = 0,
    BillingCycle BillingCycle = BillingCycle.PerUnit,
    Guid? PropertyId = null,
    DateTime? EffectiveFrom = null,
    string? CreatedBy = null) : IRequest<Guid>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetTariffsHandler(IApplicationDbContext db)
    : IRequestHandler<GetTariffsQuery, List<WaterTariffDto>>
{
    public async Task<List<WaterTariffDto>> Handle(GetTariffsQuery request, CancellationToken ct)
    {
        var query = db.WaterTariffs
            .Include(t => t.Tiers)
            .Where(t => t.IsActive);

        if (request.PropertyId.HasValue)
            query = query.Where(t => t.PropertyId == request.PropertyId || t.PropertyId == null);

        var tariffs = await query.OrderBy(t => t.Name).ToListAsync(ct);

        return tariffs.Select(TariffDtoMapper.MapToDto).ToList();
    }
}

public class GetTariffHandler(IApplicationDbContext db)
    : IRequestHandler<GetTariffQuery, WaterTariffDto>
{
    public async Task<WaterTariffDto> Handle(GetTariffQuery request, CancellationToken ct)
    {
        var tariff = await db.WaterTariffs
            .Include(t => t.Tiers)
            .FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(WaterTariff), request.Id);

        return TariffDtoMapper.MapToDto(tariff);
    }
}

public class CreateFlatTariffHandler(IApplicationDbContext db)
    : IRequestHandler<CreateFlatTariffCommand, Guid>
{
    public async Task<Guid> Handle(CreateFlatTariffCommand cmd, CancellationToken ct)
    {
        if (cmd.UnitRate <= 0)
            throw new ValidationException("Unit rate must be greater than zero.");

        var tariff = WaterTariff.CreateFlat(
            cmd.Name,
            cmd.UnitRate,
            cmd.BaseCharge,
            cmd.BillingCycle,
            cmd.PropertyId,
            cmd.EffectiveFrom,
            cmd.CreatedBy);

        db.WaterTariffs.Add(tariff);
        await db.SaveChangesAsync(ct);
        return tariff.Id;
    }
}

public class CreateTieredTariffHandler(IApplicationDbContext db)
    : IRequestHandler<CreateTieredTariffCommand, Guid>
{
    public async Task<Guid> Handle(CreateTieredTariffCommand cmd, CancellationToken ct)
    {
        if (cmd.Tiers == null || cmd.Tiers.Count == 0)
            throw new ValidationException("At least one tier must be provided for a tiered tariff.");

        var tariff = WaterTariff.CreateTiered(
            cmd.Name,
            cmd.BaseCharge,
            cmd.BillingCycle,
            cmd.PropertyId,
            cmd.EffectiveFrom,
            cmd.CreatedBy);

        db.WaterTariffs.Add(tariff);

        foreach (var tierInput in cmd.Tiers)
        {
            var tier = TariffTier.Create(
                tariff.Id,
                tierInput.TierOrder,
                tierInput.FromUnits,
                tierInput.RatePerUnit,
                tierInput.ToUnits);

            db.TariffTiers.Add(tier);
        }

        await db.SaveChangesAsync(ct);
        return tariff.Id;
    }
}

// ── Private mapper ────────────────────────────────────────────────────────────

file static class TariffDtoMapper
{
    internal static WaterTariffDto MapToDto(WaterTariff t) =>
        new(
            t.Id,
            t.PropertyId,
            t.Name,
            t.Description,
            t.BillingCycle,
            t.BaseCharge,
            t.UnitRate,
            t.IsTiered,
            t.IsActive,
            t.EffectiveFrom,
            t.EffectiveTo,
            t.Tiers.OrderBy(tier => tier.TierOrder)
                .Select(tier => new TariffTierDto(
                    tier.Id,
                    tier.TierOrder,
                    tier.FromUnits,
                    tier.ToUnits,
                    tier.RatePerUnit))
                .ToList());
}
