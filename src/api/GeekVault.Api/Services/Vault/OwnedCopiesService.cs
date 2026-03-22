using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Vault;
using GeekVault.Api.Extensions;
using GeekVault.Api.Repositories.Vault;
using GeekVault.Api.Services.Admin;

namespace GeekVault.Api.Services.Vault;

public class OwnedCopiesService : IOwnedCopiesService
{
    private readonly IOwnedCopiesRepository _ownedCopiesRepository;
    private readonly IAuditLogService _auditLogService;

    public OwnedCopiesService(IOwnedCopiesRepository ownedCopiesRepository, IAuditLogService auditLogService)
    {
        _ownedCopiesRepository = ownedCopiesRepository;
        _auditLogService = auditLogService;
    }

    public async Task<List<OwnedCopyResponse>?> GetAllAsync(int catalogItemId, string userId)
    {
        var item = await _ownedCopiesRepository.GetCatalogItemWithCollectionAsync(catalogItemId, userId);
        if (item == null) return null;

        var copies = await _ownedCopiesRepository.GetByCatalogItemIdAsync(catalogItemId);
        return copies.Select(oc => MapToResponse(oc)).ToList();
    }

    public async Task<(OwnedCopyResponse? Response, bool NotFound, string? Error)> CreateAsync(
        int catalogItemId, string userId, CreateOwnedCopyRequest request)
    {
        var item = await _ownedCopiesRepository.GetCatalogItemWithCollectionAsync(catalogItemId, userId);
        if (item == null) return (null, true, null);

        if (!Enum.TryParse<Condition>(request.Condition, true, out var condition))
            return (null, false, $"Invalid condition. Valid values: {string.Join(", ", Enum.GetNames<Condition>())}");

        var copy = new OwnedCopy
        {
            CatalogItemId = catalogItemId,
            Condition = condition,
            PurchasePrice = request.PurchasePrice,
            EstimatedValue = request.EstimatedValue,
            AcquisitionDate = request.AcquisitionDate,
            AcquisitionSource = request.AcquisitionSource,
            Notes = request.Notes,
        };

        item.Collection.UpdatedAt = DateTime.UtcNow;

        await _ownedCopiesRepository.AddAsync(copy);
        await _ownedCopiesRepository.SaveChangesAsync();

        await _auditLogService.LogActionAsync(userId, "Create", "OwnedCopy", copy.Id.ToString(), $"Created owned copy for catalog item {catalogItemId}");

        return (MapToResponse(copy), false, null);
    }

    public async Task<(OwnedCopyResponse? Response, bool NotFound, string? Error)> UpdateAsync(
        int catalogItemId, int id, string userId, UpdateOwnedCopyRequest request)
    {
        var item = await _ownedCopiesRepository.GetCatalogItemWithCollectionAsync(catalogItemId, userId);
        if (item == null) return (null, true, null);

        var copy = await _ownedCopiesRepository.GetByIdAndCatalogItemIdAsync(id, catalogItemId);
        if (copy == null) return (null, true, null);

        if (request.Condition != null)
        {
            if (!Enum.TryParse<Condition>(request.Condition, true, out var condition))
                return (null, false, $"Invalid condition. Valid values: {string.Join(", ", Enum.GetNames<Condition>())}");
            copy.Condition = condition;
        }

        copy.PurchasePrice = request.PurchasePrice;
        copy.EstimatedValue = request.EstimatedValue;
        copy.AcquisitionDate = request.AcquisitionDate;
        copy.AcquisitionSource = request.AcquisitionSource;
        copy.Notes = request.Notes;

        await _ownedCopiesRepository.SaveChangesAsync();

        return (MapToResponse(copy), false, null);
    }

    public async Task<bool?> DeleteAsync(int catalogItemId, int id, string userId)
    {
        var item = await _ownedCopiesRepository.GetCatalogItemWithCollectionAsync(catalogItemId, userId);
        if (item == null) return null;

        var copy = await _ownedCopiesRepository.GetByIdAndCatalogItemIdAsync(id, catalogItemId);
        if (copy == null) return false;

        item.Collection.UpdatedAt = DateTime.UtcNow;

        _ownedCopiesRepository.Remove(copy);
        await _ownedCopiesRepository.SaveChangesAsync();

        await _auditLogService.LogActionAsync(userId, "Delete", "OwnedCopy", id.ToString(), $"Deleted owned copy for catalog item {catalogItemId}");

        return true;
    }

    public async Task<(OwnedCopyResponse? Response, bool NotFound, string? Error)> UploadImageAsync(
        int catalogItemId, int copyId, string userId, IFormFile file, string webRootPath)
    {
        var item = await _ownedCopiesRepository.GetCatalogItemWithCollectionAsync(catalogItemId, userId);
        if (item == null) return (null, true, null);

        var copy = await _ownedCopiesRepository.GetByIdAndCatalogItemIdAsync(copyId, catalogItemId);
        if (copy == null) return (null, true, null);

        if (file.Length == 0)
            return (null, false, "No image file provided");

        if (!file.IsValidImageFile())
            return (null, false, "Invalid image file. Allowed types: jpg, jpeg, png, gif, webp");

        var uploadsDir = Path.Combine(webRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var extension = Path.GetExtension(file.FileName);
        var fileName = $"ownedcopy-{copyId}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{extension}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        copy.Images.Add(new OwnedCopyImage { Url = $"/uploads/{fileName}" });
        await _ownedCopiesRepository.SaveChangesAsync();

        return (MapToResponse(copy), false, null);
    }

    private static OwnedCopyResponse MapToResponse(OwnedCopy oc) =>
        new(oc.Id, oc.CatalogItemId, oc.Condition.ToString(),
            oc.PurchasePrice, oc.EstimatedValue, oc.AcquisitionDate, oc.AcquisitionSource, oc.Notes,
            oc.Images.Select(img => img.Url).ToList());
}
