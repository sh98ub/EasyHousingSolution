// ============================================================================
// Document: PropertyAppServices.cs
// Project:  Easy Housing Solutions (EHS)
// Module:   PropertyService.Application
// Purpose:  Core business logic service for property operations.
// Language: C# (.NET 8)
// Description:
//   Handles property lifecycle management:
//   - Sellers adding, editing, and listing their properties
//   - Admin approving, rejecting, or deactivating properties
//   - Buyers browsing verified properties, searching with filters, and purchasing/renting
//   - Image count restrictions (up to 6 images per property)
// ============================================================================

using EasyHousingSolution.PropertyService.Application.DTOs;
using EasyHousingSolution.PropertyService.Application.Interfaces;
using EasyHousingSolution.PropertyService.Domain.Entities;
using EasyHousingSolution.PropertyService.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace EasyHousingSolution.PropertyService.Application.Services;

/// <summary>
/// Service implementing business logic and validation for real estate properties.
/// </summary>
public class PropertyAppService : IPropertyAppService
{
    private readonly IPropertyRepository _propertyRepository;
    private readonly ILogger<PropertyAppService> _logger;
    private readonly IPropertyImageRepository? _imageRepository;

    public PropertyAppService(
        IPropertyRepository propertyRepository,
        ILogger<PropertyAppService> logger,
        IPropertyImageRepository? imageRepository = null)
    {
        _propertyRepository = propertyRepository;
        _logger = logger;
        _imageRepository = imageRepository;
    }

    public async Task<PropertyResponseDto> CreatePropertyAsync(CreatePropertyDto dto)
    {
        _logger.LogInformation("Creating property '{PropertyName}' for SellerId {SellerId}", dto.PropertyName, dto.SellerId);
        if (string.IsNullOrWhiteSpace(dto.PropertyName))
            throw new ArgumentException("Property name is required.");
        dto.Images ??= new List<string>();
        if (dto.Images.Count > 6)
            throw new ArgumentException("A property can have a maximum of 6 images.");
        if (dto.Images.Count > 0 && _imageRepository == null)
            throw new InvalidOperationException("Property image storage is unavailable.");

        var property = new Property
        {
            PropertyName = dto.PropertyName.Trim(),
            PropertyType = dto.PropertyType.Trim(),
            PropertyOption = dto.PropertyOption.Trim(),
            Description = dto.Description?.Trim(),
            Address = dto.Address.Trim(),
            PriceRange = dto.PriceRange,
            InitialDeposit = dto.PropertyOption.Equals("Rent", StringComparison.OrdinalIgnoreCase) ? dto.InitialDeposit : 0,
            Landmark = dto.Landmark.Trim(),
            IsActive = false, // Pending admin verification
            SellerId = dto.SellerId,
            CityId = dto.CityId
        };

        var created = await _propertyRepository.AddAsync(property);
        if (_imageRepository != null)
        {
            foreach (var image in dto.Images.Where(image => !string.IsNullOrWhiteSpace(image)))
            {
                await _imageRepository.AddAsync(new PropertyImage
                {
                    PropertyId = created.PropertyId,
                    ImageData = image
                });
            }
        }

        return MapToDto(created);
    }

    public async Task<PropertyResponseDto> UpdatePropertyAsync(int id, UpdatePropertyDto dto)
    {
        var existing = await _propertyRepository.GetByIdAsync(id);
        if (existing == null)
            throw new KeyNotFoundException($"Property with ID {id} not found.");

        existing.PropertyName = dto.PropertyName.Trim();
        existing.PropertyType = dto.PropertyType.Trim();
        existing.PropertyOption = dto.PropertyOption.Trim();
        existing.Description = dto.Description?.Trim();
        existing.Address = dto.Address.Trim();
        existing.PriceRange = dto.PriceRange;
        existing.InitialDeposit = dto.PropertyOption.Equals("Rent", StringComparison.OrdinalIgnoreCase) ? dto.InitialDeposit : 0;
        existing.Landmark = dto.Landmark.Trim();
        existing.CityId = dto.CityId;

        await _propertyRepository.UpdateAsync(existing);
        return MapToDto(existing);
    }

    public async Task<PropertyResponseDto?> GetPropertyByIdAsync(int id)
    {
        var property = await _propertyRepository.GetByIdAsync(id);
        if (property == null) return null;
        var dto = MapToDto(property);
        await PopulateImagesAsync(dto);
        return dto;
    }

