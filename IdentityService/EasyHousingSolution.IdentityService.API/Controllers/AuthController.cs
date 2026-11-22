// ============================================================================
// Document: AuthController.cs
// Project:  Easy Housing Solutions (EHS)
// Module:   IdentityService.API
// Purpose:  Authentication and user registration controller.
// Language: C# (.NET 8 with ASP.NET Core Web API)
// Description:
//   Provides endpoints for:
//   - User login and issuing signed JWT access tokens.
//   - Buyer registration with profile details.
//   - Seller registration with contact and location details.
// ============================================================================

using EasyHousingSolution.IdentityService.Application.DTOs;
using EasyHousingSolution.IdentityService.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EasyHousingSolution.IdentityService.API.Controllers;

/// <summary>
/// API Controller managing authentication, JWT generation, and new user registration.
/// </summary>
[ApiController]
[Route("api/identity")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register-buyer")]
    [Tags("Buyer")]
    public async Task<IActionResult> RegisterBuyer(RegisterBuyerDto dto)
    {
        var result = await _authService.RegisterBuyerAsync(dto);
        return Ok(result);
    }

    [HttpPost("register-seller")]
    [Tags("Seller")]
    public async Task<IActionResult> RegisterSeller(RegisterSellerDto dto)
    {
        var result = await _authService.RegisterSellerAsync(dto);
        return Ok(result);
    }

    [HttpPost("login")]
    [Tags("User")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return Ok(result);
    }
}
