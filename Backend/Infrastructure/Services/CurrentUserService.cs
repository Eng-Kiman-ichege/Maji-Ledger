using MajiLedger.Application.Common.Interfaces;

namespace MajiLedger.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    public string? UserId => "System";
    public string? Role => "Admin";
}
