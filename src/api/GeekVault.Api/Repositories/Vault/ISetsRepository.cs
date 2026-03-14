using GeekVault.Api.Entities.Vault;

namespace GeekVault.Api.Repositories.Vault;

public interface ISetsRepository
{
    Task<List<Set>> GetByCollectionIdAsync(int collectionId);
    Task<Set?> GetByIdAndCollectionIdAsync(int id, int collectionId);
    Task<List<SetItem>> GetSetItemsAsync(int setId);
    Task<int> GetMaxSortOrderAsync(int setId);
    Task AddAsync(Set set);
    Task AddSetItemsAsync(IEnumerable<SetItem> items);
    Task SaveChangesAsync();
    void Remove(Set set);
}
