using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EasyHousingSolution.IdentityService.Domain.Entities;

public class User
{
    [Key]
    [Required]
    [MaxLength(25)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [MaxLength(25)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MaxLength(15)]
    public string UserType { get; set; } = string.Empty;

    // Runtime helper properties (ignored in EF table schema)
    
    public string? FullName { get; set; }

   
    public string? PhoneNo { get; set; }

   
    public int? ProfileId { get; set; }
}
