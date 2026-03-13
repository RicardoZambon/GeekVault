namespace GeekVault.Api.Models;

public class OwnedCopy
{
    public int Id { get; set; }
    public int CatalogItemId { get; set; }
    public Condition Condition { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? EstimatedValue { get; set; }
    public DateTime? AcquisitionDate { get; set; }
    public string? AcquisitionSource { get; set; }
    public string? Notes { get; set; }
    public List<OwnedCopyImage> Images { get; set; } = new();

    public CatalogItem CatalogItem { get; set; } = null!;
}
