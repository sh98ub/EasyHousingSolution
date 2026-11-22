using EasyHousingSolution.UserService.Application.DTOs;
using EasyHousingSolution.UserService.Application.Interfaces;
using EasyHousingSolution.UserService.Domain.Entities;
using EasyHousingSolution.UserService.Domain.Interfaces;
using System.Collections.Concurrent;

namespace EasyHousingSolution.UserService.Application.Services;

public class BuyerAppService : IBuyerAppService
{
    private readonly IBuyerRepository _buyerRepository;

    public BuyerAppService(IBuyerRepository buyerRepository)
    {
        _buyerRepository = buyerRepository;
    }

    public async Task<BuyerResponseDto> CreateBuyerAsync(CreateBuyerDto dto)
    {
        if (dto.DateOfBirth > DateTime.UtcNow)
        {
            throw new ArgumentException("Date of birth cannot be in the future.");
        }
        if (dto.DateOfBirth > DateTime.UtcNow.AddYears(-18))
        {
            throw new InvalidOperationException("Buyer must be at least 18 years old to register.");
        }

        var normalizedEmail = dto.EmailId.Trim().ToLowerInvariant();
        if (await _buyerRepository.ExistsAsync(normalizedEmail))
        {
            throw new InvalidOperationException($"Buyer with email '{dto.EmailId}' already exists.");
        }

        var buyer = new Buyer
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName?.Trim(),
            DateOfBirth = dto.DateOfBirth,
            PhoneNo = dto.PhoneNo?.Trim() ?? string.Empty,
            EmailId = normalizedEmail,
            UserName = string.IsNullOrWhiteSpace(dto.UserName) ? normalizedEmail : dto.UserName.Trim()
        };

        var created = await _buyerRepository.AddAsync(buyer);
        return MapToDto(created);
    }

    public async Task<BuyerResponseDto?> GetBuyerByIdAsync(int buyerId)
    {
        var buyer = await _buyerRepository.GetByIdAsync(buyerId);
        return buyer == null ? null : MapToDto(buyer);
    }

    public async Task<BuyerResponseDto?> GetBuyerByEmailAsync(string emailId)
    {
        var buyer = await _buyerRepository.GetByEmailAsync(emailId);
        return buyer == null ? null : MapToDto(buyer);
    }

    public async Task<BuyerResponseDto?> UpdateBuyerProfileAsync(int buyerId, UpdateBuyerProfileDto dto)
    {
        var buyer = await _buyerRepository.GetByIdAsync(buyerId);
        if (buyer == null) return null;

        buyer.FirstName = dto.FirstName.Trim();
        buyer.LastName = dto.LastName?.Trim();
        buyer.PhoneNo = dto.PhoneNo.Trim();
        if (dto.DateOfBirth.HasValue)
        {
            buyer.DateOfBirth = dto.DateOfBirth.Value;
        }

        await _buyerRepository.UpdateAsync(buyer);
        return MapToDto(buyer);
    }

    private static BuyerResponseDto MapToDto(Buyer b) => new()
    {
        BuyerId = b.BuyerId,
        FirstName = b.FirstName,
        LastName = b.LastName,
        DateOfBirth = b.DateOfBirth,
        PhoneNo = b.PhoneNo,
        EmailId = b.EmailId,
        UserName = b.UserName
    };
}

public class SellerAppService : ISellerAppService
{
    private readonly ISellerRepository _sellerRepository;

    public SellerAppService(ISellerRepository sellerRepository)
    {
        _sellerRepository = sellerRepository;
    }

