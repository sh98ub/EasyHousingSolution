

using EasyHousingSolution.CartService.Application.DTOs;
using EasyHousingSolution.CartService.Application.Interfaces;
using EasyHousingSolution.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyHousingSolution.CartService.API.Controllers;

/// <summary>
/// API Controller managing buyer cart and saved property bookmarks.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ICartAppService _cartAppService;

    public CartController(ICartAppService cartAppService)
    {
        _cartAppService = cartAppService;
    }

    // Helper property to extract the logged-in buyer's ID from the JWT token
    private int CurrentBuyerId => User.GetProfileId();

    [HttpPost("items")]
    [Authorize(Roles = "Buyer")]
    [Tags("Buyer")]
    public async Task<IActionResult> AddToCart(AddToCartDto dto)
    {
        // Priority to token's authenticated ID; fallback to DTO if available
        var buyerId = CurrentBuyerId > 0 ? CurrentBuyerId : dto.BuyerId;
        if (buyerId <= 0)
        {
            return BadRequest(new { success = false, message = "A valid Buyer profile is required." });
        }

        var result = await _cartAppService.AddToCartAsync(buyerId, dto.PropertyId);
        return Ok(result);
    }

    [HttpDelete("items/{id:int}")]
    [Authorize(Roles = "Buyer")]
    [Tags("Buyer")]
    public async Task<IActionResult> RemovePropertyFromCart(int id)
    {
        await _cartAppService.RemovePropertyFromCartAsync(CurrentBuyerId, id);
        return Ok(new { success = true, message = "Property removed from cart successfully." });
    }

    // Logged-in Buyer retrieves their own cart items
    [HttpGet]
    [Authorize(Roles = "Buyer")]
    [Tags("Buyer")]
    public async Task<IActionResult> GetMyCart()
    {
        if (CurrentBuyerId <= 0)
        {
            return Ok(Enumerable.Empty<EnrichedCartItemDto>());
        }

        var result = await _cartAppService.GetBuyerCartAsync(CurrentBuyerId);
        return Ok(result);
    }

    // Admin or Buyer retrieves cart items by specific Buyer ID
    [HttpGet("buyer/{buyerId:int}")]
    [Authorize(Roles = "Buyer,Admin")]
    [Tags("Buyer", "Admin")]
    public async Task<IActionResult> GetCartByBuyerId(int buyerId)
    {
        var result = await _cartAppService.GetBuyerCartAsync(buyerId);
        return Ok(result);
    }

    // Clears all items in the logged-in buyer's cart
    [HttpDelete]
    [Authorize(Roles = "Buyer")]
    [Tags("Buyer")]
    public async Task<IActionResult> ClearMyCart()
    {
        await _cartAppService.ClearBuyerCartAsync(CurrentBuyerId);
        return Ok(new { success = true, message = "Cart cleared successfully." });
    }
}
