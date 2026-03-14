using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Vault;
using GeekVault.Api.Repositories.Vault;

namespace GeekVault.Api.Services.Vault;

public class WishlistService : IWishlistService
{
    private readonly IWishlistRepository _wishlistRepository;
    private readonly ICollectionsRepository _collectionsRepository;

    public WishlistService(IWishlistRepository wishlistRepository, ICollectionsRepository collectionsRepository)
    {
        _wishlistRepository = wishlistRepository;
        _collectionsRepository = collectionsRepository;
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

        var item = new WishlistItem
        {
            CollectionId = collectionId,
            CatalogItemId = request.CatalogItemId,
            Name = request.Name,
            Priority = request.Priority,
            TargetPrice = request.TargetPrice,
            Notes = request.Notes
        };

        await _wishlistRepository.AddAsync(item);
        await _wishlistRepository.SaveChangesAsync();

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

        return (MapToResponse(item), false, false);
    }

    public async Task<bool?> DeleteAsync(int collectionId, int id, string userId)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var item = await _wishlistRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (item == null) return false;

        _wishlistRepository.Remove(item);
        await _wishlistRepository.SaveChangesAsync();
        return true;
    }

    private static WishlistItemResponse MapToResponse(WishlistItem w) =>
        new(w.Id, w.CollectionId, w.CatalogItemId, w.Name, w.Priority, w.TargetPrice, w.Notes);
}
