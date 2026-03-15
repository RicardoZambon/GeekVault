using GeekVault.Api.Data;
using GeekVault.Api.Entities.Vault;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Repositories.Vault;

public class OwnedCopiesRepository : IOwnedCopiesRepository
{
    private readonly ApplicationDbContext _db;

    public OwnedCopiesRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public IQueryable<OwnedCopy> Query() => _db.OwnedCopies;

    public async Task<List<OwnedCopy>> GetByCatalogItemIdAsync(int catalogItemId)
    {
        return await _db.OwnedCopies
            .Where(oc => oc.CatalogItemId == catalogItemId)
            .Include(oc => oc.Images)
            .ToListAsync();
    }

    public async Task<OwnedCopy?> GetByIdAndCatalogItemIdAsync(int id, int catalogItemId)
    {
        return await _db.OwnedCopies.FirstOrDefaultAsync(oc => oc.Id == id && oc.CatalogItemId == catalogItemId);
    }

    public async Task<CatalogItem?> GetCatalogItemWithCollectionAsync(int catalogItemId, string userId)
    {
        return await _db.CatalogItems
            .Include(i => i.Collection)
            .FirstOrDefaultAsync(i => i.Id == catalogItemId && i.Collection.UserId == userId);
    }

    public async Task<List<OwnedCopy>> GetByCollectionItemIdsAsync(IEnumerable<int> catalogItemIds)
    {
        var ids = catalogItemIds.ToList();
        return await _db.OwnedCopies
            .Where(oc => ids.Contains(oc.CatalogItemId))
            .Include(oc => oc.Images)
            .ToListAsync();
    }

    public async Task<bool> AnyByCatalogItemIdAsync(int catalogItemId)
    {
        return await _db.OwnedCopies.AnyAsync(oc => oc.CatalogItemId == catalogItemId);
    }

    public async Task<HashSet<int>> GetOwnedCatalogItemIdsAsync(IEnumerable<int> catalogItemIds)
    {
        var ids = catalogItemIds.ToList();
        var ownedIds = await _db.OwnedCopies
            .Where(oc => ids.Contains(oc.CatalogItemId))
            .Select(oc => oc.CatalogItemId)
            .Distinct()
            .ToListAsync();
        return ownedIds.ToHashSet();
    }

    public IQueryable<OwnedCopy> GetByUserCatalogItemIds(string userId)
    {
        var userCatalogItemIds = _db.CatalogItems
            .Where(ci => _db.Collections.Any(c => c.Id == ci.CollectionId && c.UserId == userId))
            .Select(ci => ci.Id);

        return _db.OwnedCopies.Where(oc => userCatalogItemIds.Contains(oc.CatalogItemId));
    }

    public Task AddAsync(OwnedCopy copy)
    {
        _db.OwnedCopies.Add(copy);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }

    public void Remove(OwnedCopy copy)
    {
        _db.OwnedCopies.Remove(copy);
    }
}
