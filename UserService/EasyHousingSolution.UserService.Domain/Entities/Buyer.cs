using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EasyHousingSolution.UserService.Domain.Entities;

public class Buyer
{
    [Key]
    public int BuyerId { get; set; } // int identity primary key

    [Required]
    [MaxLength(25)]
    public string FirstName { get; set; } = string.Empty; // varchar(25) not null

    [MaxLength(25)]
    public string? LastName { get; set; } // varchar(25)

    [Required]
    public DateTime DateOfBirth { get; set; } // date not null

    [Required]
    [MaxLength(10)]
    public string PhoneNo { get; set; } = string.Empty; // varchar(10) not null

    [Required]
    [MaxLength(50)]
    public string EmailId { get; set; } = string.Empty; // varchar(50) not null

    // Runtime alias for email (ignored in EF table schema)
    [NotMapped]
    public string UserName
    {
        get => EmailId;
        set { if (!string.IsNullOrWhiteSpace(value) && string.IsNullOrWhiteSpace(EmailId)) EmailId = value; }
    }
}
