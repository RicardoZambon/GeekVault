using GeekVault.Api.Entities.Admin;

namespace GeekVault.Api.Repositories.Admin;

public interface IAuditLogRepository
{
    Task LogAsync(AuditLog entry);
    Task<(List<AuditLog> Items, int TotalCount)> GetPagedAsync(AuditLogFilter filter, int page, int pageSize);
    Task<List<AuditLog>> GetAllFilteredAsync(AuditLogFilter filter);
}

public class AuditLogFilter
{
    public string? Search { get; set; }
    public string? Action { get; set; }
    public string? UserId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
