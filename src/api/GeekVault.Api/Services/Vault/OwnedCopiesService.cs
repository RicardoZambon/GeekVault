using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Entities.Vault;
using GeekVault.Api.Repositories.Vault;

namespace GeekVault.Api.Services.Vault;

public class OwnedCopiesService : IOwnedCopiesService
{
    private readonly IOwnedCopiesRepository _ownedCopiesRepository;

    public OwnedCopiesService(IOwnedCopiesRepository ownedCopiesRepository)
    {
        _ownedCopiesRepository = ownedCopiesRepository;
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
            Images = request.Images?.Select(url => new OwnedCopyImage { Url = url }).ToList() ?? new()
        };

        await _ownedCopiesRepository.AddAsync(copy);
        await _ownedCopiesRepository.SaveChangesAsync();

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
        if (request.Images != null)
            copy.Images = request.Images.Select(url => new OwnedCopyImage { Url = url }).ToList();

        await _ownedCopiesRepository.SaveChangesAsync();

        return (MapToResponse(copy), false, null);
    }

    public async Task<bool?> DeleteAsync(int catalogItemId, int id, string userId)
    {
        var item = await _ownedCopiesRepository.GetCatalogItemWithCollectionAsync(catalogItemId, userId);
        if (item == null) return null;

        var copy = await _ownedCopiesRepository.GetByIdAndCatalogItemIdAsync(id, catalogItemId);
        if (copy == null) return false;

        _ownedCopiesRepository.Remove(copy);
        await _ownedCopiesRepository.SaveChangesAsync();
        return true;
    }

    private static OwnedCopyResponse MapToResponse(OwnedCopy oc) =>
        new(oc.Id, oc.CatalogItemId, oc.Condition.ToString(),
            oc.PurchasePrice, oc.EstimatedValue, oc.AcquisitionDate, oc.AcquisitionSource, oc.Notes,
            oc.Images.Select(img => img.Url).ToList());
}
