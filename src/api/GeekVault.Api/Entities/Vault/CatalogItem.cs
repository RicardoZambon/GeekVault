namespace GeekVault.Api.Entities.Vault;

public class CatalogItem
{
    public int Id { get; set; }
    public int CollectionId { get; set; }
    public string Identifier { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string? Manufacturer { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Image { get; set; }
    public string? Rarity { get; set; }
    public List<CustomFieldValue> CustomFieldValues { get; set; } = new();

    public Collection Collection { get; set; } = null!;
}
