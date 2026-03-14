using GeekVault.Api.Data;
using GeekVault.Api.Entities.Vault;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Repositories.Vault;

public class CollectionsRepository : ICollectionsRepository
{
    private readonly ApplicationDbContext _db;

    public CollectionsRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<Collection>> GetByUserIdAsync(string userId)
    {
        return await _db.Collections
            .Where(c => c.UserId == userId)
            .ToListAsync();
    }

    public async Task<Collection?> GetByIdAndUserIdAsync(int id, string userId)
    {
        return await _db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    }

    public async Task<Collection?> GetByIdAndUserIdWithTypeAsync(int id, string userId)
    {
        return await _db.Collections
            .Include(c => c.CollectionType)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    }

    public async Task<int> GetItemCountAsync(int collectionId)
    {
        return await _db.CatalogItems.CountAsync(ci => ci.CollectionId == collectionId);
    }

    public async Task AddAsync(Collection collection)
    {
        _db.Collections.Add(collection);
        await _db.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }

    public void Remove(Collection collection)
    {
        _db.Collections.Remove(collection);
    }

    public async Task<List<CollectionSummary>> GetCollectionSummariesAsync(string userId)
    {
        return await _db.Collections
            .Where(c => c.UserId == userId)
            .Select(c => new CollectionSummary
            {
                Id = c.Id,
                Name = c.Name,
                ItemCount = _db.CatalogItems.Count(ci => ci.CollectionId == c.Id),
                OwnedCount = _db.OwnedCopies.Count(oc => _db.CatalogItems.Any(ci => ci.Id == oc.CatalogItemId && ci.CollectionId == c.Id)),
                Value = _db.OwnedCopies
                    .Where(oc => _db.CatalogItems.Any(ci => ci.Id == oc.CatalogItemId && ci.CollectionId == c.Id))
                    .Sum(oc => (decimal?)oc.EstimatedValue ?? 0m),
                Invested = _db.OwnedCopies
                    .Where(oc => _db.CatalogItems.Any(ci => ci.Id == oc.CatalogItemId && ci.CollectionId == c.Id))
                    .Sum(oc => (decimal?)oc.PurchasePrice ?? 0m)
            })
            .ToListAsync();
    }
}
