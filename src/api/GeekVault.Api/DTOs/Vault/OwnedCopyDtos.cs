namespace GeekVault.Api.DTOs.Vault;

public record OwnedCopyDto(int Id, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes, List<string> Images);
public record CreateOwnedCopyRequest(string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes);
public record UpdateOwnedCopyRequest(string? Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes);
public record OwnedCopyResponse(int Id, int CatalogItemId, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes, List<string> Images);
