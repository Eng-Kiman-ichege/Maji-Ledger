using MajiLedger.Application.Common.Interfaces;

namespace MajiLedger.Infrastructure.Services;

public class DateTimeService : IDateTime
{
    public DateTime UtcNow => DateTime.UtcNow;
}
