using GeekVault.Api.DTOs.Vault;

namespace GeekVault.Api.Services.Vault;

public interface ICollectionTypesService
{
    Task<List<CollectionTypeResponse>> GetAllAsync(string userId);
    Task<CollectionTypeResponse?> GetByIdAsync(int id, string userId);
    Task<(CollectionTypeResponse? Response, string? Error)> CreateAsync(string userId, CreateCollectionTypeRequest request);
    Task<(CollectionTypeResponse? Response, string? Error)> UpdateAsync(int id, string userId, UpdateCollectionTypeRequest request);
    Task<bool> DeleteAsync(int id, string userId);
}