    public async Task<SellerResponseDto> CreateSellerAsync(CreateSellerDto dto)
    {
        if (dto.DateofBirth > DateTime.UtcNow)
        {
            throw new ArgumentException("Date of birth cannot be in the future.");
        }
        if (dto.DateofBirth > DateTime.UtcNow.AddYears(-18))
        {
            throw new InvalidOperationException("Seller must be at least 18 years old to register.");
        }

        var normalizedEmail = dto.EmailId.Trim().ToLowerInvariant();
        if (await _sellerRepository.ExistsAsync(normalizedEmail))
        {
            throw new InvalidOperationException($"Seller with email '{dto.EmailId}' already exists.");
        }

        var seller = new Seller
        {
            UserName = string.IsNullOrWhiteSpace(dto.UserName) ? normalizedEmail : dto.UserName.Trim(),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName?.Trim(),
            DateofBirth = dto.DateofBirth,
            PhoneNo = dto.PhoneNo?.Trim() ?? string.Empty,
            Address = dto.Address?.Trim() ?? string.Empty,
            StateId = dto.StateId,
            CityId = dto.CityId,
            EmailId = normalizedEmail
        };

        var created = await _sellerRepository.AddAsync(seller);
        return MapToDto(created);
    }

    public async Task<SellerResponseDto?> GetSellerByIdAsync(int sellerId)
    {
        var seller = await _sellerRepository.GetByIdAsync(sellerId);
        return seller == null ? null : MapToDto(seller);
    }

    public async Task<SellerResponseDto?> GetSellerByEmailAsync(string emailId)
    {
        var seller = await _sellerRepository.GetByEmailAsync(emailId);
        return seller == null ? null : MapToDto(seller);
    }

    public async Task<SellerResponseDto?> UpdateSellerProfileAsync(int sellerId, UpdateSellerProfileDto dto)
    {
        var seller = await _sellerRepository.GetByIdAsync(sellerId);
        if (seller == null) return null;

        seller.FirstName = dto.FirstName.Trim();
        seller.LastName = dto.LastName?.Trim();
        seller.PhoneNo = dto.PhoneNo.Trim();
        seller.Address = dto.Address.Trim();
        seller.StateId = dto.StateId;
        seller.CityId = dto.CityId;

        await _sellerRepository.UpdateAsync(seller);
        return MapToDto(seller);
    }

    private static SellerResponseDto MapToDto(Seller s) => new()
    {
        SellerId = s.SellerId,
        UserName = s.UserName,
        FirstName = s.FirstName,
        LastName = s.LastName,
        DateofBirth = s.DateofBirth,
        PhoneNo = s.PhoneNo,
        Address = s.Address,
        StateId = s.StateId,
        CityId = s.CityId,
        EmailId = s.EmailId
    };
}

public class UserAppService : IUserAppService
{
    private readonly IBuyerRepository _buyerRepository;
    private readonly ISellerRepository _sellerRepository;

    private static readonly ConcurrentDictionary<string, bool> _userStatus = new();
    private static readonly ConcurrentDictionary<string, string> _userRoles = new();

    public UserAppService(IBuyerRepository buyerRepository, ISellerRepository sellerRepository)
    {
        _buyerRepository = buyerRepository;
        _sellerRepository = sellerRepository;
    }

