namespace MajiLedger.Application.Common.Exceptions;

/// <summary>
/// Thrown when a requested entity cannot be found. Maps to HTTP 404.
/// </summary>
public class NotFoundException(string name, object key)
    : Exception($"Entity '{name}' with key '{key}' was not found.")
{
    public string EntityName { get; } = name;
    public object Key { get; } = key;
}
