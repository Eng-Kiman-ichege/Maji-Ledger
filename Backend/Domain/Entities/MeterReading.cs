using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// A manual or automated meter reading record.
/// Used to calculate consumption between readings.
/// </summary>
public class MeterReading : BaseEntity
{
    public Guid MeterId { get; private set; }
    public decimal ReadingValue { get; private set; }  // Cumulative m³
    public MeterReadingSource Source { get; private set; }
    public DateTime ReadAt { get; private set; }
    public string? RecordedBy { get; private set; }

    // Navigation
    public Meter Meter { get; private set; } = default!;

    private MeterReading() { }

    public static MeterReading Record(
        Guid meterId,
        decimal readingValue,
        MeterReadingSource source,
        DateTime? readAt = null,
        string? recordedBy = null)
    {
        if (readingValue < 0)
            throw new ArgumentOutOfRangeException(nameof(readingValue), "Meter reading cannot be negative.");

        return new MeterReading
        {
            MeterId = meterId,
            ReadingValue = readingValue,
            Source = source,
            ReadAt = readAt ?? DateTime.UtcNow,
            RecordedBy = recordedBy
        };
    }
}
