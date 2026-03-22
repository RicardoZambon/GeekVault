using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GeekVault.Api.DTOs.Security;
using GeekVault.Api.Entities.Security;
using GeekVault.Api.Repositories.Security;
using GeekVault.Api.Services.Admin;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace GeekVault.Api.Services.Security;

public class AuthService : IAuthService
{
    private readonly IUsersRepository _usersRepository;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly IAuditLogService _auditLogService;

    public AuthService(IUsersRepository usersRepository, UserManager<User> userManager, IConfiguration configuration, IAuditLogService auditLogService)
    {
        _usersRepository = usersRepository;
        _userManager = userManager;
        _configuration = configuration;
        _auditLogService = auditLogService;
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

        await _userManager.AddToRoleAsync(user, "User");

        var token = await GenerateJwtTokenAsync(user);

        await _auditLogService.LogActionAsync(user.Id, "Register", "User", user.Id, $"New user registered: {user.Email}");

        return (new AuthResponse(token, user.Id, user.Email!, user.DisplayName), null);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _usersRepository.FindByEmailAsync(request.Email);
        if (user == null || !await _usersRepository.CheckPasswordAsync(user, request.Password))
        {
            await _auditLogService.LogActionAsync("anonymous", "LoginFailed", "User", details: $"Failed login attempt for email: {request.Email}");
            return null;
        }

        var token = await GenerateJwtTokenAsync(user);

        await _auditLogService.LogActionAsync(user.Id, "Login", "User", user.Id, $"User logged in: {user.Email}");

        return new AuthResponse(token, user.Id, user.Email!, user.DisplayName);
    }

    private async Task<string> GenerateJwtTokenAsync(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpiresInMinutes"]!));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email!),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var roles = await _userManager.GetRolesAsync(user);
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

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
