using GeekVault.Api.Entities.Security;

namespace GeekVault.Api.Models;

public class Collection
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int CollectionTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImage { get; set; }
    public Visibility Visibility { get; set; } = Visibility.Private;

    public User User { get; set; } = null!;
    public CollectionType CollectionType { get; set; } = null!;
}
