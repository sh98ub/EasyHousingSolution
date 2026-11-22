using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EasyHousingSolution.Shared.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public record ExceptionResponse(
        HttpStatusCode StatusCode,
        string Message,
        string? Details = null,
        bool Success = false);

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Guid-based request correlation tracking across microservices
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        context.Response.Headers.TryAdd("X-Correlation-ID", correlationId);

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CorrelationId:{CorrelationId}] Exception: {Message}", correlationId, ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    public async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        ExceptionResponse response = exception switch
        {
            ArgumentException argEx => 
                new ExceptionResponse(HttpStatusCode.BadRequest, argEx.Message, "Invalid Argument"),

            InvalidOperationException opEx => 
                new ExceptionResponse(HttpStatusCode.BadRequest, opEx.Message, "Operation Not Allowed"),

            BadHttpRequestException badReqEx => 
                new ExceptionResponse(HttpStatusCode.BadRequest, badReqEx.Message, "Malformed Request"),

            KeyNotFoundException notFoundEx => 
                new ExceptionResponse(HttpStatusCode.NotFound, notFoundEx.Message, "Not Found"),

            UnauthorizedAccessException unauthEx => 
                new ExceptionResponse(HttpStatusCode.Unauthorized, string.IsNullOrWhiteSpace(unauthEx.Message) ? "Access denied. Authentication required." : unauthEx.Message, "Unauthorized"),

            HttpRequestException _ => 
                new ExceptionResponse(HttpStatusCode.BadGateway, "Failed to communicate with downstream microservice.", "Service Communication Error"),

            DbUpdateException _ => 
                new ExceptionResponse(HttpStatusCode.Conflict, "Record already exists or violates a database unique constraint.", "Database Conflict"),

            _ => 
                new ExceptionResponse(HttpStatusCode.InternalServerError, "An unexpected error occurred. Please try again later.", "Internal Server Error")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)response.StatusCode;
        await context.Response.WriteAsJsonAsync(response);
    }
}
