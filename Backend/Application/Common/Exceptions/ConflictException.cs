namespace MajiLedger.Application.Common.Exceptions;

/// <summary>
/// Thrown when a business-rule conflict is detected. Maps to HTTP 409.
/// </summary>
public class ConflictException(string message) : Exception(message);
