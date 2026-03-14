namespace GeekVault.Api.DTOs.Vault;

public record CreateWishlistItemRequest(string Name, int? CatalogItemId, int Priority, decimal? TargetPrice, string? Notes);
public record UpdateWishlistItemRequest(string? Name, int? CatalogItemId, int? Priority, decimal? TargetPrice, string? Notes);
public record WishlistItemResponse(int Id, int CollectionId, int? CatalogItemId, string Name, int Priority, decimal? TargetPrice, string? Notes);
