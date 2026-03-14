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

    public async Task<CatalogItem?> GetByIdAndCollectionIdAsync(int id, int collectionId)
    {
        return await _db.CatalogItems.FirstOrDefaultAsync(i => i.Id == id && i.CollectionId == collectionId);
    }

    public IQueryable<CatalogItem> GetByCollectionId(int collectionId)
    {
        return _db.CatalogItems.Where(i => i.CollectionId == collectionId);
    }

    public async Task<List<CatalogItem>> GetByCollectionIdWithFieldsAsync(int collectionId)
    {
        return await _db.CatalogItems
            .Where(ci => ci.CollectionId == collectionId)
            .Include(ci => ci.CustomFieldValues)
            .ToListAsync();
    }

    public async Task AddAsync(CatalogItem item)
    {
        _db.CatalogItems.Add(item);
        await _db.SaveChangesAsync();
    }

    public async Task AddRangeAsync(IEnumerable<CatalogItem> items)
    {
        foreach (var item in items)
        {
            _db.CatalogItems.Add(item);
        }
        await _db.SaveChangesAsync();
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
