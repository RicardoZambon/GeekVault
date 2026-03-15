using GeekVault.Api.DTOs.Security;
using GeekVault.Api.Extensions;
using GeekVault.Api.Repositories.Security;

namespace GeekVault.Api.Services.Security;

public class ProfileService : IProfileService
{
    private readonly IUsersRepository _usersRepository;

    public ProfileService(IUsersRepository usersRepository)
    {
        _usersRepository = usersRepository;
    }

    public async Task<ProfileResponse?> GetProfileAsync(string userId)
    {
        var user = await _usersRepository.FindByIdAsync(userId);
        if (user == null) return null;

        return new ProfileResponse(
            user.Id, user.Email!, user.DisplayName, user.Avatar, user.Bio,
            user.PreferredLanguage, user.PreferredCurrency);
    }

    public async Task<(ProfileResponse? Response, IEnumerable<string>? Errors)> UpdateProfileAsync(string userId, UpdateProfileRequest request)
    {
        var user = await _usersRepository.FindByIdAsync(userId);
        if (user == null) return (null, null);

        user.DisplayName = request.DisplayName;
        user.Bio = request.Bio;
        user.PreferredLanguage = request.PreferredLanguage;
        user.PreferredCurrency = request.PreferredCurrency;

        var result = await _usersRepository.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return (null, result.Errors.Select(e => e.Description));
        }

        return (new ProfileResponse(
            user.Id, user.Email!, user.DisplayName, user.Avatar, user.Bio,
            user.PreferredLanguage, user.PreferredCurrency), null);
    }

    public async Task<(string? AvatarUrl, string? Error)> UploadAvatarAsync(string userId, IFormFile file, string webRootPath)
    {
        var user = await _usersRepository.FindByIdAsync(userId);
        if (user == null) return (null, "User not found");

        if (!file.IsValidImageFile())
            return (null, "Invalid image file. Allowed types: jpg, jpeg, png, gif, webp");

        var uploadsDir = Path.Combine(webRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var extension = Path.GetExtension(file.FileName);
        var fileName = $"{userId}{extension}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.Avatar = $"/uploads/{fileName}";
        await _usersRepository.UpdateAsync(user);

        return (user.Avatar, null);
    }
}
