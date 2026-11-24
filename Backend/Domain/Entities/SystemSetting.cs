using MajiLedger.Domain.Common;
using MajiLedger.Domain.Enums;

namespace MajiLedger.Domain.Entities;

/// <summary>
/// Dynamic platform configuration key-value pair.
/// Sensitive values (e.g. API keys) can be marked IsEncrypted and redacted from API responses.
/// </summary>
public class SystemSetting : BaseEntity
{
    public string Key { get; private set; } = string.Empty;
    public string Value { get; private set; } = string.Empty;
    public SettingCategory Category { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public bool IsEncrypted { get; private set; }
    public string UpdatedBy { get; private set; } = string.Empty;

    private SystemSetting() { }

    public static SystemSetting Create(
        string key,
        string value,
        SettingCategory category,
        string description,
        bool isEncrypted,
        string createdBy)
    {
        return new SystemSetting
        {
            Key = key.Trim(),
            Value = value,
            Category = category,
            Description = description.Trim(),
            IsEncrypted = isEncrypted,
            UpdatedBy = createdBy
        };
    }

    public void Update(string value, string updatedBy)
    {
        Value = value;
        UpdatedBy = updatedBy;
        MarkUpdated();
    }
}
