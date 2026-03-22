using GeekVault.Api.Data;
using GeekVault.Api.Entities.Admin;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Repositories.Admin;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly ApplicationDbContext _db;

    public AuditLogRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(AuditLog entry)
    {
        _db.AuditLogs.Add(entry);
        await _db.SaveChangesAsync();
    }

    public async Task<(List<AuditLog> Items, int TotalCount)> GetPagedAsync(AuditLogFilter filter, int page, int pageSize)
    {
        var query = ApplyFilter(_db.AuditLogs.AsQueryable(), filter);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<List<AuditLog>> GetAllFilteredAsync(AuditLogFilter filter)
    {
        var query = ApplyFilter(_db.AuditLogs.AsQueryable(), filter);

        return await query
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();
    }

    private static IQueryable<AuditLog> ApplyFilter(IQueryable<AuditLog> query, AuditLogFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(a =>
                a.Action.ToLower().Contains(search) ||
                a.TargetType.ToLower().Contains(search) ||
                (a.TargetId != null && a.TargetId.ToLower().Contains(search)) ||
                (a.Details != null && a.Details.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(filter.Action))
            query = query.Where(a => a.Action == filter.Action);

        if (!string.IsNullOrWhiteSpace(filter.UserId))
            query = query.Where(a => a.UserId == filter.UserId);

        if (filter.FromDate.HasValue)
            query = query.Where(a => a.Timestamp >= filter.FromDate.Value);

        if (filter.ToDate.HasValue)
            query = query.Where(a => a.Timestamp <= filter.ToDate.Value);

        return query;
    }
}
