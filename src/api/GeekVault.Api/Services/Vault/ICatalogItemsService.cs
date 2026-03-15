using GeekVault.Api.DTOs.Common;
using GeekVault.Api.DTOs.Vault;

namespace GeekVault.Api.Services.Vault;

public interface ICatalogItemsService
{
    Task<PaginatedResponse<CatalogItemResponse>?> GetAllAsync(int collectionId, string userId, string? search, string? condition, string? ownedStatus, string? sortBy, string? sortDir, int? page, int? pageSize);
    Task<CatalogItemResponse?> GetByIdAsync(int collectionId, int id, string userId);
    Task<(CatalogItemResponse? Response, bool NotFound, string? Error)> CreateAsync(int collectionId, string userId, CreateCatalogItemRequest request);
    Task<(CatalogItemResponse? Response, bool NotFound, string? Error)> UpdateAsync(int collectionId, int id, string userId, UpdateCatalogItemRequest request);
    Task<bool?> DeleteAsync(int collectionId, int id, string userId);
    Task<(string? ImageUrl, bool NotFound, string? Error)> UploadImageAsync(int collectionId, int id, string userId, IFormFile file, string webRootPath);
}
