using System.ComponentModel.DataAnnotations;

namespace EasyHousingSolution.CartService.Domain.Entities;

public class CartItem
{
    [Key]
    public int CartId { get; set; }

    [Required]
    public int BuyerId { get; set; }

    [Required]
    public int PropertyId { get; set; }
}
