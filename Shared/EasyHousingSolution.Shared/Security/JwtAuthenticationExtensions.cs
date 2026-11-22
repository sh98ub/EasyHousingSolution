using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace EasyHousingSolution.Shared.Security;

public static class JwtAuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var secretKey = configuration["Jwt:Key"] ?? "EasyHousingSolutionSuperSecretKey2026!@#$%^";
        var issuer = configuration["Jwt:Issuer"] ?? "EasyHousingSolution";
        var audience = configuration["Jwt:Audience"] ?? "EasyHousingSolution";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                RoleClaimType = System.Security.Claims.ClaimTypes.Role
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
                    if (!string.IsNullOrEmpty(authHeader))
                    {
                        var trimmed = authHeader.Trim();
                        // Automatically strip "Bearer " if present; otherwise use the raw token as-is
                        context.Token = trimmed.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                            ? trimmed["Bearer ".Length..].Trim()
                            : trimmed;
                    }
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    if (context.Principal?.Identity is System.Security.Claims.ClaimsIdentity identity)
                    {
                        var role = identity.FindFirst("role")?.Value ?? identity.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                        if (!string.IsNullOrEmpty(role))
                        {
                            if (!identity.HasClaim(System.Security.Claims.ClaimTypes.Role, role))
                            {
                                identity.AddClaim(new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, role));
                            }
                            if (!identity.HasClaim("role", role))
                            {
                                identity.AddClaim(new System.Security.Claims.Claim("role", role));
                            }
                        }
                    }
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();

        return services;
    }
}
