using System.Net;
using System.Net.Http.Json;
using EasyHousingSolution.CartService.Application.DTOs;
using EasyHousingSolution.CartService.Application.Interfaces;
using EasyHousingSolution.CartService.Domain.Entities;
using EasyHousingSolution.CartService.Domain.Interfaces;

namespace EasyHousingSolution.CartService.Application.Services;

public class CartAppService : ICartAppService
{
    private readonly ICartRepository _cartRepository;
    private readonly HttpClient _httpClient;

    public CartAppService(ICartRepository cartRepository, HttpClient httpClient)
    {
        _cartRepository = cartRepository;
        _httpClient = httpClient;
    }

    // Helper: Fetches property details from PropertyService
    private async Task<PropertySummaryDto?> GetProperty(int propertyId)
    {
        if (_httpClient.BaseAddress == null) return null;

        try
        {
            var response = await _httpClient.GetAsync($"api/properties/{propertyId}");

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                throw new KeyNotFoundException($"Property with ID {propertyId} does not exist.");
            }

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            return await response.Content.ReadFromJsonAsync<PropertySummaryDto>();
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }

    public Task<CartItemDto> AddToCartAsync(AddToCartDto dto) => AddToCartAsync(dto.BuyerId, dto.PropertyId);

    public async Task<CartItemDto> AddToCartAsync(int buyerId, int propertyId)
    {
        // 1. Check duplicate
        if (await _cartRepository.ExistsAsync(buyerId, propertyId))
        {
            throw new InvalidOperationException("Property is already in buyer's cart.");
        }

        // 2. Validate property from PropertyService
        var property = await GetProperty(propertyId);
        if (property != null)
        {
            if (!property.IsActive)
            {
                throw new InvalidOperationException("This property is no longer active or available.");
            }

            if (property.SellerId == buyerId)
            {
                throw new InvalidOperationException("Sellers cannot add their own properties to the cart.");
            }
        }

        // 3. Save to database
        var item = new CartItem
        {
            BuyerId = buyerId,
            PropertyId = propertyId
        };

        var created = await _cartRepository.AddAsync(item);
        return new CartItemDto
        {
            CartId = created.CartId,
            BuyerId = created.BuyerId,
            PropertyId = created.PropertyId
        };
    }

    public async Task<bool> RemovePropertyFromCartAsync(int buyerId, int id)
    {
        var items = await _cartRepository.GetByBuyerIdAsync(buyerId);
        var item = items.FirstOrDefault(i => i.PropertyId == id) ?? items.FirstOrDefault(i => i.CartId == id);
        if (item == null)
        {
            return true;
        }
        return await _cartRepository.RemoveAsync(item.CartId);
    }

    public async Task<IEnumerable<EnrichedCartItemDto>> GetBuyerCartAsync(int buyerId)
    {
        var items = await _cartRepository.GetByBuyerIdAsync(buyerId);
        var result = new List<EnrichedCartItemDto>();

        foreach (var item in items)
        {
            var property = await GetProperty(item.PropertyId);
            result.Add(new EnrichedCartItemDto
            {
                CartId = item.CartId,
                BuyerId = item.BuyerId,
                PropertyId = item.PropertyId,
                Property = property
            });
        }

        return result;
    }

    public async Task<bool> ClearBuyerCartAsync(int buyerId)
    {
        return await _cartRepository.ClearBuyerCartAsync(buyerId);
    }
}
