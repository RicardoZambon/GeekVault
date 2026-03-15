namespace GeekVault.Api.Extensions;

public static class FileValidationExtensions
{
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp"
    };

    public static bool IsValidImageFile(this IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        return AllowedImageExtensions.Contains(extension) && AllowedImageContentTypes.Contains(file.ContentType);
    }
}
