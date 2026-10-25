using FluentValidation;
using MediatR;

namespace MajiLedger.Application.Common.Behaviours;

/// <summary>
/// MediatR pipeline behavior that runs FluentValidation validators before each request handler.
/// Aggregates all failures and throws a single <see cref="Exceptions.ValidationException"/>.
/// </summary>
public class ValidationBehaviour<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!validators.Any())
            return await next(cancellationToken);

        var context = new ValidationContext<TRequest>(request);

        var failures = validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Count != 0)
        {
            var errors = failures
                .GroupBy(f => f.PropertyName, f => f.ErrorMessage)
                .ToDictionary(g => g.Key, g => g.ToArray());

            throw new Exceptions.ValidationException(errors);
        }

        return await next(cancellationToken);
    }
}
