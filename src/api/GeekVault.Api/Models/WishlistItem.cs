namespace GeekVault.Api.Models;

public class WishlistItem
{
    public int Id { get; set; }
    public int CollectionId { get; set; }
    public int? CatalogItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Priority { get; set; }
    public decimal? TargetPrice { get; set; }
    public string? Notes { get; set; }

    public Collection Collection { get; set; } = null!;
    public CatalogItem? CatalogItem { get; set; }
}
