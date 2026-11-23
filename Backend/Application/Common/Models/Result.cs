namespace MajiLedger.Application.Common.Models;

public class Result
{
    public bool Succeeded { get; }
    public string? Error { get; }
    public IReadOnlyList<string> Errors { get; }

    protected Result(bool succeeded, string? error, IEnumerable<string>? errors = null)
    {
        Succeeded = succeeded;
        Error = error;
        Errors = errors?.ToList() ?? (error != null ? [error] : []);
    }

    public static Result Success() => new(true, null);
    public static Result Failure(string error) => new(false, error);
    public static Result Failure(IEnumerable<string> errors) => new(false, null, errors);
}

public class Result<T> : Result
{
    public T? Value { get; }

    protected Result(bool succeeded, T? value, string? error, IEnumerable<string>? errors = null)
        : base(succeeded, error, errors)
    {
        Value = value;
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public new static Result<T> Failure(string error) => new(false, default, error);
    public new static Result<T> Failure(IEnumerable<string> errors) => new(false, default, null, errors);
}
