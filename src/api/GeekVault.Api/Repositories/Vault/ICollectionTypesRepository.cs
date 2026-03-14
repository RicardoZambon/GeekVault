using GeekVault.Api.Entities.Vault;

namespace GeekVault.Api.Repositories.Vault;

public interface ICollectionTypesRepository
{
    Task<List<CollectionType>> GetByUserIdAsync(string userId);
    Task<CollectionType?> GetByIdAndUserIdAsync(int id, string userId);
    Task AddAsync(CollectionType collectionType);
    Task SaveChangesAsync();
    void Remove(CollectionType collectionType);
}
