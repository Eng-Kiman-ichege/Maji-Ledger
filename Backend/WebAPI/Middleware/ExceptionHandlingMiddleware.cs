using System.Net;
using System.Text.Json;
using MajiLedger.Application.Common.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace MajiLedger.WebAPI.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetails
        {
            Instance = context.Request.Path
        };

        switch (exception)
        {
            case NotFoundException ex:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                problemDetails.Status = response.StatusCode;
                problemDetails.Title = "Resource Not Found";
                problemDetails.Detail = ex.Message;
                break;

            case ValidationException ex:
                response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
                problemDetails.Status = response.StatusCode;
                problemDetails.Title = "Validation Failed";
                problemDetails.Detail = ex.Message;
                problemDetails.Extensions["errors"] = ex.Errors;
                break;

            case ConflictException ex:
                response.StatusCode = (int)HttpStatusCode.Conflict;
                problemDetails.Status = response.StatusCode;
                problemDetails.Title = "Conflict";
                problemDetails.Detail = ex.Message;
                break;

            case ForbiddenException ex:
                response.StatusCode = (int)HttpStatusCode.Forbidden;
                problemDetails.Status = response.StatusCode;
                problemDetails.Title = "Forbidden";
                problemDetails.Detail = ex.Message;
                break;

            default:
                logger.LogError(exception, "Unhandled exception occurred: {Message}", exception.Message);
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                problemDetails.Status = response.StatusCode;
                problemDetails.Title = "Internal Server Error";
                problemDetails.Detail = "An unexpected error occurred while processing the request.";
                break;
        }

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await response.WriteAsync(json);
    }
}
