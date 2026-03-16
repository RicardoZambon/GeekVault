using GeekVault.Api.Entities.Vault;

namespace GeekVault.Api.Repositories.Vault;

public interface ICollectionsRepository
{
    Task<List<Collection>> GetByUserIdAsync(string userId);
    Task<List<CollectionWithCounts>> GetByUserIdWithCountsAsync(string userId, string? sortBy = null, string? sortDir = null);
    Task<Collection?> GetByIdAndUserIdAsync(int id, string userId);
    Task<Collection?> GetByIdAndUserIdWithTypeAsync(int id, string userId);
    Task<int> GetItemCountAsync(int collectionId);
    Task<int> GetOwnedCountAsync(int collectionId);
    Task AddAsync(Collection collection);
    Task SaveChangesAsync();
    void Remove(Collection collection);
    Task<List<CollectionSummary>> GetCollectionSummariesAsync(string userId);
}

public class CollectionWithCounts
{
    public Collection Collection { get; set; } = null!;
    public int ItemCount { get; set; }
    public int OwnedCount { get; set; }
}

public class CollectionSummary
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ItemCount { get; set; }
    public int OwnedCount { get; set; }
    public decimal Value { get; set; }
    public decimal Invested { get; set; }
}
