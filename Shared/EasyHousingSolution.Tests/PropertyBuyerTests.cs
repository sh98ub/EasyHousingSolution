// ============================================================================
// Document: PropertyBuyerTests.cs
// Project:  Easy Housing Solutions (EHS)
// Module:   EasyHousingSolution.Tests
// Purpose:  Unit tests for property operations performed by or for buyers.
// Language: C# (.NET 8 with NUnit and Moq)
// Description:
//   This test document checks the business logic in PropertyAppService.
//   It ensures buyers can view verified properties, view property details,
//   purchase/rent properties, and view their purchase history.
//   All tests use mocked repositories so no real database is needed.
// ============================================================================

using EasyHousingSolution.PropertyService.Application.DTOs;
using EasyHousingSolution.PropertyService.Application.Interfaces;
using EasyHousingSolution.PropertyService.Application.Services;
using EasyHousingSolution.PropertyService.Domain.Entities;
using EasyHousingSolution.PropertyService.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;

namespace EasyHousingSolution.Tests.Services;

/// <summary>
/// Unit test suite testing property management and purchase flows for buyers.
/// </summary>
[TestFixture]
public class PropertyBuyerTests
{
    private Mock<IPropertyRepository> _mockPropertyRepo = null!;
    private PropertyAppService _propertyAppService = null!;

    /// <summary>
    /// Runs before each test to create fresh mocks and a clean service instance.
    /// </summary>
    [SetUp]
    public void Setup()
    {
        _mockPropertyRepo = new Mock<IPropertyRepository>();
        var mockLogger = new Mock<ILogger<PropertyAppService>>();
        _propertyAppService = new PropertyAppService(_mockPropertyRepo.Object, mockLogger.Object);
    }

