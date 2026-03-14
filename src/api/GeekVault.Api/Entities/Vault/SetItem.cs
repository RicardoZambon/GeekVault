namespace GeekVault.Api.Entities.Vault;

public class SetItem
{
    public int Id { get; set; }
    public int SetId { get; set; }
    public int? CatalogItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public Set Set { get; set; } = null!;
    public CatalogItem? CatalogItem { get; set; }
}
