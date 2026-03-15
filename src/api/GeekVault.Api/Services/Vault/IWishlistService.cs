using GeekVault.Api.DTOs.Vault;

namespace GeekVault.Api.Services.Vault;

public interface IWishlistService
{
    Task<List<WishlistItemResponse>?> GetAllAsync(int collectionId, string userId);
    Task<WishlistItemResponse?> CreateAsync(int collectionId, string userId, CreateWishlistItemRequest request);
    Task<(WishlistItemResponse? Response, bool CollectionNotFound, bool ItemNotFound)> UpdateAsync(int collectionId, int id, string userId, UpdateWishlistItemRequest request);
    Task<bool?> DeleteAsync(int collectionId, int id, string userId);
}
