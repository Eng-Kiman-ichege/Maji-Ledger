namespace MajiLedger.Application.Common.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string name, object key)
        : base($"Entity '{name}' with key '{key}' was not found.") { }
}

public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }

    public ValidationException(IEnumerable<string> errors)
        : base(string.Join("; ", errors)) { }
}

public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

public class ForbiddenException : Exception
{
    public ForbiddenException(string message = "Access denied.") : base(message) { }
}
