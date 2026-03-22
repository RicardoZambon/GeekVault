namespace GeekVault.Api.DTOs.Admin;

public record AuditLogEntryResponse(
    int Id,
    DateTime Timestamp,
    string UserId,
    string Action,
    string TargetType,
    string? TargetId,
    string? Details,
    string? IpAddress);

public record AuditLogListResponse(
    List<AuditLogEntryResponse> Items,
    int TotalCount,
    int Page,
    int PageSize);

public record AuditLogFilterRequest(
    string? Search,
    string? Action,
    string? UserId,
    DateTime? FromDate,
    DateTime? ToDate);
