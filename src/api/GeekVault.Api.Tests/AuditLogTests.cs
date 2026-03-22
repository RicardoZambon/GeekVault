using GeekVault.Api.Data;
using GeekVault.Api.Entities.Admin;
using GeekVault.Api.Repositories.Admin;
using GeekVault.Api.Services.Admin;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GeekVault.Api.Tests;

public class AuditLogTests : IClassFixture<TestFactory<AuditLogTests>>
{
    private readonly TestFactory<AuditLogTests> _factory;

    public AuditLogTests(TestFactory<AuditLogTests> factory)
    {
        _factory = factory;
    }

    private ApplicationDbContext GetDbContext()
    {
        var scope = _factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    }

    [Fact]
    public async Task LogAsync_CreatesAuditLogEntry()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);

        var entry = new AuditLog
        {
            UserId = "test-user-1",
            Action = "Create",
            TargetType = "Collection",
            TargetId = "42",
            Details = "{\"name\":\"My Collection\"}",
            IpAddress = "127.0.0.1"
        };

        await repository.LogAsync(entry);

        var saved = await db.AuditLogs.FirstOrDefaultAsync(a => a.UserId == "test-user-1");
        Assert.NotNull(saved);
        Assert.Equal("Create", saved.Action);
        Assert.Equal("Collection", saved.TargetType);
        Assert.Equal("42", saved.TargetId);
        Assert.Equal("{\"name\":\"My Collection\"}", saved.Details);
        Assert.Equal("127.0.0.1", saved.IpAddress);
    }

    [Fact]
    public async Task LogAsync_SetsTimestamp()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);

        var before = DateTime.UtcNow;
        await repository.LogAsync(new AuditLog
        {
            UserId = "test-user-ts",
            Action = "Update",
            TargetType = "CatalogItem"
        });
        var after = DateTime.UtcNow;

        var saved = await db.AuditLogs.FirstOrDefaultAsync(a => a.UserId == "test-user-ts");
        Assert.NotNull(saved);
        Assert.InRange(saved.Timestamp, before, after);
    }

    [Fact]
    public async Task GetPagedAsync_ReturnsPaginatedResults()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);

        for (int i = 0; i < 15; i++)
        {
            await repository.LogAsync(new AuditLog
            {
                UserId = "paged-user",
                Action = "Create",
                TargetType = "Item",
                TargetId = i.ToString()
            });
        }

        var filter = new AuditLogFilter { UserId = "paged-user" };
        var (items, totalCount) = await repository.GetPagedAsync(filter, page: 1, pageSize: 10);

        Assert.Equal(15, totalCount);
        Assert.Equal(10, items.Count);
    }

    [Fact]
    public async Task GetPagedAsync_SecondPageReturnsRemaining()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);

        for (int i = 0; i < 15; i++)
        {
            await repository.LogAsync(new AuditLog
            {
                UserId = "paged-user-2",
                Action = "Delete",
                TargetType = "OwnedCopy",
                TargetId = i.ToString()
            });
        }

        var filter = new AuditLogFilter { UserId = "paged-user-2" };
        var (items, totalCount) = await repository.GetPagedAsync(filter, page: 2, pageSize: 10);

        Assert.Equal(15, totalCount);
        Assert.Equal(5, items.Count);
    }

    [Fact]
    public async Task GetPagedAsync_FilterByAction()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);

        await repository.LogAsync(new AuditLog { UserId = "filter-action", Action = "Create", TargetType = "Collection" });
        await repository.LogAsync(new AuditLog { UserId = "filter-action", Action = "Delete", TargetType = "Collection" });
        await repository.LogAsync(new AuditLog { UserId = "filter-action", Action = "Create", TargetType = "Item" });

        var filter = new AuditLogFilter { UserId = "filter-action", Action = "Create" };
        var (items, totalCount) = await repository.GetPagedAsync(filter, page: 1, pageSize: 10);

        Assert.Equal(2, totalCount);
        Assert.All(items, a => Assert.Equal("Create", a.Action));
    }

    [Fact]
    public async Task GetPagedAsync_FilterBySearch()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);

        await repository.LogAsync(new AuditLog { UserId = "search-user", Action = "Create", TargetType = "Collection", Details = "{\"name\":\"Pokemon Cards\"}" });
        await repository.LogAsync(new AuditLog { UserId = "search-user", Action = "Create", TargetType = "WishlistItem", Details = "{\"name\":\"Magic Cards\"}" });

        var filter = new AuditLogFilter { UserId = "search-user", Search = "Pokemon" };
        var (items, totalCount) = await repository.GetPagedAsync(filter, page: 1, pageSize: 10);

        Assert.Equal(1, totalCount);
        Assert.Contains("Pokemon", items[0].Details!);
    }

    [Fact]
    public async Task GetPagedAsync_FilterByDateRange()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);

        var oldEntry = new AuditLog
        {
            UserId = "date-range-user",
            Action = "Create",
            TargetType = "Collection",
            Timestamp = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        var newEntry = new AuditLog
        {
            UserId = "date-range-user",
            Action = "Update",
            TargetType = "Collection",
            Timestamp = new DateTime(2026, 3, 15, 0, 0, 0, DateTimeKind.Utc)
        };

        await repository.LogAsync(oldEntry);
        await repository.LogAsync(newEntry);

        var filter = new AuditLogFilter
        {
            UserId = "date-range-user",
            FromDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        var (items, totalCount) = await repository.GetPagedAsync(filter, page: 1, pageSize: 10);

        Assert.Equal(1, totalCount);
        Assert.Equal("Update", items[0].Action);
    }

    [Fact]
    public async Task GetAllFilteredAsync_ReturnsAllMatchingEntries()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);

        for (int i = 0; i < 5; i++)
        {
            await repository.LogAsync(new AuditLog
            {
                UserId = "export-user",
                Action = "Create",
                TargetType = "Collection",
                TargetId = i.ToString()
            });
        }

        var filter = new AuditLogFilter { UserId = "export-user" };
        var items = await repository.GetAllFilteredAsync(filter);

        Assert.Equal(5, items.Count);
    }

    [Fact]
    public async Task GetPagedAsync_OrdersByTimestampDescending()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);

        await repository.LogAsync(new AuditLog
        {
            UserId = "order-user",
            Action = "First",
            TargetType = "Collection",
            Timestamp = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
        await repository.LogAsync(new AuditLog
        {
            UserId = "order-user",
            Action = "Second",
            TargetType = "Collection",
            Timestamp = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        var filter = new AuditLogFilter { UserId = "order-user" };
        var (items, _) = await repository.GetPagedAsync(filter, page: 1, pageSize: 10);

        Assert.Equal("Second", items[0].Action);
        Assert.Equal("First", items[1].Action);
    }

    [Fact]
    public async Task AuditLogService_LogActionAsync_CreatesEntry()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);
        var service = new AuditLogService(repository);

        await service.LogActionAsync(
            userId: "service-user",
            action: "Create",
            targetType: "Collection",
            targetId: "99",
            details: "{\"name\":\"Test\"}",
            ipAddress: "192.168.1.1");

        var saved = await db.AuditLogs.FirstOrDefaultAsync(a => a.UserId == "service-user");
        Assert.NotNull(saved);
        Assert.Equal("Create", saved.Action);
        Assert.Equal("Collection", saved.TargetType);
        Assert.Equal("99", saved.TargetId);
        Assert.Equal("{\"name\":\"Test\"}", saved.Details);
        Assert.Equal("192.168.1.1", saved.IpAddress);
    }

    [Fact]
    public async Task AuditLogService_LogActionAsync_WithOptionalNulls()
    {
        var db = GetDbContext();
        var repository = new AuditLogRepository(db);
        var service = new AuditLogService(repository);

        await service.LogActionAsync(
            userId: "minimal-user",
            action: "Login",
            targetType: "Auth");

        var saved = await db.AuditLogs.FirstOrDefaultAsync(a => a.UserId == "minimal-user");
        Assert.NotNull(saved);
        Assert.Equal("Login", saved.Action);
        Assert.Equal("Auth", saved.TargetType);
        Assert.Null(saved.TargetId);
        Assert.Null(saved.Details);
        Assert.Null(saved.IpAddress);
    }
}
