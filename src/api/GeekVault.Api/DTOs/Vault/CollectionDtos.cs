namespace GeekVault.Api.DTOs.Vault;

public record CreateCollectionRequest(string Name, string? Description, int CollectionTypeId, string? Visibility);
public record UpdateCollectionRequest(string? Name, string? Description, string? Visibility);
public record CollectionResponse(int Id, string Name, string? Description, string? CoverImage, string Visibility, int CollectionTypeId, int ItemCount, DateTime CreatedAt, DateTime? UpdatedAt);