    /// <summary>
    /// Test 1: Verifies that buyers only get verified and active properties when browsing listings.
    /// </summary>
    [Test]
    public async Task GetAllPropertiesForBuyer_ReturnsVerifiedListings()
    {
        // 1. Arrange: Create mock verified property listings
        var fakeProperties = new List<Property>
        {
            new Property
            {
                PropertyId = 1,
                PropertyName = "Green Meadows Luxury Villa",
                PropertyType = "Villa",
                PropertyOption = "Sell",
                PriceRange = 12000000m,
                InitialDeposit = 500000m,
                Landmark = "Near Central Mall",
                Address = "Plot 42, Hitech City",
                IsActive = true,
                SellerId = 1,
                CityId = 3
            },
            new Property
            {
                PropertyId = 2,
                PropertyName = "Sunrise Bay 2BHK Apartment",
                PropertyType = "Apartment",
                PropertyOption = "Rent",
                PriceRange = 25000m,
                InitialDeposit = 50000m,
                Landmark = "Sea Link",
                Address = "Bandra West",
                IsActive = true,
                SellerId = 2,
                CityId = 1
            }
        };

        _mockPropertyRepo.Setup(r => r.GetVerifiedPropertiesAsync())
            .ReturnsAsync(fakeProperties);

        // 2. Act: Call the service method
        var result = (await _propertyAppService.GetVerifiedPropertiesAsync()).ToList();

        // 3. Assert: Check that all returned properties are active and correctly mapped
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result[0].PropertyName, Is.EqualTo("Green Meadows Luxury Villa"));
        Assert.That(result[0].IsActive, Is.True);
        Assert.That(result[1].PropertyName, Is.EqualTo("Sunrise Bay 2BHK Apartment"));
        Assert.That(result[1].IsActive, Is.True);
    }

    /// <summary>
    /// Test 2: Verifies that looking up a property by its ID returns the expected property details.
    /// </summary>
    [Test]
    public async Task GetPropertyById_WhenActivePropertyExists_ReturnsPropertyDto()
    {
        // 1. Arrange: Create a property in database mock
        var prop = new Property
        {
            PropertyId = 5,
            PropertyName = "Lakeview Penthouse",
            PropertyType = "Penthouse",
            PropertyOption = "Sell",
            PriceRange = 25000000m,
            InitialDeposit = 1000000m,
            Landmark = "Lake Road",
            Address = "Tower 1, Top Floor",
            IsActive = true,
            SellerId = 3,
            CityId = 2
        };

        _mockPropertyRepo.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(prop);

        // 2. Act: Retrieve property #5
        var result = await _propertyAppService.GetPropertyByIdAsync(5);

        // 3. Assert: Confirm details match
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.PropertyId, Is.EqualTo(5));
        Assert.That(result.PropertyName, Is.EqualTo("Lakeview Penthouse"));
        Assert.That(result.PriceRange, Is.EqualTo(25000000m));
    }

    /// <summary>
    /// Test 3: Verifies that when a buyer buys a property, it is marked inactive and the reason is recorded.
    /// </summary>
    [Test]
    public async Task BuyPropertyAsync_WhenActive_MarksInactiveAndSetsReason()
    {
        // 1. Arrange: Active property for sale
        var prop = new Property
        {
            PropertyId = 10,
            PropertyName = "Orchid Greens Flat",
            PriceRange = 5000000m,
            IsActive = true,
            SellerId = 2
        };

        _mockPropertyRepo.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(prop);
        _mockPropertyRepo.Setup(r => r.UpdateAsync(It.IsAny<Property>())).Returns(Task.CompletedTask);

        // 2. Act: Buyer #5 buys property #10
        var result = await _propertyAppService.BuyPropertyAsync(10, 5);

        // 3. Assert: Property is now inactive and has deactivation reason
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsActive, Is.False);
        Assert.That(result.DeactivationReason, Is.EqualTo("Sold to Buyer #5"));
    }

    /// <summary>
    /// Test 4: Verifies the business rule that a seller cannot purchase or rent their own property listing.
    /// </summary>
    [Test]
    public void BuyPropertyAsync_WhenBuyerIsSellerOfProperty_ThrowsInvalidOperationException()
    {
        // 1. Arrange: Property owned by Seller #4
        var prop = new Property
        {
            PropertyId = 15,
            PropertyName = "Seller Own Villa",
            PriceRange = 8500000m,
            IsActive = true,
            SellerId = 4
        };

        _mockPropertyRepo.Setup(r => r.GetByIdAsync(15)).ReturnsAsync(prop);

        // 2. Act & Assert: Seller #4 tries to buy property #15 -> should throw error
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await _propertyAppService.BuyPropertyAsync(15, 4);
        });

        Assert.That(ex!.Message, Does.Contain("Sellers cannot buy or rent their own properties"));
    }

    /// <summary>
    /// Test 5: Verifies that renting a rental property marks it inactive with 'Rented to Buyer' reason.
    /// </summary>
    [Test]
    public async Task BuyPropertyAsync_WhenPropertyOptionIsRent_SetsRentedReason()
    {
        // 1. Arrange: Property listed for Rent
        var prop = new Property
        {
            PropertyId = 16,
            PropertyName = "Coastal Studio for Rent",
            PropertyOption = "Rent",
            PriceRange = 35000m,
            IsActive = true,
            SellerId = 2
        };

        _mockPropertyRepo.Setup(r => r.GetByIdAsync(16)).ReturnsAsync(prop);
        _mockPropertyRepo.Setup(r => r.UpdateAsync(It.IsAny<Property>())).Returns(Task.CompletedTask);

        // 2. Act: Buyer #9 rents property #16
        var result = await _propertyAppService.BuyPropertyAsync(16, 9);

        // 3. Assert: Deactivation reason reflects 'Rented'
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsActive, Is.False);
        Assert.That(result.DeactivationReason, Is.EqualTo("Rented to Buyer #9"));
    }

    /// <summary>
    /// Test 6: Verifies that a buyer can view the history of properties they have bought or rented.
    /// </summary>
    [Test]
    public async Task GetPurchasedPropertiesByBuyerId_ReturnsBuyersProperties()
    {
        // 1. Arrange: Buyer #7 previously bought a property
        var boughtProps = new List<Property>
        {
            new Property
            {
                PropertyId = 20,
                PropertyName = "Boutique Apartment",
                IsActive = false,
                DeactivationReason = "Sold to Buyer #7"
            }
        };

        _mockPropertyRepo.Setup(r => r.GetPurchasedPropertiesByBuyerIdAsync(7)).ReturnsAsync(boughtProps);

        // 2. Act: Get purchase history for Buyer #7
        var result = (await _propertyAppService.GetPurchasedPropertiesByBuyerIdAsync(7)).ToList();

        // 3. Assert: History contains the property
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].PropertyId, Is.EqualTo(20));
        Assert.That(result[0].DeactivationReason, Is.EqualTo("Sold to Buyer #7"));
    }

    /// <summary>
    /// Test 7: Verifies that a seller can view the list of properties they have successfully sold.
    /// </summary>
    [Test]
    public async Task GetSoldPropertiesBySellerId_ReturnsSellersSoldProperties()
    {
        // 1. Arrange: Seller #4 has a sold property
        var soldProps = new List<Property>
        {
            new Property
            {
                PropertyId = 30,
                PropertyName = "Luxury Penthouse",
                SellerId = 4,
                IsActive = false,
                DeactivationReason = "Sold to Buyer #1"
            }
        };

        _mockPropertyRepo.Setup(r => r.GetSoldPropertiesBySellerIdAsync(4)).ReturnsAsync(soldProps);

        // 2. Act: Get sold list for Seller #4
        var result = (await _propertyAppService.GetSoldPropertiesBySellerIdAsync(4)).ToList();

        // 3. Assert: Sold property is returned
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].PropertyId, Is.EqualTo(30));
    }
}
