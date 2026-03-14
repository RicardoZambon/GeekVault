using GeekVault.Api.Data;
using GeekVault.Api.Entities.Vault;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Repositories.Vault;

public class CollectionTypesRepository : ICollectionTypesRepository
{
    private readonly ApplicationDbContext _db;

    public CollectionTypesRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<CollectionType>> GetByUserIdAsync(string userId)
    {
        return await _db.CollectionTypes
            .Where(ct => ct.UserId == userId)
            .ToListAsync();
    }

    public async Task<CollectionType?> GetByIdAndUserIdAsync(int id, string userId)
    {
        return await _db.CollectionTypes.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    }

    public async Task AddAsync(CollectionType collectionType)
    {
        _db.CollectionTypes.Add(collectionType);
        await _db.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }

    public void Remove(CollectionType collectionType)
    {
        _db.CollectionTypes.Remove(collectionType);
    }
}
