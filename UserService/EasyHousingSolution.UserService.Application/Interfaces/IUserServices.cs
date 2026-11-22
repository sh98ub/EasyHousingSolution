using EasyHousingSolution.UserService.Application.DTOs;

namespace EasyHousingSolution.UserService.Application.Interfaces;

public interface IBuyerAppService
{
    Task<BuyerResponseDto> CreateBuyerAsync(CreateBuyerDto dto);
    Task<BuyerResponseDto?> GetBuyerByIdAsync(int buyerId);
    Task<BuyerResponseDto?> GetBuyerByEmailAsync(string emailId);
    Task<BuyerResponseDto?> UpdateBuyerProfileAsync(int buyerId, UpdateBuyerProfileDto dto);
}

public interface ISellerAppService
{
    Task<SellerResponseDto> CreateSellerAsync(CreateSellerDto dto);
    Task<SellerResponseDto?> GetSellerByIdAsync(int sellerId);
    Task<SellerResponseDto?> GetSellerByEmailAsync(string emailId);
    Task<SellerResponseDto?> UpdateSellerProfileAsync(int sellerId, UpdateSellerProfileDto dto);
}

public interface IUserAppService
{
    Task<IEnumerable<UserSummaryDto>> GetAllUsersAsync(string? role = null, bool? isActive = null);
    Task<UserSummaryDto?> GetUserByIdAsync(int userId);
    Task<bool> UpdateUserStatusAsync(int userId, bool isActive, string? reason = null);
    Task<bool> ChangeUserRoleAsync(int userId, string newRole, string? reason = null);
    Task<bool> DeleteUserAsync(int userId);
}
