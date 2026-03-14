using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GeekVault.Api.DTOs.Security;
using GeekVault.Api.Entities.Security;
using GeekVault.Api.Repositories.Security;
using Microsoft.IdentityModel.Tokens;

namespace GeekVault.Api.Services.Security;

public class AuthService : IAuthService
{
    private readonly IUsersRepository _usersRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IUsersRepository usersRepository, IConfiguration configuration)
    {
        _usersRepository = usersRepository;
        _configuration = configuration;
    }

    public async Task<(AuthResponse? Response, IEnumerable<string>? Errors)> RegisterAsync(RegisterRequest request)
    {
        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        var result = await _usersRepository.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return (null, result.Errors.Select(e => e.Description));
        }

        var token = GenerateJwtToken(user);
        return (new AuthResponse(token, user.Id, user.Email!, user.DisplayName), null);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _usersRepository.FindByEmailAsync(request.Email);
        if (user == null || !await _usersRepository.CheckPasswordAsync(user, request.Password))
        {
            return null;
        }

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Id, user.Email!, user.DisplayName);
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpiresInMinutes"]!));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
