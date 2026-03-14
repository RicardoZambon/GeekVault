namespace GeekVault.Api.Models;

public class CollectionType
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public List<CustomFieldDefinition> CustomFieldSchema { get; set; } = new();

    public ApplicationUser User { get; set; } = null!;
}
