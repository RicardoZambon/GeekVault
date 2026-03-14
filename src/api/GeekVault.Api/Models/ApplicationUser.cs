using Microsoft.AspNetCore.Identity;

namespace GeekVault.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }
    public string? Avatar { get; set; }
    public string? Bio { get; set; }
    public string? PreferredLanguage { get; set; }
    public string? PreferredCurrency { get; set; }
}
