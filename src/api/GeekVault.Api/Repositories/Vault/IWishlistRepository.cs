using GeekVault.Api.Entities.Vault;

namespace GeekVault.Api.Repositories.Vault;

public interface IWishlistRepository
{
    Task<List<WishlistItem>> GetByCollectionIdAsync(int collectionId);
    Task<WishlistItem?> GetByIdAndCollectionIdAsync(int id, int collectionId);
    Task AddAsync(WishlistItem item);
    Task SaveChangesAsync();
    void Remove(WishlistItem item);
}
