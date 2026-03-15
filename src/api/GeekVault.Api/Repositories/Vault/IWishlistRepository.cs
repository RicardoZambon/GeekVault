using GeekVault.Api.Entities.Vault;

namespace GeekVault.Api.Repositories.Vault;

public interface IWishlistRepository
{
    Task<List<WishlistItem>> GetByCollectionIdAsync(int collectionId);
    Task<WishlistItem?> GetByIdAndCollectionIdAsync(int id, int collectionId);
    Task AddAsync(WishlistItem item);
    Task SaveChangesAsync();
    void Remove(WishlistItem item);
    Task<int> GetMaxSortOrderAsync(int collectionId);
    Task<List<WishlistItem>> GetByIdsAndCollectionIdAsync(IEnumerable<int> ids, int collectionId);
}
