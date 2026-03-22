using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Vault;
using GeekVault.Api.Extensions;
using GeekVault.Api.Repositories.Vault;
using GeekVault.Api.Services.Admin;

namespace GeekVault.Api.Services.Vault;

public class CollectionsService : ICollectionsService
{
    private readonly ICollectionsRepository _repository;
    private readonly ICatalogItemsRepository _catalogItemsRepository;
    private readonly IAuditLogService _auditLogService;

    public CollectionsService(ICollectionsRepository repository, ICatalogItemsRepository catalogItemsRepository, IAuditLogService auditLogService)
    {
        _repository = repository;
        _catalogItemsRepository = catalogItemsRepository;
        _auditLogService = auditLogService;
    }

    public async Task<List<CollectionResponse>> GetAllAsync(string userId, string? sortBy = null, string? sortDir = null)
    {
        var results = await _repository.GetByUserIdWithCountsAsync(userId, sortBy, sortDir);
        return results.Select(r => new CollectionResponse(
            r.Collection.Id, r.Collection.Name, r.Collection.Description, r.Collection.CoverImage,
            r.Collection.Visibility.ToString(), r.Collection.CollectionTypeId,
            r.Collection.CollectionType.Name, r.ItemCount, r.OwnedCount,
            r.ItemCount > 0 ? Math.Round((double)r.OwnedCount / r.ItemCount * 100, 1) : 0,
            r.Collection.CreatedAt, r.Collection.UpdatedAt)).ToList();
    }

    public async Task<CollectionResponse?> GetByIdAsync(int id, string userId)
    {
        var c = await _repository.GetByIdAndUserIdWithTypeAsync(id, userId);
        if (c == null) return null;

        var itemCount = await _repository.GetItemCountAsync(c.Id);
        var ownedCount = await _repository.GetOwnedCountAsync(c.Id);
        var completionPct = itemCount > 0 ? Math.Round((double)ownedCount / itemCount * 100, 1) : 0;
        return new CollectionResponse(c.Id, c.Name, c.Description, c.CoverImage,
            c.Visibility.ToString(), c.CollectionTypeId, c.CollectionType.Name, itemCount, ownedCount, completionPct, c.CreatedAt, c.UpdatedAt);
    }

    public async Task<CollectionResponse> CreateAsync(string userId, CreateCollectionRequest request)
    {
        if (!Enum.TryParse<Visibility>(request.Visibility, true, out var visibility))
            visibility = Visibility.Private;

        var collection = new Collection
        {
            UserId = userId,
            CollectionTypeId = request.CollectionTypeId,
            Name = request.Name,
            Description = request.Description,
            Visibility = visibility,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(collection);
        await _repository.SaveChangesAsync();

        var created = await _repository.GetByIdAndUserIdWithTypeAsync(collection.Id, userId);

        await _auditLogService.LogActionAsync(userId, "Create", "Collection", collection.Id.ToString(), $"Created collection '{collection.Name}'");

        return new CollectionResponse(created!.Id, created.Name, created.Description, created.CoverImage,
            created.Visibility.ToString(), created.CollectionTypeId, created.CollectionType.Name, 0, 0, 0, created.CreatedAt, created.UpdatedAt);
    }

    public async Task<CollectionResponse?> UpdateAsync(int id, string userId, UpdateCollectionRequest request)
    {
        var collection = await _repository.GetByIdAndUserIdWithTypeAsync(id, userId);
        if (collection == null) return null;

        collection.Name = request.Name ?? collection.Name;
        collection.Description = request.Description;
        if (request.Visibility != null && Enum.TryParse<Visibility>(request.Visibility, true, out var vis))
            collection.Visibility = vis;
        collection.UpdatedAt = DateTime.UtcNow;

        await _repository.SaveChangesAsync();

        var itemCount = await _repository.GetItemCountAsync(collection.Id);
        var ownedCount = await _repository.GetOwnedCountAsync(collection.Id);
        var completionPct = itemCount > 0 ? Math.Round((double)ownedCount / itemCount * 100, 1) : 0;

        await _auditLogService.LogActionAsync(userId, "Update", "Collection", collection.Id.ToString(), $"Updated collection '{collection.Name}'");

        return new CollectionResponse(collection.Id, collection.Name, collection.Description,
            collection.CoverImage, collection.Visibility.ToString(), collection.CollectionTypeId,
            collection.CollectionType.Name, itemCount, ownedCount, completionPct,
            collection.CreatedAt, collection.UpdatedAt);
    }

    public async Task<bool> DeleteAsync(int id, string userId)
    {
        var collection = await _repository.GetByIdAndUserIdAsync(id, userId);
        if (collection == null) return false;

        var collectionName = collection.Name;
        _repository.Remove(collection);
        await _repository.SaveChangesAsync();

        await _auditLogService.LogActionAsync(userId, "Delete", "Collection", id.ToString(), $"Deleted collection '{collectionName}'");

        return true;
    }

    public async Task<(string? CoverUrl, bool NotFound, string? Error)> UploadCoverAsync(int id, string userId, IFormFile file, string webRootPath)
    {
        var collection = await _repository.GetByIdAndUserIdAsync(id, userId);
        if (collection == null) return (null, true, null);

        if (file.Length == 0)
            return (null, false, "No cover file provided");

        if (!file.IsValidImageFile())
            return (null, false, "Invalid image file. Allowed types: jpg, jpeg, png, gif, webp");

        var uploadsDir = Path.Combine(webRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var extension = Path.GetExtension(file.FileName);
        var fileName = $"collection-{id}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{extension}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        collection.CoverImage = $"/uploads/{fileName}";
        collection.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync();

        return (collection.CoverImage, false, null);
    }

    public async Task<(string? CoverUrl, bool NotFound, string? Error)> CoverFromItemAsync(int collectionId, int itemId, string userId, string webRootPath)
    {
        var collection = await _repository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return (null, true, null);

        var item = await _catalogItemsRepository.GetByIdAndCollectionIdAsync(itemId, collectionId);
        if (item == null) return (null, true, null);

        if (string.IsNullOrEmpty(item.Image))
            return (null, true, "Item has no image");

        var sourcePath = Path.Combine(webRootPath, item.Image.TrimStart('/'));
        if (!File.Exists(sourcePath))
            return (null, true, "Item image file not found");

        var uploadsDir = Path.Combine(webRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var extension = Path.GetExtension(sourcePath);
        var fileName = $"collection-{collectionId}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{extension}";
        var destPath = Path.Combine(uploadsDir, fileName);

        File.Copy(sourcePath, destPath, overwrite: true);

        collection.CoverImage = $"/uploads/{fileName}";
        collection.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveChangesAsync();

        return (collection.CoverImage, false, null);
    }

    public async Task<(bool Success, bool NotFound, string? Error)> ReorderAsync(string userId, List<int> collectionIds)
    {
        if (collectionIds.Count != collectionIds.Distinct().Count())
            return (false, false, "Duplicate collection IDs are not allowed");

        var collections = await _repository.GetByIdsAndUserIdAsync(collectionIds, userId);
        if (collections.Count != collectionIds.Count)
            return (false, false, "Some collection IDs do not belong to this user");

        var collectionsById = collections.ToDictionary(c => c.Id);
        for (var i = 0; i < collectionIds.Count; i++)
        {
            collectionsById[collectionIds[i]].SortOrder = i;
        }

        await _repository.SaveChangesAsync();
        return (true, false, null);
    }
}
