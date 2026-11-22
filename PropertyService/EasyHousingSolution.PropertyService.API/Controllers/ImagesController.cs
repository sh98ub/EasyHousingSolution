using EasyHousingSolution.PropertyService.Application.DTOs;
using EasyHousingSolution.PropertyService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyHousingSolution.PropertyService.API.Controllers;

[ApiController]
[Route("api/properties/{propertyId:int}/[controller]")]
public class ImagesController : ControllerBase
{
    private readonly IImageAppService _imageService;

    public ImagesController(IImageAppService imageService)
    {
        _imageService = imageService;
    }

    [HttpGet]
    [Tags("Buyer")]
    [AllowAnonymous]
    public async Task<IActionResult> GetImages(int propertyId)
    {
        var images = await _imageService.GetImagesByPropertyIdAsync(propertyId);
        return Ok(images);
    }

    [HttpPost]
    [Tags("Seller")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> UploadImages(int propertyId, UploadImagesDto dto)
    {
        var uploaded = await _imageService.UploadImagesAsync(propertyId, dto.Images);
        return Ok(uploaded);
    }

    [HttpDelete("{imageId:int}")]
    [Tags("Seller")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> DeleteImage(int propertyId, int imageId)
    {
        var deleted = await _imageService.DeleteImageAsync(propertyId, imageId);
        return deleted
            ? Ok(new { success = true, message = "Image deleted successfully." })
            : NotFound(new { success = false, message = $"Image #{imageId} not found for Property #{propertyId}." });
    }
}
