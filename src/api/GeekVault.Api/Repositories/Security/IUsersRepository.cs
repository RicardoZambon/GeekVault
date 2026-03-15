using Microsoft.AspNetCore.Identity;
using GeekVault.Api.Entities.Security;

namespace GeekVault.Api.Repositories.Security;

public interface IUsersRepository
{
    Task<User?> FindByIdAsync(string userId);
    Task<User?> FindByEmailAsync(string email);
    Task<IdentityResult> CreateAsync(User user, string password);
    Task<bool> CheckPasswordAsync(User user, string password);
    Task<IdentityResult> UpdateAsync(User user);
}
