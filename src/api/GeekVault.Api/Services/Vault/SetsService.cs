using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Vault;
using GeekVault.Api.Repositories.Vault;

namespace GeekVault.Api.Services.Vault;

public class SetsService : ISetsService
{
    private readonly ISetsRepository _setsRepository;
    private readonly ICollectionsRepository _collectionsRepository;
    private readonly IOwnedCopiesRepository _ownedCopiesRepository;

    public SetsService(ISetsRepository setsRepository, ICollectionsRepository collectionsRepository, IOwnedCopiesRepository ownedCopiesRepository)
    {
        _setsRepository = setsRepository;
        _collectionsRepository = collectionsRepository;
        _ownedCopiesRepository = ownedCopiesRepository;
    }

    public async Task<List<SetResponse>?> GetAllAsync(int collectionId, string userId)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var sets = await _setsRepository.GetByCollectionIdAsync(collectionId);
        return sets.Select(s => new SetResponse(s.Id, s.CollectionId, s.Name, s.ExpectedItemCount, null, null, null)).ToList();
    }

    public async Task<SetResponse?> GetByIdAsync(int collectionId, int id, string userId)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var set = await _setsRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (set == null) return null;

        var items = await _setsRepository.GetSetItemsAsync(id);
        var itemResponses = items.Select(si => new SetItemResponse(si.Id, si.SetId, si.CatalogItemId, si.Name, si.SortOrder)).ToList();

        // Calculate completion
        var completedCount = 0;
        foreach (var item in itemResponses)
        {
            if (item.CatalogItemId != null)
            {
                var hasOwnedCopy = await _ownedCopiesRepository.AnyByCatalogItemIdAsync(item.CatalogItemId.Value);
                if (hasOwnedCopy) completedCount++;
            }
        }
        var completionPercentage = set.ExpectedItemCount > 0
            ? (double)completedCount / set.ExpectedItemCount * 100
            : 0;

        return new SetResponse(set.Id, set.CollectionId, set.Name, set.ExpectedItemCount,
            itemResponses, completedCount, Math.Round(completionPercentage, 2));
    }

    public async Task<SetResponse?> CreateAsync(int collectionId, string userId, CreateSetRequest request)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var set = new Set
        {
            CollectionId = collectionId,
            Name = request.Name,
            ExpectedItemCount = request.ExpectedItemCount
        };

        await _setsRepository.AddAsync(set);
        await _setsRepository.SaveChangesAsync();

        return new SetResponse(set.Id, set.CollectionId, set.Name, set.ExpectedItemCount, null, null, null);
    }

    public async Task<SetResponse?> UpdateAsync(int collectionId, int id, string userId, UpdateSetRequest request)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var set = await _setsRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (set == null) return null;

        set.Name = request.Name ?? set.Name;
        if (request.ExpectedItemCount.HasValue)
            set.ExpectedItemCount = request.ExpectedItemCount.Value;

        await _setsRepository.SaveChangesAsync();

        return new SetResponse(set.Id, set.CollectionId, set.Name, set.ExpectedItemCount, null, null, null);
    }

    public async Task<bool?> DeleteAsync(int collectionId, int id, string userId)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var set = await _setsRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (set == null) return false;

        _setsRepository.Remove(set);
        await _setsRepository.SaveChangesAsync();
        return true;
    }

    public async Task<List<SetItemResponse>?> AddItemsAsync(int collectionId, int id, string userId, List<CreateSetItemRequest> request)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var set = await _setsRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (set == null) return null;

        var maxSortOrder = await _setsRepository.GetMaxSortOrderAsync(id);

        var items = new List<SetItem>();
        foreach (var itemReq in request)
        {
            maxSortOrder++;
            var setItem = new SetItem
            {
                SetId = id,
                CatalogItemId = itemReq.CatalogItemId,
                Name = itemReq.Name,
                SortOrder = itemReq.SortOrder ?? maxSortOrder
            };
            items.Add(setItem);
        }

        await _setsRepository.AddSetItemsAsync(items);
        await _setsRepository.SaveChangesAsync();

        return items.Select(si => new SetItemResponse(si.Id, si.SetId, si.CatalogItemId, si.Name, si.SortOrder)).ToList();
    }
}
