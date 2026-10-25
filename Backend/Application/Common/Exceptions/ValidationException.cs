namespace MajiLedger.Application.Common.Exceptions;

/// <summary>
/// Thrown when a validation pipeline behavior rejects a request. Maps to HTTP 422.
/// </summary>
public class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation errors occurred.")
    {
        Errors = errors;
    }

    public ValidationException(string propertyName, string errorMessage)
        : this(new Dictionary<string, string[]> { [propertyName] = [errorMessage] })
    { }

    public ValidationException(string message)
        : base(message)
    {
        Errors = new Dictionary<string, string[]> { ["General"] = [message] };
    }

    public ValidationException(IEnumerable<string> errors)
        : base(string.Join("; ", errors))
    {
        Errors = new Dictionary<string, string[]> { ["General"] = errors.ToArray() };
    }
}
