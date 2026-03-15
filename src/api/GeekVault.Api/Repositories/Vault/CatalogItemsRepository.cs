using GeekVault.Api.Data;
using GeekVault.Api.Entities.Vault;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Repositories.Vault;

public class CatalogItemsRepository : ICatalogItemsRepository
{
    private readonly ApplicationDbContext _db;

    public CatalogItemsRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public IQueryable<CatalogItem> Query() => _db.CatalogItems;

    public async Task<CatalogItem?> GetByIdAndCollectionIdAsync(int id, int collectionId)
    {
        return await _db.CatalogItems.FirstOrDefaultAsync(i => i.Id == id && i.CollectionId == collectionId);
    }

    public IQueryable<CatalogItem> GetByCollectionId(int collectionId)
    {
        return _db.CatalogItems.Where(i => i.CollectionId == collectionId).OrderBy(i => i.SortOrder);
    }

    public async Task<List<CatalogItem>> GetByCollectionIdWithFieldsAsync(int collectionId)
    {
        return await _db.CatalogItems
            .Where(ci => ci.CollectionId == collectionId)
            .OrderBy(ci => ci.SortOrder)
            .Include(ci => ci.CustomFieldValues)
            .ToListAsync();
    }

    public async Task<int> GetMaxSortOrderAsync(int collectionId)
    {
        return await _db.CatalogItems
            .Where(i => i.CollectionId == collectionId)
            .MaxAsync(i => (int?)i.SortOrder) ?? -1;
    }

    public async Task<List<CatalogItem>> GetByIdsAndCollectionIdAsync(IEnumerable<int> ids, int collectionId)
    {
        return await _db.CatalogItems
            .Where(i => ids.Contains(i.Id) && i.CollectionId == collectionId)
            .ToListAsync();
    }

    public async Task<List<CatalogItem>> GetByCollectionTypeIdAsync(int collectionTypeId)
    {
        return await _db.CatalogItems
            .Where(ci => _db.Collections.Any(c => c.Id == ci.CollectionId && c.CollectionTypeId == collectionTypeId))
            .ToListAsync();
    }

    public Task AddAsync(CatalogItem item)
    {
        _db.CatalogItems.Add(item);
        return Task.CompletedTask;
    }

    public Task AddRangeAsync(IEnumerable<CatalogItem> items)
    {
        foreach (var item in items)
        {
            _db.CatalogItems.Add(item);
        }
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }

    public void Remove(CatalogItem item)
    {
        _db.CatalogItems.Remove(item);
    }
}
