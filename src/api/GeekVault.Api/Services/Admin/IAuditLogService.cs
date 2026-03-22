namespace GeekVault.Api.Services.Admin;

public interface IAuditLogService
{
    Task LogActionAsync(string userId, string action, string targetType, string? targetId = null, string? details = null, string? ipAddress = null);
}
