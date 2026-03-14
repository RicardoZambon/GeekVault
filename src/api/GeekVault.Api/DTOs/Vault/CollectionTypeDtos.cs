namespace GeekVault.Api.DTOs.Vault;

public record CreateCollectionTypeRequest(string Name, string? Description, string? Icon, List<CustomFieldDto>? CustomFields);
public record UpdateCollectionTypeRequest(string? Name, string? Description, string? Icon, List<CustomFieldDto>? CustomFields);
public record CollectionTypeResponse(int Id, string Name, string? Description, string? Icon, List<CustomFieldDto> CustomFields);
