using GeekVault.Api.Entities.Admin;
using GeekVault.Api.Repositories.Admin;

namespace GeekVault.Api.Services.Admin;

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _repository;

    public AuditLogService(IAuditLogRepository repository)
    {
        _repository = repository;
    }

    public async Task LogActionAsync(string userId, string action, string targetType, string? targetId = null, string? details = null, string? ipAddress = null)
    {
        var entry = new AuditLog
        {
            UserId = userId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            Details = details,
            IpAddress = ipAddress,
            Timestamp = DateTime.UtcNow
        };

        await _repository.LogAsync(entry);
    }
}
