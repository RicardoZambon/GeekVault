namespace GeekVault.Api.Entities.Vault;

public class CustomFieldDefinition
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // text, number, date, enum, boolean, image_url
    public bool Required { get; set; }
    public List<string>? Options { get; set; } // For enum type
}
