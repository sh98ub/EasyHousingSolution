// ============================================================================
// Document: PropertiesController.cs
// Project:  Easy Housing Solutions (EHS)
// Module:   PropertyService.API
// Purpose:  REST API Controller exposing property management endpoints.
// Language: C# (.NET 8 with ASP.NET Core Web API)
// Description:
//   Exposes HTTP endpoints for:
//   - Buyers: View verified properties, search/filter properties, buy/rent properties.
//   - Sellers: Post new properties, update property details, view own properties.
//   - Admins: Verify, reject, or deactivate properties with comments.
// ============================================================================

using EasyHousingSolution.PropertyService.Application.DTOs;
using EasyHousingSolution.PropertyService.Application.Interfaces;
using EasyHousingSolution.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyHousingSolution.PropertyService.API.Controllers;

/// <summary>
/// API Controller for handling real estate property operations across all roles.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyAppService _propertyService;

    public PropertiesController(IPropertyAppService propertyService)
    {
        _propertyService = propertyService;
    }

    // Helper to get logged-in user's profile ID from the token
    private int CurrentProfileId => User.GetProfileId();

    [HttpGet("verified")]
    [Tags("Buyer")]
    public async Task<IActionResult> GetAllProperties()
    {
        var properties = await _propertyService.GetVerifiedPropertiesAsync();
        return Ok(properties);
    }

    [HttpPost]
    [Tags("Seller")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> CreateProperty(CreatePropertyDto dto)
    {
        dto.SellerId = CurrentProfileId;
        var created = await _propertyService.CreatePropertyAsync(dto);
        return CreatedAtAction(nameof(GetPropertyById), new { id = created.PropertyId }, created);
    }

    [HttpPut("{id:int}")]
    [Tags("Seller")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> UpdateProperty(int id, UpdatePropertyDto dto)
    {
        var existing = await _propertyService.GetPropertyByIdAsync(id);
        if (existing == null)
        {
            return NotFound($"Property with ID {id} not found.");
        }

        if (!User.IsAdmin() && existing.SellerId != CurrentProfileId)
        {
            return Forbid();
        }

        var updated = await _propertyService.UpdatePropertyAsync(id, dto);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [Tags("Seller")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> DeleteProperty(int id)
    {
        var existing = await _propertyService.GetPropertyByIdAsync(id);
        if (existing == null)
        {
            return NotFound($"Property with ID {id} not found.");
        }

        if (!User.IsAdmin() && existing.SellerId != CurrentProfileId)
        {
            return Forbid();
        }

        await _propertyService.DeletePropertyAsync(id);
        return Ok(new { success = true, message = "Property deleted successfully." });
    }

    [HttpGet("{id:int}")]
    [Tags("Buyer")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPropertyById(int id)
    {
        var property = await _propertyService.GetPropertyByIdAsync(id);
        if (property == null)
        {
            return NotFound($"Property with ID {id} not found.");
        }
        return Ok(property);
    }

    [HttpGet("search")]
    [Tags("Buyer")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchProperties(
        [FromQuery] int? cityId,
        [FromQuery] string? propertyType,
        [FromQuery] string? propertyOption,
        [FromQuery] string? sortBy,
        [FromQuery] int? stateId = null)
    {
        var properties = await _propertyService.SearchPropertiesAsync(cityId, propertyType, propertyOption, sortBy, stateId);
        return Ok(properties);
    }

    // --- View Property by Owner (Administrator & Seller) ---

    [HttpGet("seller/{sellerId:int}")]
    [Tags("Admin")]
    [Authorize(Roles = "Admin,Seller")]
    public async Task<IActionResult> GetPropertiesBySeller(int sellerId, [FromQuery] bool? isActive = null)
    {
        var properties = await _propertyService.GetPropertiesBySellerAsync(sellerId, isActive);
        return Ok(properties);
    }

    // --- Seller Self-Service Endpoints ---

    [HttpGet("my-properties")]
    [Tags("Seller")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> GetMyProperties([FromQuery] bool? isActive = null)
    {
        var properties = await _propertyService.GetPropertiesBySellerAsync(CurrentProfileId, isActive);
        return Ok(properties);
    }

    // --- Buyer Purchase & Seller Sold Endpoints ---

    [HttpGet("my-purchases")]
    [Tags("Buyer")]
    [Authorize(Roles = "Buyer")]
    public async Task<IActionResult> GetMyPurchases()
    {
        var purchases = await _propertyService.GetPurchasedPropertiesByBuyerIdAsync(CurrentProfileId);
        return Ok(purchases);
    }

    [HttpGet("buyer/{buyerId:int}/purchases")]
    [Tags("Buyer", "Admin")]
    [Authorize(Roles = "Buyer,Admin")]
    public async Task<IActionResult> GetBuyerPurchases(int buyerId)
    {
        var purchases = await _propertyService.GetPurchasedPropertiesByBuyerIdAsync(buyerId);
        return Ok(purchases);
    }

    [HttpPost("{id:int}/buy")]
    [Tags("Buyer")]
    [Authorize(Roles = "Buyer")]
    public async Task<IActionResult> BuyProperty(int id)
    {
        var bought = await _propertyService.BuyPropertyAsync(id, CurrentProfileId);
        return Ok(bought);
    }

    [HttpGet("my-sold")]
    [Tags("Seller")]
    public async Task<IActionResult> GetSellerSoldProperties()
    {
        var sold = await _propertyService.GetSoldPropertiesBySellerIdAsync(CurrentProfileId);
        return Ok(sold);
    }

    // --- Admin Property Moderation & Status Endpoints ---

    [HttpGet("/api/verifications/sales-report")]
    [Tags("Admin")]
    public async Task<IActionResult> GetSalesReport()
    {
        var all = (await _propertyService.GetAllPropertiesAsync()).ToList();
        var sold = all.Where(p => !p.IsActive && p.DeactivationReason != null && p.DeactivationReason.StartsWith("Sold")).ToList();
        var active = all.Where(p => p.IsActive).ToList();
        var deactivated = all.Where(p => !p.IsActive && (p.DeactivationReason == null || !p.DeactivationReason.StartsWith("Sold"))).ToList();

        var report = new
        {
            totalProperties = all.Count,
            totalActiveProperties = active.Count,
            totalSoldProperties = sold.Count,
            totalDeactivatedProperties = deactivated.Count,
            totalSoldValue = sold.Sum(p => p.PriceRange),
            totalActiveValue = active.Sum(p => p.PriceRange),
            soldProperties = sold
        };

        return Ok(report);
    }

    [HttpGet("admin/all")]
    [Tags("Admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllPropertiesForAdmin()
    {
        var properties = await _propertyService.GetAllPropertiesAsync();
        return Ok(properties);
    }

    [HttpPut("{id:int}/approve")]
    [Tags("Admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveProperty(int id)
    {
        var result = await _propertyService.VerifyPropertyAsync(id);
        return Ok(result);
    }

    [HttpPut("{id:int}/reject")]
    [Tags("Admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectProperty(int id, [FromBody] DeactivatePropertyDto? dto)
    {
        string reason = dto?.Reason ?? "Rejected by Administrator";
        var result = await _propertyService.DeactivatePropertyAsync(id, reason);
        return Ok(result);
    }
}
