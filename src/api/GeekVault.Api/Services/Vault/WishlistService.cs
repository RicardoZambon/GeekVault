using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Vault;
using GeekVault.Api.Repositories.Vault;
using GeekVault.Api.Services.Admin;

namespace GeekVault.Api.Services.Vault;

public class WishlistService : IWishlistService
{
    private readonly IWishlistRepository _wishlistRepository;
    private readonly ICollectionsRepository _collectionsRepository;
    private readonly IAuditLogService _auditLogService;

    public WishlistService(IWishlistRepository wishlistRepository, ICollectionsRepository collectionsRepository, IAuditLogService auditLogService)
    {
        _wishlistRepository = wishlistRepository;
        _collectionsRepository = collectionsRepository;
        _auditLogService = auditLogService;
    }

    public async Task<List<WishlistItemResponse>?> GetAllAsync(int collectionId, string userId)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var items = await _wishlistRepository.GetByCollectionIdAsync(collectionId);
        return items.Select(w => MapToResponse(w)).ToList();
    }

    public async Task<WishlistItemResponse?> CreateAsync(int collectionId, string userId, CreateWishlistItemRequest request)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var maxSortOrder = await _wishlistRepository.GetMaxSortOrderAsync(collectionId);

        var item = new WishlistItem
        {
            CollectionId = collectionId,
            CatalogItemId = request.CatalogItemId,
            Name = request.Name,
            Priority = request.Priority,
            TargetPrice = request.TargetPrice,
            Notes = request.Notes,
            SortOrder = maxSortOrder + 1
        };

        await _wishlistRepository.AddAsync(item);
        await _wishlistRepository.SaveChangesAsync();

        await _auditLogService.LogActionAsync(userId, "Create", "WishlistItem", item.Id.ToString(), $"Created wishlist item '{item.Name}' in collection {collectionId}");

        return MapToResponse(item);
    }

    public async Task<(WishlistItemResponse? Response, bool CollectionNotFound, bool ItemNotFound)> UpdateAsync(
        int collectionId, int id, string userId, UpdateWishlistItemRequest request)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return (null, true, false);

        var item = await _wishlistRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (item == null) return (null, false, true);

        item.Name = request.Name ?? item.Name;
        item.CatalogItemId = request.CatalogItemId;
        if (request.Priority.HasValue)
            item.Priority = request.Priority.Value;
        item.TargetPrice = request.TargetPrice;
        item.Notes = request.Notes;

        await _wishlistRepository.SaveChangesAsync();

        await _auditLogService.LogActionAsync(userId, "Update", "WishlistItem", item.Id.ToString(), $"Updated wishlist item '{item.Name}' in collection {collectionId}");

        return (MapToResponse(item), false, false);
    }

    public async Task<bool?> DeleteAsync(int collectionId, int id, string userId)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var item = await _wishlistRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (item == null) return false;

        var itemName = item.Name;
        _wishlistRepository.Remove(item);
        await _wishlistRepository.SaveChangesAsync();

        await _auditLogService.LogActionAsync(userId, "Delete", "WishlistItem", id.ToString(), $"Deleted wishlist item '{itemName}' from collection {collectionId}");

        return true;
    }

    public async Task<(bool Success, bool NotFound, string? Error)> ReorderAsync(
        int collectionId, string userId, List<int> itemIds)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return (false, true, null);

        if (itemIds.Count != itemIds.Distinct().Count())
            return (false, false, "Duplicate item IDs are not allowed");

        var items = await _wishlistRepository.GetByIdsAndCollectionIdAsync(itemIds, collectionId);
        if (items.Count != itemIds.Count)
            return (false, false, "Some item IDs do not belong to this collection");

        var itemById = items.ToDictionary(x => x.Id);
        for (var i = 0; i < itemIds.Count; i++)
        {
            itemById[itemIds[i]].SortOrder = i;
        }

        await _wishlistRepository.SaveChangesAsync();
        return (true, false, null);
    }

    private static WishlistItemResponse MapToResponse(WishlistItem w) =>
        new(w.Id, w.CollectionId, w.CatalogItemId, w.Name, w.Priority, w.TargetPrice, w.Notes, w.SortOrder);
}
