// ============================================================================
// Document: UsersController.cs
// Project:  Easy Housing Solutions (EHS)
// Module:   UserService.API
// Purpose:  REST API Controller for managing User profiles (Buyer, Seller, Admin).
// Language: C# (.NET 8 with ASP.NET Core Web API)
// Description:
//   Handles profile information for buyers and sellers:
//   - Getting and updating personal profile information.
//   - Fetching contact information when buyers request seller contacts.
//   - Admin operations: listing all registered users, updating status, changing roles.
// ============================================================================

using EasyHousingSolution.Shared.Security;
using EasyHousingSolution.UserService.Application.DTOs;
using EasyHousingSolution.UserService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyHousingSolution.UserService.API.Controllers;

/// <summary>
/// API Controller for buyer and seller profile management and admin user administration.
/// </summary>
[ApiController]
[Route("api")]
public class UsersController : ControllerBase
{
    private readonly IUserAppService _userAppService;
    private readonly IBuyerAppService _buyerAppService;
    private readonly ISellerAppService _sellerAppService;

    public UsersController(
        IUserAppService userAppService,
        IBuyerAppService buyerAppService,
        ISellerAppService sellerAppService)
    {
        _userAppService = userAppService;
        _buyerAppService = buyerAppService;
        _sellerAppService = sellerAppService;
    }

    // =========================================================================
    // PROFILE SELF-SERVICE (Buyer / Seller - View & Update Own Profile)
    // =========================================================================

    [HttpGet("users/profile")]
    [Authorize]
    [Tags("Buyer", "Seller")]
    public async Task<IActionResult> GetMyProfile()
    {
        var user = await _userAppService.GetUserByIdAsync(User.GetProfileId());
        return user != null ? Ok(user) : NotFound("User profile not found.");
    }

    [HttpPut("users/profile")]
    [Authorize]
    [Tags("Buyer", "Seller")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateUserProfileDto dto)
    {
        var id = User.GetProfileId();

        if (User.IsSeller())
        {
            var updated = await _sellerAppService.UpdateSellerProfileAsync(id, new UpdateSellerProfileDto
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PhoneNo = dto.PhoneNo,
                Address = dto.Address ?? string.Empty,
                StateId = dto.StateId ?? 1,
                CityId = dto.CityId ?? 1
            });
            return updated != null ? Ok(updated) : NotFound("Seller profile not found.");
        }

        var buyerUpdated = await _buyerAppService.UpdateBuyerProfileAsync(id, new UpdateBuyerProfileDto
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            PhoneNo = dto.PhoneNo,
            DateOfBirth = dto.DateOfBirth
        });
        return buyerUpdated != null ? Ok(buyerUpdated) : NotFound("Buyer profile not found.");
    }

    // =========================================================================
    // ADMIN USER MANAGEMENT (View All, View Particular, Activate, Deactivate, Role, Delete)
    // =========================================================================

    [HttpGet("admin/users")]
    [Authorize(Roles = "Admin")]
    [Tags("Admin User Management")]
    public async Task<IActionResult> GetAllUsers([FromQuery] string? role = null, [FromQuery] bool? isActive = null)
    {
        var users = await _userAppService.GetAllUsersAsync(role, isActive);
        return Ok(users);
    }

    [HttpGet("admin/users/{id:int}")]
    [Authorize(Roles = "Admin")]
    [Tags("Admin User Management")]
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _userAppService.GetUserByIdAsync(id);
        return user != null ? Ok(user) : NotFound($"User with ID {id} not found.");
    }

    [HttpPut("admin/users/{id:int}/activate")]
    [Authorize(Roles = "Admin")]
    [Tags("Admin User Management")]
    public async Task<IActionResult> ActivateUser(int id, [FromBody] UserActivationDto? dto = null)
    {
        var updated = await _userAppService.UpdateUserStatusAsync(id, true, dto?.Reason);
        return updated
            ? Ok(new { success = true, message = $"User #{id} activated successfully." })
            : NotFound($"User with ID {id} not found.");
    }

    [HttpPut("admin/users/{id:int}/deactivate")]
    [Authorize(Roles = "Admin")]
    [Tags("Admin User Management")]
    public async Task<IActionResult> DeactivateUser(int id, [FromBody] UserStatusUpdateDto? dto = null)
    {
        var updated = await _userAppService.UpdateUserStatusAsync(id, false, dto?.Reason);
        return updated
            ? Ok(new { success = true, message = $"User #{id} deactivated successfully." })
            : NotFound($"User with ID {id} not found.");
    }

    [HttpPut("admin/users/{id:int}/role")]
    [Authorize(Roles = "Admin")]
    [Tags("Admin User Management")]
    public async Task<IActionResult> ChangeUserRole(int id, [FromBody] ChangeUserRoleDto dto)
    {
        var updated = await _userAppService.ChangeUserRoleAsync(id, dto.NewRole, dto.Reason);
        return updated
            ? Ok(new { success = true, message = $"User #{id} role changed to '{dto.NewRole}' successfully." })
            : NotFound($"User with ID {id} not found.");
    }

    [HttpDelete("admin/users/{id:int}")]
    [Authorize(Roles = "Admin")]
    [Tags("Admin User Management")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var deleted = await _userAppService.DeleteUserAsync(id);
        return deleted
            ? Ok(new { success = true, message = $"User #{id} deleted successfully." })
            : NotFound($"User with ID {id} not found.");
    }

    // =========================================================================
    // INTERNAL PROVISIONING (Direct HttpClient calls from IdentityService)
    // =========================================================================

    [HttpPost("buyers")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> CreateBuyerProfile([FromBody] CreateBuyerDto dto)
    {
        var buyer = await _buyerAppService.CreateBuyerAsync(dto);
        return Ok(new { buyerId = buyer.BuyerId });
    }

    [HttpGet("buyers/by-email/{email}")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> GetBuyerByEmail(string email)
    {
        var buyer = await _buyerAppService.GetBuyerByEmailAsync(Uri.UnescapeDataString(email));
        return buyer != null ? Ok(new { buyerId = buyer.BuyerId, firstName = buyer.FirstName, lastName = buyer.LastName }) : NotFound();
    }

    [HttpPost("sellers")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> CreateSellerProfile([FromBody] CreateSellerDto dto)
    {
        var seller = await _sellerAppService.CreateSellerAsync(dto);
        return Ok(new { sellerId = seller.SellerId });
    }

    [HttpGet("sellers/by-email/{email}")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> GetSellerByEmail(string email)
    {
        var seller = await _sellerAppService.GetSellerByEmailAsync(Uri.UnescapeDataString(email));
        return seller != null ? Ok(new { sellerId = seller.SellerId, firstName = seller.FirstName, lastName = seller.LastName }) : NotFound();
    }
}
