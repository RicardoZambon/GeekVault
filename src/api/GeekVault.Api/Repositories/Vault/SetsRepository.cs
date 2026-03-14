using GeekVault.Api.Data;
using GeekVault.Api.Entities.Vault;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Repositories.Vault;

public class SetsRepository : ISetsRepository
{
    private readonly ApplicationDbContext _db;

    public SetsRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<Set>> GetByCollectionIdAsync(int collectionId)
    {
        return await _db.Sets
            .Where(s => s.CollectionId == collectionId)
            .ToListAsync();
    }

    public async Task<Set?> GetByIdAndCollectionIdAsync(int id, int collectionId)
    {
        return await _db.Sets.FirstOrDefaultAsync(s => s.Id == id && s.CollectionId == collectionId);
    }

    public async Task<List<SetItem>> GetSetItemsAsync(int setId)
    {
        return await _db.SetItems
            .Where(si => si.SetId == setId)
            .OrderBy(si => si.SortOrder)
            .ToListAsync();
    }

    public async Task<Dictionary<int, List<SetItem>>> GetSetItemsByCollectionAsync(int collectionId)
    {
        var setIds = await _db.Sets
            .Where(s => s.CollectionId == collectionId)
            .Select(s => s.Id)
            .ToListAsync();

        var items = await _db.SetItems
            .Where(si => setIds.Contains(si.SetId))
            .ToListAsync();

        return items.GroupBy(si => si.SetId)
            .ToDictionary(g => g.Key, g => g.ToList());
    }

    public async Task<int> GetMaxSortOrderAsync(int setId)
    {
        return await _db.SetItems
            .Where(si => si.SetId == setId)
            .Select(si => (int?)si.SortOrder)
            .MaxAsync() ?? 0;
    }

    public async Task AddAsync(Set set)
    {
        _db.Sets.Add(set);
        await _db.SaveChangesAsync();
    }

    public async Task AddSetItemsAsync(IEnumerable<SetItem> items)
    {
        foreach (var item in items)
        {
            _db.SetItems.Add(item);
        }
        await _db.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }

    public void Remove(Set set)
    {
        _db.Sets.Remove(set);
    }
}
