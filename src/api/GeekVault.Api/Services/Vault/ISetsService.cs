using GeekVault.Api.DTOs.Vault;

namespace GeekVault.Api.Services.Vault;

public interface ISetsService
{
    Task<List<SetResponse>?> GetAllAsync(int collectionId, string userId);
    Task<SetResponse?> GetByIdAsync(int collectionId, int id, string userId);
    Task<SetResponse?> CreateAsync(int collectionId, string userId, CreateSetRequest request);
    Task<SetResponse?> UpdateAsync(int collectionId, int id, string userId, UpdateSetRequest request);
    Task<bool?> DeleteAsync(int collectionId, int id, string userId);
    Task<List<SetItemResponse>?> AddItemsAsync(int collectionId, int id, string userId, List<CreateSetItemRequest> request);
}
