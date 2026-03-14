using GeekVault.Api.Entities.Vault;

namespace GeekVault.Api.Repositories.Vault;

public interface ICatalogItemsRepository
{
    Task<CatalogItem?> GetByIdAndCollectionIdAsync(int id, int collectionId);
    IQueryable<CatalogItem> GetByCollectionId(int collectionId);
    Task<List<CatalogItem>> GetByCollectionIdWithFieldsAsync(int collectionId);
    Task AddAsync(CatalogItem item);
    Task AddRangeAsync(IEnumerable<CatalogItem> items);
    Task SaveChangesAsync();
    void Remove(CatalogItem item);
}
