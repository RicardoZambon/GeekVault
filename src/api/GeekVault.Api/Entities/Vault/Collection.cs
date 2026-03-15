using GeekVault.Api.Entities.Security;

namespace GeekVault.Api.Entities.Vault;

public class Collection
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int CollectionTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImage { get; set; }
    public Visibility Visibility { get; set; } = Visibility.Private;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public CollectionType CollectionType { get; set; } = null!;
}
