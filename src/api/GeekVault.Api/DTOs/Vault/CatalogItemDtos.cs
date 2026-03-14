namespace GeekVault.Api.DTOs.Vault;

public record CreateCatalogItemRequest(string Identifier, string Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto>? CustomFieldValues);
public record UpdateCatalogItemRequest(string? Identifier, string? Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto>? CustomFieldValues);
public record CatalogItemResponse(int Id, int CollectionId, string Identifier, string Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto> CustomFieldValues, List<OwnedCopyDto>? OwnedCopies);
