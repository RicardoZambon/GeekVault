using GeekVault.Api.DTOs.Vault;

namespace GeekVault.Api.Services.Vault;

public interface IOwnedCopiesService
{
    Task<List<OwnedCopyResponse>?> GetAllAsync(int catalogItemId, string userId);
    Task<(OwnedCopyResponse? Response, bool NotFound, string? Error)> CreateAsync(int catalogItemId, string userId, CreateOwnedCopyRequest request);
    Task<(OwnedCopyResponse? Response, bool NotFound, string? Error)> UpdateAsync(int catalogItemId, int id, string userId, UpdateOwnedCopyRequest request);
    Task<bool?> DeleteAsync(int catalogItemId, int id, string userId);
    Task<(OwnedCopyResponse? Response, bool NotFound, string? Error)> UploadImageAsync(int catalogItemId, int copyId, string userId, IFormFile file, string webRootPath);
}
