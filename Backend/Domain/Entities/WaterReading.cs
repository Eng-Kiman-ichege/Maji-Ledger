using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A water consumption reading record with prior reading comparison and validation.
/// </summary>
public class WaterReading : BaseEntity
{
    public Guid WaterMeterId { get; private set; }
    public decimal PreviousReading { get; private set; }
    public decimal CurrentReading { get; private set; }
    public decimal Consumption { get; private set; }
    public DateTime ReadingDate { get; private set; }
    public MeterReadingSource ReadingSource { get; private set; }
    public string? RecordedByUserId { get; private set; }
    public string? Notes { get; private set; }

    // Navigation
    public Meter WaterMeter { get; private set; } = default!;

    private WaterReading() { }

    public static WaterReading Create(
        Guid waterMeterId,
        decimal previousReading,
        decimal currentReading,
        MeterReadingSource readingSource = MeterReadingSource.Manual,
        DateTime? readingDate = null,
        string? recordedByUserId = null,
        string? notes = null,
        bool isCorrection = false)
    {
        if (currentReading < previousReading && !isCorrection)
            throw new InvalidOperationException($"Current reading ({currentReading:N2}) cannot be less than previous reading ({previousReading:N2}) unless marked as an authorized correction.");

        var consumption = currentReading - previousReading;

        return new WaterReading
        {
            WaterMeterId = waterMeterId,
            PreviousReading = previousReading,
            CurrentReading = currentReading,
            Consumption = Math.Max(0m, consumption),
            ReadingSource = readingSource,
            ReadingDate = readingDate ?? DateTime.UtcNow,
            RecordedByUserId = recordedByUserId,
            Notes = notes
        };
    }
}
