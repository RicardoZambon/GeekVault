using GeekVault.Api.DTOs.Security;

namespace GeekVault.Api.Services.Security;

public interface IAuthService
{
    Task<(AuthResponse? Response, IEnumerable<string>? Errors)> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
}
