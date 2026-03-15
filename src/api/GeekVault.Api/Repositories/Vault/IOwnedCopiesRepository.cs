using GeekVault.Api.Entities.Vault;

namespace GeekVault.Api.Repositories.Vault;

public interface IOwnedCopiesRepository
{
    IQueryable<OwnedCopy> Query();
    Task<List<OwnedCopy>> GetByCatalogItemIdAsync(int catalogItemId);
    Task<OwnedCopy?> GetByIdAndCatalogItemIdAsync(int id, int catalogItemId);
    Task<CatalogItem?> GetCatalogItemWithCollectionAsync(int catalogItemId, string userId);
    Task<List<OwnedCopy>> GetByCollectionItemIdsAsync(IEnumerable<int> catalogItemIds);
    Task<bool> AnyByCatalogItemIdAsync(int catalogItemId);
    Task<HashSet<int>> GetOwnedCatalogItemIdsAsync(IEnumerable<int> catalogItemIds);
    IQueryable<OwnedCopy> GetByUserCatalogItemIds(string userId);
    Task AddAsync(OwnedCopy copy);
    Task SaveChangesAsync();
    void Remove(OwnedCopy copy);
}
