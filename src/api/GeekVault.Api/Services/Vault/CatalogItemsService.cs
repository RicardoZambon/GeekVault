using GeekVault.Api.DTOs.Common;
using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Vault;
using GeekVault.Api.Repositories.Vault;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Services.Vault;

public class CatalogItemsService : ICatalogItemsService
{
    private readonly ICatalogItemsRepository _catalogItemsRepository;
    private readonly ICollectionsRepository _collectionsRepository;
    private readonly IOwnedCopiesRepository _ownedCopiesRepository;

    public CatalogItemsService(
        ICatalogItemsRepository catalogItemsRepository,
        ICollectionsRepository collectionsRepository,
        IOwnedCopiesRepository ownedCopiesRepository)
    {
        _catalogItemsRepository = catalogItemsRepository;
        _collectionsRepository = collectionsRepository;
        _ownedCopiesRepository = ownedCopiesRepository;
    }

    public async Task<PaginatedResponse<CatalogItemResponse>?> GetAllAsync(
        int collectionId, string userId, string? search, string? condition, string? ownedStatus,
        string? sortBy, string? sortDir, int? page, int? pageSize)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var query = _catalogItemsRepository.GetByCollectionId(collectionId);

        // Search by name or description
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(i => i.Name.ToLower().Contains(searchLower) ||
                (i.Description != null && i.Description.ToLower().Contains(searchLower)));
        }

        // Filter by condition
        if (!string.IsNullOrWhiteSpace(condition) && Enum.TryParse<Condition>(condition, true, out var conditionEnum))
        {
            var ownedCopiesQuery = _ownedCopiesRepository.Query();
            query = query.Where(i => ownedCopiesQuery.Any(oc => oc.CatalogItemId == i.Id && oc.Condition == conditionEnum));
        }

        // Filter by owned status
        if (!string.IsNullOrWhiteSpace(ownedStatus))
        {
            var ownedCopiesQuery = _ownedCopiesRepository.Query();
            if (ownedStatus.Equals("owned", StringComparison.OrdinalIgnoreCase))
                query = query.Where(i => ownedCopiesQuery.Any(oc => oc.CatalogItemId == i.Id));
            else if (ownedStatus.Equals("unowned", StringComparison.OrdinalIgnoreCase))
                query = query.Where(i => !ownedCopiesQuery.Any(oc => oc.CatalogItemId == i.Id));
        }

        var totalCount = await query.CountAsync();

        // Sort
        var isDesc = sortDir?.Equals("desc", StringComparison.OrdinalIgnoreCase) == true;
        query = (sortBy?.ToLower()) switch
        {
            "name" => isDesc ? query.OrderByDescending(i => i.Name) : query.OrderBy(i => i.Name),
            "date" => isDesc ? query.OrderByDescending(i => i.ReleaseDate) : query.OrderBy(i => i.ReleaseDate),
            "rarity" => isDesc ? query.OrderByDescending(i => i.Rarity) : query.OrderBy(i => i.Rarity),
            _ => query.OrderBy(i => i.Id)
        };

        // Pagination
        var currentPage = page ?? 1;
        var currentPageSize = pageSize ?? 20;
        if (currentPage < 1) currentPage = 1;
        if (currentPageSize < 1) currentPageSize = 1;
        if (currentPageSize > 100) currentPageSize = 100;

        query = query.Skip((currentPage - 1) * currentPageSize).Take(currentPageSize);

        var items = await query
            .Select(i => new CatalogItemResponse(i.Id, i.CollectionId, i.Identifier, i.Name, i.Description,
                i.ReleaseDate, i.Manufacturer, i.ReferenceCode, i.Image, i.Rarity,
                i.CustomFieldValues.Select(f => new CustomFieldValueDto(f.Name, f.Value)).ToList(),
                null))
            .ToListAsync();

        return new PaginatedResponse<CatalogItemResponse>(items, totalCount, currentPage, currentPageSize);
    }

    public async Task<CatalogItemResponse?> GetByIdAsync(int collectionId, int id, string userId)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var item = await _catalogItemsRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (item == null) return null;

        var ownedCopies = await _ownedCopiesRepository.GetByCatalogItemIdAsync(id);
        var copies = ownedCopies.Select(oc => new OwnedCopyDto(oc.Id, oc.Condition.ToString(), oc.PurchasePrice,
            oc.EstimatedValue, oc.AcquisitionDate, oc.AcquisitionSource, oc.Notes)).ToList();

        return new CatalogItemResponse(item.Id, item.CollectionId, item.Identifier, item.Name,
            item.Description, item.ReleaseDate, item.Manufacturer, item.ReferenceCode, item.Image, item.Rarity,
            item.CustomFieldValues.Select(f => new CustomFieldValueDto(f.Name, f.Value)).ToList(),
            copies);
    }

    public async Task<(CatalogItemResponse? Response, bool NotFound, string? Error)> CreateAsync(
        int collectionId, string userId, CreateCatalogItemRequest request)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdWithTypeAsync(collectionId, userId);
        if (collection == null) return (null, true, null);

        // Validate and filter custom field values against schema
        var validatedFieldValues = new List<CustomFieldValueDto>();
        if (request.CustomFieldValues != null && request.CustomFieldValues.Count > 0)
        {
            var schema = collection.CollectionType.CustomFieldSchema;
            var schemaFieldNames = schema.Select(f => f.Name).ToHashSet();
            validatedFieldValues = request.CustomFieldValues.Where(fv => schemaFieldNames.Contains(fv.Name)).ToList();
            foreach (var field in schema.Where(f => f.Required))
            {
                if (!validatedFieldValues.Any(fv => fv.Name == field.Name && !string.IsNullOrEmpty(fv.Value)))
                    return (null, false, $"Required custom field missing: {field.Name}");
            }
        }

        var item = new CatalogItem
        {
            CollectionId = collectionId,
            Identifier = request.Identifier,
            Name = request.Name,
            Description = request.Description,
            ReleaseDate = request.ReleaseDate,
            Manufacturer = request.Manufacturer,
            ReferenceCode = request.ReferenceCode,
            Rarity = request.Rarity,
            CustomFieldValues = validatedFieldValues.Select(f => new CustomFieldValue
            {
                Name = f.Name,
                Value = f.Value
            }).ToList()
        };

        await _catalogItemsRepository.AddAsync(item);
        await _catalogItemsRepository.SaveChangesAsync();

        return (new CatalogItemResponse(item.Id, item.CollectionId, item.Identifier, item.Name, item.Description,
            item.ReleaseDate, item.Manufacturer, item.ReferenceCode, item.Image, item.Rarity,
            item.CustomFieldValues.Select(f => new CustomFieldValueDto(f.Name, f.Value)).ToList(),
            null), false, null);
    }

    public async Task<(CatalogItemResponse? Response, bool NotFound, string? Error)> UpdateAsync(
        int collectionId, int id, string userId, UpdateCatalogItemRequest request)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdWithTypeAsync(collectionId, userId);
        if (collection == null) return (null, true, null);

        var item = await _catalogItemsRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (item == null) return (null, true, null);

        item.Name = request.Name ?? item.Name;
        item.Identifier = request.Identifier ?? item.Identifier;
        item.Description = request.Description;
        item.ReleaseDate = request.ReleaseDate;
        item.Manufacturer = request.Manufacturer;
        item.ReferenceCode = request.ReferenceCode;
        item.Rarity = request.Rarity;
        if (request.CustomFieldValues != null)
        {
            // Filter out fields that no longer exist in the schema
            var schema = collection.CollectionType.CustomFieldSchema;
            var schemaFieldNames = schema.Select(f => f.Name).ToHashSet();
            item.CustomFieldValues = request.CustomFieldValues
                .Where(fv => schemaFieldNames.Contains(fv.Name))
                .Select(f => new CustomFieldValue
                {
                    Name = f.Name,
                    Value = f.Value
                }).ToList();
        }

        await _catalogItemsRepository.SaveChangesAsync();

        return (new CatalogItemResponse(item.Id, item.CollectionId, item.Identifier, item.Name,
            item.Description, item.ReleaseDate, item.Manufacturer, item.ReferenceCode, item.Image, item.Rarity,
            item.CustomFieldValues.Select(f => new CustomFieldValueDto(f.Name, f.Value)).ToList(),
            null), false, null);
    }

    public async Task<bool?> DeleteAsync(int collectionId, int id, string userId)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return null;

        var item = await _catalogItemsRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (item == null) return false;

        _catalogItemsRepository.Remove(item);
        await _catalogItemsRepository.SaveChangesAsync();
        return true;
    }

    public async Task<(string? ImageUrl, bool NotFound, string? Error)> UploadImageAsync(
        int collectionId, int id, string userId, IFormFile file, string webRootPath)
    {
        var collection = await _collectionsRepository.GetByIdAndUserIdAsync(collectionId, userId);
        if (collection == null) return (null, true, null);

        var item = await _catalogItemsRepository.GetByIdAndCollectionIdAsync(id, collectionId);
        if (item == null) return (null, true, null);

        if (file.Length == 0)
            return (null, false, "No image file provided");

        var uploadsDir = Path.Combine(webRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var extension = Path.GetExtension(file.FileName);
        var fileName = $"catalogitem-{id}{extension}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        item.Image = $"/uploads/{fileName}";
        await _catalogItemsRepository.SaveChangesAsync();

        return (item.Image, false, null);
    }
}