    public async Task<IEnumerable<UserSummaryDto>> GetAllUsersAsync(string? role = null, bool? isActive = null)
    {
        var list = new List<UserSummaryDto>();

        var adminKey = "user_1_admin";
        var adminActive = _userStatus.GetOrAdd(adminKey, true);
        var adminRole = _userRoles.TryGetValue("user_1", out var ar) ? ar : "Admin";

        list.Add(new UserSummaryDto
        {
            ProfileId = 1,
            UserName = "admin@easysolution.com",
            FullName = "System Administrator",
            EmailId = "admin@easysolution.com",
            PhoneNo = "9999999999",
            UserType = adminRole,
            Address = "Headquarters, Mumbai",
            IsActive = adminActive
        });

        var buyers = await _buyerRepository.GetAllAsync();
        foreach (var b in buyers)
        {
            var key = $"buyer_{b.BuyerId}";
            var active = _userStatus.GetOrAdd(key, true);
            var fullName = string.IsNullOrWhiteSpace(b.LastName) ? b.FirstName : $"{b.FirstName} {b.LastName}".Trim();
            var userRole = _userRoles.TryGetValue($"user_{b.BuyerId}", out var r) ? r : (_userRoles.TryGetValue(key, out var br) ? br : "Buyer");

            list.Add(new UserSummaryDto
            {
                ProfileId = b.BuyerId,
                UserName = b.UserName,
                FullName = fullName,
                EmailId = b.EmailId,
                PhoneNo = b.PhoneNo,
                UserType = userRole,
                Address = "India",
                IsActive = active
            });
        }

        var sellers = await _sellerRepository.GetAllAsync();
        foreach (var s in sellers)
        {
            var key = $"seller_{s.SellerId}";
            var active = _userStatus.GetOrAdd(key, true);
            var fullName = string.IsNullOrWhiteSpace(s.LastName) ? s.FirstName : $"{s.FirstName} {s.LastName}".Trim();
            var userRole = _userRoles.TryGetValue($"user_{s.SellerId}", out var r) ? r : (_userRoles.TryGetValue(key, out var sr) ? sr : "Seller");

            list.Add(new UserSummaryDto
            {
                ProfileId = s.SellerId,
                UserName = s.UserName,
                FullName = fullName,
                EmailId = s.EmailId,
                PhoneNo = s.PhoneNo,
                UserType = userRole,
                Address = s.Address,
                IsActive = active
            });
        }

        IEnumerable<UserSummaryDto> query = list;
        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => string.Equals(u.UserType, role, StringComparison.OrdinalIgnoreCase));
        }
        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        return query.ToList();
    }

    public async Task<UserSummaryDto?> GetUserByIdAsync(int userId)
    {
        var users = await GetAllUsersAsync();
        return users.FirstOrDefault(u => u.ProfileId == userId);
    }

    public async Task<bool> UpdateUserStatusAsync(int userId, bool isActive, string? reason = null)
    {
        var user = await GetUserByIdAsync(userId);
        if (user == null) return false;

        var key = user.UserType.ToLower() switch
        {
            "admin" => "user_1_admin",
            "seller" => $"seller_{userId}",
            _ => $"buyer_{userId}"
        };

        _userStatus[key] = isActive;
        _userStatus[$"user_{userId}"] = isActive;
        return true;
    }

    public async Task<bool> ChangeUserRoleAsync(int userId, string newRole, string? reason = null)
    {
        var user = await GetUserByIdAsync(userId);
        if (user == null) return false;

        if (!new[] { "Admin", "Buyer", "Seller" }.Any(r => string.Equals(r, newRole, StringComparison.OrdinalIgnoreCase)))
        {
            throw new ArgumentException("Role must be 'Admin', 'Buyer', or 'Seller'.");
        }

        var formattedRole = char.ToUpperInvariant(newRole[0]) + newRole.Substring(1).ToLowerInvariant();
        _userRoles[$"user_{userId}"] = formattedRole;

        var key = user.UserType.ToLower() switch
        {
            "admin" => "user_1_admin",
            "seller" => $"seller_{userId}",
            _ => $"buyer_{userId}"
        };
        _userRoles[key] = formattedRole;

        return true;
    }

    public async Task<bool> DeleteUserAsync(int userId)
    {
        var buyer = await _buyerRepository.GetByIdAsync(userId);
        if (buyer != null)
        {
            await _buyerRepository.DeleteAsync(buyer);
            _userStatus.TryRemove($"buyer_{userId}", out _);
            _userRoles.TryRemove($"buyer_{userId}", out _);
            _userRoles.TryRemove($"user_{userId}", out _);
            return true;
        }

        var seller = await _sellerRepository.GetByIdAsync(userId);
        if (seller != null)
        {
            await _sellerRepository.DeleteAsync(seller);
            _userStatus.TryRemove($"seller_{userId}", out _);
            _userRoles.TryRemove($"seller_{userId}", out _);
            _userRoles.TryRemove($"user_{userId}", out _);
            return true;
        }

        return false;
    }
}
