namespace GeekVault.Api.DTOs.Security;

public record RegisterRequest(string Email, string Password, string? DisplayName);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, string UserId, string Email, string? DisplayName);