    public async Task<IEnumerable<PropertyResponseDto>> GetAllPropertiesAsync()
    {
        var list = await _propertyRepository.GetAllAsync();
        var dtos = list.Select(MapToDto).ToList();
        await PopulateImagesAsync(dtos);
        return dtos;
    }

    public async Task<IEnumerable<PropertyResponseDto>> GetVerifiedPropertiesAsync()
    {
        var list = await _propertyRepository.GetVerifiedPropertiesAsync();
        var dtos = list.Select(MapToDto).ToList();
        await PopulateImagesAsync(dtos);
        return dtos;
    }

    public async Task<IEnumerable<PropertyResponseDto>> GetPropertiesBySellerAsync(int sellerId, bool? isActive = null)
    {
        var list = await _propertyRepository.GetBySellerIdAsync(sellerId, isActive);
        var dtos = list.Select(MapToDto).ToList();
        await PopulateImagesAsync(dtos);
        return dtos;
    }

    public async Task<IEnumerable<PropertyResponseDto>> SearchPropertiesAsync(int? cityId, string? propertyType, string? propertyOption, string? sortBy, int? stateId = null)
    {
        var list = await _propertyRepository.SearchPropertiesAsync(cityId, propertyType, propertyOption, sortBy, stateId);
        var dtos = list.Select(MapToDto).ToList();
        await PopulateImagesAsync(dtos);
        return dtos;
    }

    public async Task<PropertyResponseDto> VerifyPropertyAsync(int id)
    {
        var property = await _propertyRepository.GetByIdAsync(id);
        if (property == null)
            throw new KeyNotFoundException($"Property with ID {id} not found.");

        property.IsActive = true;
        property.DeactivationReason = null;

        await _propertyRepository.UpdateAsync(property);
        return MapToDto(property);
    }

    public async Task<PropertyResponseDto> DeactivatePropertyAsync(int id, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Proper reason must be provided for deactivating the listed property.");

        var property = await _propertyRepository.GetByIdAsync(id);
        if (property == null)
            throw new KeyNotFoundException($"Property with ID {id} not found.");

        property.IsActive = false;
        property.DeactivationReason = reason.Trim();

        await _propertyRepository.UpdateAsync(property);
        return MapToDto(property);
    }

    public async Task<PropertyResponseDto> BuyPropertyAsync(int id, int buyerId)
    {
        var property = await _propertyRepository.GetByIdAsync(id);
        if (property == null)
            throw new KeyNotFoundException($"Property with ID {id} not found.");

        if (property.SellerId == buyerId)
            throw new InvalidOperationException("Sellers cannot buy or rent their own properties.");

        if (!property.IsActive)
            throw new InvalidOperationException("This property is not available for purchase or rent, or has already been booked/sold.");

        property.IsActive = false;
        string actionVerb = property.PropertyOption?.Equals("Rent", StringComparison.OrdinalIgnoreCase) == true ? "Rented" : "Sold";
        property.DeactivationReason = $"{actionVerb} to Buyer #{buyerId}";

        await _propertyRepository.UpdateAsync(property);
        return MapToDto(property);
    }

    public async Task<IEnumerable<PropertyResponseDto>> GetPurchasedPropertiesByBuyerIdAsync(int buyerId)
    {
        var properties = await _propertyRepository.GetPurchasedPropertiesByBuyerIdAsync(buyerId);
        var dtos = properties.Select(MapToDto).ToList();
        await PopulateImagesAsync(dtos);
        return dtos;
    }

    public async Task<IEnumerable<PropertyResponseDto>> GetSoldPropertiesBySellerIdAsync(int sellerId)
    {
        var properties = await _propertyRepository.GetSoldPropertiesBySellerIdAsync(sellerId);
        var dtos = properties.Select(MapToDto).ToList();
        await PopulateImagesAsync(dtos);
        return dtos;
    }

    public async Task DeletePropertyAsync(int id)
    {
        await _propertyRepository.DeleteByIdAsync(id);
    }

