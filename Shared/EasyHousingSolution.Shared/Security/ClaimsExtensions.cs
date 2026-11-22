using System.Security.Claims;

namespace EasyHousingSolution.Shared.Security;

public static class ClaimsExtensions
{
    public static int GetProfileId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirst("profileId")?.Value
                 ?? user.FindFirst("sellerId")?.Value
                 ?? user.FindFirst("buyerId")?.Value
                 ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return int.TryParse(claim, out var id) ? id : 0;
    }

    public static string? GetRole(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Role)?.Value
            ?? user.FindFirst("role")?.Value;
    }

    public static bool IsAdmin(this ClaimsPrincipal user)
    {
        return user.IsInRole("Admin");
    }

    public static bool IsSeller(this ClaimsPrincipal user)
    {
        return user.IsInRole("Seller");
    }

    public static bool IsBuyer(this ClaimsPrincipal user)
    {
        return user.IsInRole("Buyer");
    }
}
