namespace GeekVault.Api.Models;

public class Set
{
    public int Id { get; set; }
    public int CollectionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ExpectedItemCount { get; set; }

    public Collection Collection { get; set; } = null!;
}
