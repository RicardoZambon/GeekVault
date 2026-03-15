namespace GeekVault.Api.DTOs.Vault;

public record ConditionCountDto(string Condition, int Count);
public record CollectionSummaryDto(int Id, string Name, int ItemCount, int OwnedCount, decimal Value);
public record RecentAcquisitionDto(int Id, string ItemName, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource);
public record DashboardResponse(int TotalCollections, int TotalItems, int TotalOwnedCopies, decimal TotalEstimatedValue, decimal TotalInvested, List<ConditionCountDto> ItemsByCondition, List<CollectionSummaryDto> CollectionSummaries, List<RecentAcquisitionDto> RecentAcquisitions);
