// ============================================================================
// Document: Program.cs
// Project:  Easy Housing Solutions (EHS)
// Module:   ApiGateway
// Purpose:  Entry point and reverse-proxy configuration for all microservices.
// Language: C# (.NET 8 with Ocelot & ASP.NET Core)
// Description:
//   Acts as the central gateway (port 5000) routing incoming requests to:
//   - IdentityService (:5001)
//   - PropertyService (:5002)
//   - UserService     (:5003)
//   - CartService     (:5004)
//   Also handles CORS, unified Swagger documentation, and centralized Serilog logging.
// ============================================================================

using EasyHousingSolution.Shared.Logging;
using EasyHousingSolution.Shared.Middleware;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.ConfigureSerilog("ApiGateway");

// Load Ocelot configuration
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// Add Ocelot services
builder.Services.AddOcelot(builder.Configuration);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Serilog HTTP request logging
app.UseSerilogRequestLogging();

// Global Exception Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseCors("AllowAll");

// Auto-redirect root to /swagger
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/" || context.Request.Path == "")
    {
        context.Response.Redirect("/swagger");
        return;
    }
    await next();
});

// Unified Swagger UI for all microservices
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("http://localhost:5001/swagger/v1/swagger.json", "Identity Service (Port 5001)");
    options.SwaggerEndpoint("http://localhost:5002/swagger/v1/swagger.json", "Property Service (Port 5002)");
    options.SwaggerEndpoint("http://localhost:5003/swagger/v1/swagger.json", "User Service (Port 5003)");
    options.SwaggerEndpoint("http://localhost:5004/swagger/v1/swagger.json", "Cart Service (Port 5004)");
    options.RoutePrefix = "swagger";
    options.DocumentTitle = "EasyHousingSolution - Unified API Gateway";
});

await app.UseOcelot();

app.Run("http://localhost:5000");
