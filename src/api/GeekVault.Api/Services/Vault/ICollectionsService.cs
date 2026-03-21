using GeekVault.Api.DTOs.Vault;

namespace GeekVault.Api.Services.Vault;

public interface ICollectionsService
{
    Task<List<CollectionResponse>> GetAllAsync(string userId, string? sortBy = null, string? sortDir = null);
    Task<CollectionResponse?> GetByIdAsync(int id, string userId);
    Task<CollectionResponse> CreateAsync(string userId, CreateCollectionRequest request);
    Task<CollectionResponse?> UpdateAsync(int id, string userId, UpdateCollectionRequest request);
    Task<bool> DeleteAsync(int id, string userId);
    Task<(string? CoverUrl, bool NotFound, string? Error)> UploadCoverAsync(int id, string userId, IFormFile file, string webRootPath);
    Task<(string? CoverUrl, bool NotFound, string? Error)> CoverFromItemAsync(int collectionId, int itemId, string userId, string webRootPath);
    Task<(bool Success, bool NotFound, string? Error)> ReorderAsync(string userId, List<int> collectionIds);
}
