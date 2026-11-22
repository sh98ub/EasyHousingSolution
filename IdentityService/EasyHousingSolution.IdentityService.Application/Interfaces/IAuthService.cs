using EasyHousingSolution.IdentityService.Application.DTOs;

namespace EasyHousingSolution.IdentityService.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterBuyerAsync(RegisterBuyerDto dto);
    Task<AuthResponseDto> RegisterSellerAsync(RegisterSellerDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
}
