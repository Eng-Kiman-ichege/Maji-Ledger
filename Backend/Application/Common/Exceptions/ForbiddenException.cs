namespace MajiLedger.Application.Common.Exceptions;

/// <summary>
/// Thrown when an authorized user is forbidden from performing an operation. Maps to HTTP 403.
/// </summary>
public class ForbiddenException(string message = "Access denied.") : Exception(message);
