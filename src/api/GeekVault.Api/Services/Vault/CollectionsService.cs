using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Vault;
using GeekVault.Api.Extensions;
using GeekVault.Api.Repositories.Vault;

namespace GeekVault.Api.Services.Vault;

public class CollectionsService : ICollectionsService
{
    private readonly ICollectionsRepository _repository;

    public CollectionsService(ICollectionsRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CollectionResponse>> GetAllAsync(string userId)
    {
        var collections = await _repository.GetByUserIdAsync(userId);
        var responses = new List<CollectionResponse>();
        foreach (var c in collections)
        {
            var itemCount = await _repository.GetItemCountAsync(c.Id);
            responses.Add(new CollectionResponse(c.Id, c.Name, c.Description, c.CoverImage,
                c.Visibility.ToString(), c.CollectionTypeId, itemCount));
        }
        return responses;
    }

    public async Task<CollectionResponse?> GetByIdAsync(int id, string userId)
    {
        var c = await _repository.GetByIdAndUserIdAsync(id, userId);
        if (c == null) return null;

        var itemCount = await _repository.GetItemCountAsync(c.Id);
        return new CollectionResponse(c.Id, c.Name, c.Description, c.CoverImage,
            c.Visibility.ToString(), c.CollectionTypeId, itemCount);
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
            Visibility = visibility
        };

        await _repository.AddAsync(collection);
        await _repository.SaveChangesAsync();

        return new CollectionResponse(collection.Id, collection.Name, collection.Description, collection.CoverImage,
            collection.Visibility.ToString(), collection.CollectionTypeId, 0);
    }

    public async Task<CollectionResponse?> UpdateAsync(int id, string userId, UpdateCollectionRequest request)
    {
        var collection = await _repository.GetByIdAndUserIdAsync(id, userId);
        if (collection == null) return null;

        collection.Name = request.Name ?? collection.Name;
        collection.Description = request.Description;
        if (request.Visibility != null && Enum.TryParse<Visibility>(request.Visibility, true, out var vis))
            collection.Visibility = vis;

        await _repository.SaveChangesAsync();

        var itemCount = await _repository.GetItemCountAsync(collection.Id);
        return new CollectionResponse(collection.Id, collection.Name, collection.Description,
            collection.CoverImage, collection.Visibility.ToString(), collection.CollectionTypeId, itemCount);
    }

    public async Task<bool> DeleteAsync(int id, string userId)
    {
        var collection = await _repository.GetByIdAndUserIdAsync(id, userId);
        if (collection == null) return false;

        _repository.Remove(collection);
        await _repository.SaveChangesAsync();
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
        await _repository.SaveChangesAsync();

        return (collection.CoverImage, false, null);
    }
}
