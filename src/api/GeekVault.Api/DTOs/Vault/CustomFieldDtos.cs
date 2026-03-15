namespace GeekVault.Api.DTOs.Vault;

public record CustomFieldDto(string Name, string Type, bool Required, List<string>? Options);
public record CustomFieldValueDto(string Name, string Value);
