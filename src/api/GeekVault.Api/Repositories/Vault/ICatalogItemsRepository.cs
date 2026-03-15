using GeekVault.Api.Entities.Vault;

namespace GeekVault.Api.Repositories.Vault;

public interface ICatalogItemsRepository
{
    IQueryable<CatalogItem> Query();
    Task<CatalogItem?> GetByIdAndCollectionIdAsync(int id, int collectionId);
    IQueryable<CatalogItem> GetByCollectionId(int collectionId);
    Task<List<CatalogItem>> GetByCollectionIdWithFieldsAsync(int collectionId);
    Task<List<CatalogItem>> GetByCollectionTypeIdAsync(int collectionTypeId);
    Task AddAsync(CatalogItem item);
    Task AddRangeAsync(IEnumerable<CatalogItem> items);
    Task<int> GetMaxSortOrderAsync(int collectionId);
    Task<List<CatalogItem>> GetByIdsAndCollectionIdAsync(IEnumerable<int> ids, int collectionId);
    Task SaveChangesAsync();
    void Remove(CatalogItem item);
}
