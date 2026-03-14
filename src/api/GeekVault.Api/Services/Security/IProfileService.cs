using GeekVault.Api.DTOs.Security;

namespace GeekVault.Api.Services.Security;

public interface IProfileService
{
    Task<ProfileResponse?> GetProfileAsync(string userId);
    Task<(ProfileResponse? Response, IEnumerable<string>? Errors)> UpdateProfileAsync(string userId, UpdateProfileRequest request);
    Task<(string? AvatarUrl, string? Error)> UploadAvatarAsync(string userId, IFormFile file, string webRootPath);
}
