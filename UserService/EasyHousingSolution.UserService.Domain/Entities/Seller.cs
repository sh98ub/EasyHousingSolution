using System.ComponentModel.DataAnnotations;

namespace EasyHousingSolution.UserService.Domain.Entities;

public class Seller
{
    [Key]
    public int SellerId { get; set; }

    [Required]
    [MaxLength(25)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [MaxLength(25)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(25)]
    public string? LastName { get; set; }

    [Required]
    public DateTime DateofBirth { get; set; }

    [Required]
    [MaxLength(10)]
    public string PhoneNo { get; set; } = string.Empty;

    [Required]
    [MaxLength(250)]
    public string Address { get; set; } = string.Empty;

    [Required]
    public int StateId { get; set; }

    [Required]
    public int CityId { get; set; }

    [Required]
    [MaxLength(50)]
    public string EmailId { get; set; } = string.Empty;
}
