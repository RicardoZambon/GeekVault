using GeekVault.Api.Data;
using GeekVault.Api.Entities.Vault;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Repositories.Vault;

public class WishlistRepository : IWishlistRepository
{
    private readonly ApplicationDbContext _db;

    public WishlistRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<WishlistItem>> GetByCollectionIdAsync(int collectionId)
    {
        return await _db.WishlistItems
            .Where(w => w.CollectionId == collectionId)
            .OrderBy(w => w.SortOrder)
            .ToListAsync();
    }

    public async Task<WishlistItem?> GetByIdAndCollectionIdAsync(int id, int collectionId)
    {
        return await _db.WishlistItems.FirstOrDefaultAsync(w => w.Id == id && w.CollectionId == collectionId);
    }

    public Task AddAsync(WishlistItem item)
    {
        _db.WishlistItems.Add(item);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }

    public void Remove(WishlistItem item)
    {
        _db.WishlistItems.Remove(item);
    }

    public async Task<int> GetMaxSortOrderAsync(int collectionId)
    {
        var items = _db.WishlistItems.Where(w => w.CollectionId == collectionId);
        if (!await items.AnyAsync()) return -1;
        return await items.MaxAsync(w => w.SortOrder);
    }

    public async Task<List<WishlistItem>> GetByIdsAndCollectionIdAsync(IEnumerable<int> ids, int collectionId)
    {
        return await _db.WishlistItems
            .Where(w => ids.Contains(w.Id) && w.CollectionId == collectionId)
            .ToListAsync();
    }
}