    private async Task PopulateImagesAsync(List<PropertyResponseDto> dtoList)
    {
        if (_imageRepository == null || dtoList == null || dtoList.Count == 0) return;
        try
        {
            var allImages = await _imageRepository.GetAllAsync();
            var lookup = allImages.GroupBy(i => i.PropertyId).ToDictionary(g => g.Key, g => g.ToList());
            foreach (var dto in dtoList)
            {
                if (lookup.TryGetValue(dto.PropertyId, out var imgs) && imgs.Count > 0)
                {
                    dto.PrimaryImage = imgs.FirstOrDefault()?.ImageData;
                    dto.ImageCount = imgs.Count;
                    dto.Images = imgs.Select(i => i.ImageData).ToList();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to attach images to properties.");
        }
    }

    private async Task PopulateImagesAsync(PropertyResponseDto dto)
    {
        if (_imageRepository == null || dto == null) return;
        try
        {
            var imgs = (await _imageRepository.GetImagesByPropertyIdAsync(dto.PropertyId)).ToList();
            if (imgs.Count > 0)
            {
                dto.PrimaryImage = imgs.FirstOrDefault()?.ImageData;
                dto.ImageCount = imgs.Count;
                dto.Images = imgs.Select(i => i.ImageData).ToList();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to attach images to property {PropertyId}", dto.PropertyId);
        }
    }

    private static PropertyResponseDto MapToDto(Property p)
    {
        return new PropertyResponseDto
        {
            PropertyId = p.PropertyId,
            PropertyName = p.PropertyName,
            PropertyType = p.PropertyType,
            PropertyOption = p.PropertyOption,
            Description = p.Description,
            Address = p.Address,
            PriceRange = p.PriceRange,
            InitialDeposit = p.InitialDeposit,
            Landmark = p.Landmark,
            IsActive = p.IsActive,
            DeactivationReason = p.DeactivationReason,
            SellerId = p.SellerId,
            CityId = p.CityId
        };
    }
}

public class LocationAppService : ILocationAppService
{
    private readonly IStateRepository _stateRepository;
    private readonly ICityRepository _cityRepository;

    public LocationAppService(IStateRepository stateRepository, ICityRepository cityRepository)
    {
        _stateRepository = stateRepository;
        _cityRepository = cityRepository;
    }

    public async Task<IEnumerable<StateDto>> GetAllStatesAsync()
    {
        var list = await _stateRepository.GetAllAsync();
        return list.Select(s => new StateDto { StateId = s.StateId, StateName = s.StateName });
    }

    public async Task<IEnumerable<CityDto>> GetAllCitiesAsync()
    {
        var list = await _cityRepository.GetAllAsync();
        return list.Select(c => new CityDto { CityId = c.CityId, CityName = c.CityName, StateId = c.StateId });
    }
}

public class ImageAppService : IImageAppService
{
    private readonly IPropertyImageRepository _imageRepository;
    private const int MaxImagesPerProperty = 6;

    public ImageAppService(IPropertyImageRepository imageRepository)
    {
        _imageRepository = imageRepository;
    }

    public async Task<IEnumerable<PropertyImageDto>> GetImagesByPropertyIdAsync(int propertyId)
    {
        var images = await _imageRepository.GetImagesByPropertyIdAsync(propertyId);
        return images.Select(i => new PropertyImageDto
        {
            ImageId = i.ImageId,
            PropertyId = i.PropertyId,
            ImageData = i.ImageData
        });
    }

    public async Task<IEnumerable<PropertyImageDto>> UploadImagesAsync(int propertyId, List<string> images)
    {
        if (images == null || images.Count == 0)
            throw new ArgumentException("No images provided.");

        var currentCount = await _imageRepository.GetImageCountByPropertyIdAsync(propertyId);
        if (currentCount + images.Count > MaxImagesPerProperty)
        {
            throw new InvalidOperationException($"Cannot upload {images.Count} image(s). A property can have a maximum of {MaxImagesPerProperty} images. Currently has {currentCount}.");
        }

        var results = new List<PropertyImageDto>();
        foreach (var img in images)
        {
            var entity = new PropertyImage
            {
                PropertyId = propertyId,
                ImageData = img
            };
            var added = await _imageRepository.AddAsync(entity);
            results.Add(new PropertyImageDto
            {
                ImageId = added.ImageId,
                PropertyId = added.PropertyId,
                ImageData = added.ImageData
            });
        }

        return results;
    }

    public async Task<bool> DeleteImageAsync(int propertyId, int imageId)
    {
        var image = await _imageRepository.GetByIdAsync(imageId);
        if (image == null || image.PropertyId != propertyId)
        {
            return false;
        }

        await _imageRepository.DeleteAsync(image);
        return true;
    }
}
