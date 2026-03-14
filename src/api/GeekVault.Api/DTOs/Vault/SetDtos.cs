namespace GeekVault.Api.DTOs.Vault;

public record CreateSetRequest(string Name);
public record UpdateSetRequest(string? Name);
public record SetResponse(int Id, int CollectionId, string Name, int ExpectedItemCount, List<SetItemResponse>? Items, int? CompletedCount, double? CompletionPercentage);
public record CreateSetItemRequest(string Name, int? CatalogItemId, int? SortOrder);
public record SetItemResponse(int Id, int SetId, int? CatalogItemId, string Name, int SortOrder);
