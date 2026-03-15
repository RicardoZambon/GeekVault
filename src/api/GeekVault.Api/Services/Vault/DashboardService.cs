using GeekVault.Api.DTOs.Vault;
using GeekVault.Api.Repositories.Vault;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Services.Vault;

public class DashboardService : IDashboardService
{
    private readonly ICollectionsRepository _collectionsRepository;
    private readonly IOwnedCopiesRepository _ownedCopiesRepository;
    private readonly ICatalogItemsRepository _catalogItemsRepository;

    public DashboardService(
        ICollectionsRepository collectionsRepository,
        IOwnedCopiesRepository ownedCopiesRepository,
        ICatalogItemsRepository catalogItemsRepository)
    {
        _collectionsRepository = collectionsRepository;
        _ownedCopiesRepository = ownedCopiesRepository;
        _catalogItemsRepository = catalogItemsRepository;
    }

    public async Task<DashboardResponse> GetDashboardAsync(string userId)
    {
        var summaries = await _collectionsRepository.GetCollectionSummariesAsync(userId);

        var totalCollections = summaries.Count;
        var totalItems = summaries.Sum(c => c.ItemCount);
        var totalOwnedCopies = summaries.Sum(c => c.OwnedCount);
        var totalEstimatedValue = summaries.Sum(c => c.Value);
        var totalInvested = summaries.Sum(c => c.Invested);

        var collectionSummaryDtos = summaries.Select(c =>
            new CollectionSummaryDto(c.Id, c.Name, c.ItemCount, c.OwnedCount, c.Value)).ToList();

        // Items by condition
        var userOwnedCopies = _ownedCopiesRepository.GetByUserCatalogItemIds(userId);
        var itemsByCondition = await userOwnedCopies
            .GroupBy(oc => oc.Condition)
            .Select(g => new ConditionCountDto(g.Key.ToString(), g.Count()))
            .ToListAsync();

        // Recent acquisitions (last 10)
        var recentAcquisitions = await userOwnedCopies
            .OrderByDescending(oc => oc.AcquisitionDate)
            .ThenByDescending(oc => oc.Id)
            .Take(10)
            .Join(
                _catalogItemsRepository.Query(),
                oc => oc.CatalogItemId,
                ci => ci.Id,
                (oc, ci) => new RecentAcquisitionDto(
                    oc.Id, ci.Name, oc.Condition.ToString(), oc.PurchasePrice, oc.EstimatedValue, oc.AcquisitionDate, oc.AcquisitionSource))
            .ToListAsync();

        return new DashboardResponse(
            totalCollections, totalItems, totalOwnedCopies, totalEstimatedValue, totalInvested,
            itemsByCondition, collectionSummaryDtos, recentAcquisitions);
    }
}
