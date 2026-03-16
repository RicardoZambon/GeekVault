namespace GeekVault.Api.DTOs.Vault;

public record CreateCollectionRequest(string Name, string? Description, int CollectionTypeId, string? Visibility);
public record UpdateCollectionRequest(string? Name, string? Description, string? Visibility);
public record CollectionResponse(int Id, string Name, string? Description, string? CoverImage, string Visibility, int CollectionTypeId, string CollectionTypeName, int ItemCount, int OwnedCount, double CompletionPercentage, DateTime CreatedAt, DateTime? UpdatedAt);
public record ReorderCollectionsRequest(List<int> CollectionIds);
