using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EasyHousingSolution.PropertyService.Domain.Entities;

public class State
{
    [Key]
    public int StateId { get; set; }

    [MaxLength(30)]
    public string StateName { get; set; } = string.Empty;
}

public class City
{
    [Key]
    public int CityId { get; set; }

    [Required]
    [MaxLength(50)]
    public string CityName { get; set; } = string.Empty;

    [Required]
    public int StateId { get; set; }
}

public class Property
{
    [Key]
    public int PropertyId { get; set; }

    [Required]
    [MaxLength(50)]
    public string PropertyName { get; set; } = string.Empty;

    [Required]
    [MaxLength(15)]
    public string PropertyType { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public string PropertyOption { get; set; } = string.Empty; // Sell or Rent

    [MaxLength(250)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(250)]
    public string Address { get; set; } = string.Empty;

    public decimal PriceRange { get; set; }

    
    public decimal InitialDeposit { get; set; }

    [Required]
    [MaxLength(25)]
    public string Landmark { get; set; } = string.Empty;

    public bool IsActive { get; set; } = false; // Verified by Admin

    [MaxLength(250)]
    public string? DeactivationReason { get; set; }

   
    public int SellerId { get; set; }

    public int CityId { get; set; }
}

public class PropertyImage
{
    [Key]
    public int ImageId { get; set; }

    [Required]
    public int PropertyId { get; set; }

    [Required]
    public string ImageData { get; set; } = string.Empty; // Maps to [Image] column in Images table

    [NotMapped]
    public string Image { get => ImageData; set => ImageData = value; }
}
