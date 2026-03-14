namespace GeekVault.Api.DTOs.Vault;

public record ImportRowDto(int RowNumber, string? Identifier, string? Name, string? Description, string? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueDto> CustomFields, List<string> Errors);
public record ImportPreviewResponse(string PreviewId, int TotalRows, int ValidRows, int ErrorRows, bool HasErrors, List<ImportRowDto> Rows);
public record ImportConfirmRequest(string PreviewId);
public record ImportConfirmResponse(int ImportedCount, int SkippedCount);
public record ImportResponse(int ImportedCount, int ErrorCount, List<ImportRowDto> Errors);
