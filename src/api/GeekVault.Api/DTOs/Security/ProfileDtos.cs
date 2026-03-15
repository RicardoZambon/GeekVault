namespace GeekVault.Api.DTOs.Security;

public record UpdateProfileRequest(string? DisplayName, string? Bio, string? PreferredLanguage, string? PreferredCurrency);
public record ProfileResponse(string Id, string Email, string? DisplayName, string? Avatar, string? Bio, string? PreferredLanguage, string? PreferredCurrency);
