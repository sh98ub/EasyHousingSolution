using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EasyHousingSolution.IdentityService.Application.DTOs;

public class RegisterBuyerDto
{
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(50)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email ID is required.")]
    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    [StringLength(50)]
    public string EmailId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(50, MinimumLength = 4)]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Date of birth (day-month-year, e.g. 15-05-1995) is required.")]
    public string Dob { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mobile number is required.")]
    [RegularExpression(@"^[6-9][0-9]{9}$", ErrorMessage = "Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.")]
    public string MobileNo { get; set; } = string.Empty;

    public DateTime GetParsedDateOfBirth()
    {
        if (string.IsNullOrWhiteSpace(Dob))
        {
            throw new ArgumentException("Date of birth is required.");
        }

        string rawDob = Dob.Trim();
        string[] formats = new[]
        {
            "dd-MM-yyyy", "d-M-yyyy",
            "dd/MM/yyyy", "d/M/yyyy",
            "dd.MM.yyyy", "d.M.yyyy",
            "yyyy-MM-dd", "yyyy/MM/dd",
            "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-ddTHH:mm:ss.fffZ", "yyyy-MM-ddTHH:mm:ssZ"
        };

        if (DateTime.TryParseExact(rawDob, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var exactDate))
        {
            return exactDate;
        }

        if (DateTime.TryParse(rawDob, CultureInfo.InvariantCulture, DateTimeStyles.None, out var fallbackDate))
        {
            return fallbackDate;
        }

        throw new ArgumentException($"Invalid date format for '{rawDob}'. Please enter Date of Birth as Day-Month-Year (e.g. 15-05-1995).");
    }
}

public class RegisterSellerDto
{
    [Required]
    [EmailAddress]
    [StringLength(50)]
    public string EmailId { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [StringLength(25)]
    public string FirstName { get; set; } = string.Empty;

    [StringLength(25)]
    public string? LastName { get; set; }

    [Required(ErrorMessage = "Date of birth (e.g. 15-05-1995) is required.")]
    public string Dob { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required.")]
    [RegularExpression(@"^[6-9][0-9]{9}$", ErrorMessage = "Phone number must be exactly 10 digits starting with 6, 7, 8, or 9.")]
    public string PhoneNo { get; set; } = string.Empty;

    [Required]
    [StringLength(250)]
    public string Address { get; set; } = string.Empty;

    [Required]
    public int StateId { get; set; }

    [Required]
    public int CityId { get; set; }

    public DateTime GetParsedDateOfBirth()
    {
        if (string.IsNullOrWhiteSpace(Dob))
        {
            throw new ArgumentException("Date of birth is required.");
        }

        string rawDob = Dob.Trim();
        string[] formats = new[]
        {
            "dd-MM-yyyy", "d-M-yyyy",
            "dd/MM/yyyy", "d/M/yyyy",
            "dd.MM.yyyy", "d.M.yyyy",
            "yyyy-MM-dd", "yyyy/MM/dd",
            "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-ddTHH:mm:ss.fffZ", "yyyy-MM-ddTHH:mm:ssZ"
        };

        if (DateTime.TryParseExact(rawDob, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var exactDate))
        {
            return exactDate;
        }

        if (DateTime.TryParse(rawDob, CultureInfo.InvariantCulture, DateTimeStyles.None, out var fallbackDate))
        {
            return fallbackDate;
        }

        throw new ArgumentException($"Invalid date format for '{rawDob}'. Please enter Date of Birth as Day-Month-Year (e.g. 15-05-1995).");
    }
}

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string EmailId { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string EmailId { get; set; } = string.Empty;
    public string UserType { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int? ProfileId { get; set; }
}

public class UserProfileResponseDto
{
    public int? BuyerId { get; set; }
    public int? SellerId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}
