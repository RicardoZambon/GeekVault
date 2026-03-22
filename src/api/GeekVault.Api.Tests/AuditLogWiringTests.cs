using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using GeekVault.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GeekVault.Api.Tests;

public class AuditLogWiringTests : IClassFixture<TestFactory<AuditLogWiringTests>>
{
    private readonly TestFactory<AuditLogWiringTests> _factory;

    public AuditLogWiringTests(TestFactory<AuditLogWiringTests> factory)
    {
        _factory = factory;
    }

    private ApplicationDbContext GetDbContext()
    {
        var scope = _factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    }

    private async Task<(HttpClient Client, string UserId, int CollectionTypeId)> CreateAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = email,
            Password = "Test@123456",
            DisplayName = "Test User"
        });
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AuthResult>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", result!.Token);

        var ctResponse = await client.PostAsJsonAsync("/api/collection-types", new
        {
            Name = "Test Type",
            Description = "For testing"
        });
        ctResponse.EnsureSuccessStatusCode();
        var ct = await ctResponse.Content.ReadFromJsonAsync<CollectionTypeResult>();

        return (client, result.UserId, ct!.Id);
    }

    [Fact]
    public async Task Register_CreatesAuditLog()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "audit-register@example.com",
            Password = "Test@123456",
            DisplayName = "Audit User"
        });
        response.EnsureSuccessStatusCode();

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a => a.Action == "Register" && a.Details!.Contains("audit-register@example.com"));
        Assert.NotNull(log);
        Assert.Equal("Register", log.Action);
        Assert.Equal("User", log.TargetType);
    }

    [Fact]
    public async Task Login_Success_CreatesAuditLog()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "audit-login@example.com",
            Password = "Test@123456",
            DisplayName = "Login User"
        });

        await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "audit-login@example.com",
            Password = "Test@123456"
        });

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a => a.Action == "Login" && a.Details!.Contains("audit-login@example.com"));
        Assert.NotNull(log);
        Assert.Equal("Login", log.Action);
        Assert.Equal("User", log.TargetType);
    }

    [Fact]
    public async Task Login_Failure_CreatesAuditLog()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "nonexistent@example.com",
            Password = "Wrong@123456"
        });

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a => a.Action == "LoginFailed" && a.Details!.Contains("nonexistent@example.com"));
        Assert.NotNull(log);
        Assert.Equal("LoginFailed", log.Action);
        Assert.Equal("anonymous", log.UserId);
    }

    [Fact]
    public async Task CreateCollection_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-col-create@example.com");

        var response = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Audit Collection",
            Description = "Test",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        response.EnsureSuccessStatusCode();

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Create" && a.TargetType == "Collection");
        Assert.NotNull(log);
        Assert.Contains("Audit Collection", log.Details!);
    }

    [Fact]
    public async Task UpdateCollection_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-col-update@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Before Update",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        var col = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        await client.PutAsJsonAsync($"/api/collections/{col!.Id}", new
        {
            Name = "After Update"
        });

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Update" && a.TargetType == "Collection");
        Assert.NotNull(log);
    }

    [Fact]
    public async Task DeleteCollection_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-col-delete@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "To Delete",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        var col = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        await client.DeleteAsync($"/api/collections/{col!.Id}");

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Delete" && a.TargetType == "Collection");
        Assert.NotNull(log);
        Assert.Contains("To Delete", log.Details!);
    }

    [Fact]
    public async Task CreateCatalogItem_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-item-create@example.com");

        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Item Collection",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        var col = await colResponse.Content.ReadFromJsonAsync<CollectionResult>();

        await client.PostAsJsonAsync($"/api/collections/{col!.Id}/items", new
        {
            Identifier = "ITEM-001",
            Name = "Audit Item"
        });

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Create" && a.TargetType == "CatalogItem");
        Assert.NotNull(log);
        Assert.Contains("Audit Item", log.Details!);
    }

    [Fact]
    public async Task DeleteCatalogItem_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-item-delete@example.com");

        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Item Del Collection",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        var col = await colResponse.Content.ReadFromJsonAsync<CollectionResult>();

        var itemResponse = await client.PostAsJsonAsync($"/api/collections/{col!.Id}/items", new
        {
            Identifier = "DEL-001",
            Name = "Delete Me"
        });
        var item = await itemResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        await client.DeleteAsync($"/api/collections/{col.Id}/items/{item!.Id}");

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Delete" && a.TargetType == "CatalogItem");
        Assert.NotNull(log);
    }

    [Fact]
    public async Task CreateOwnedCopy_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-copy-create@example.com");

        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Copy Collection",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        var col = await colResponse.Content.ReadFromJsonAsync<CollectionResult>();

        var itemResponse = await client.PostAsJsonAsync($"/api/collections/{col!.Id}/items", new
        {
            Identifier = "COPY-001",
            Name = "Copy Item"
        });
        var item = await itemResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        await client.PostAsJsonAsync($"/api/items/{item!.Id}/copies", new
        {
            Condition = "Mint"
        });

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Create" && a.TargetType == "OwnedCopy");
        Assert.NotNull(log);
    }

    [Fact]
    public async Task DeleteOwnedCopy_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-copy-delete@example.com");

        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Copy Del Collection",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        var col = await colResponse.Content.ReadFromJsonAsync<CollectionResult>();

        var itemResponse = await client.PostAsJsonAsync($"/api/collections/{col!.Id}/items", new
        {
            Identifier = "COPYD-001",
            Name = "Copy Del Item"
        });
        var item = await itemResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        var copyResponse = await client.PostAsJsonAsync($"/api/items/{item!.Id}/copies", new
        {
            Condition = "Good"
        });
        var copy = await copyResponse.Content.ReadFromJsonAsync<OwnedCopyResult>();

        await client.DeleteAsync($"/api/items/{item.Id}/copies/{copy!.Id}");

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Delete" && a.TargetType == "OwnedCopy");
        Assert.NotNull(log);
    }

    [Fact]
    public async Task CreateSet_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-set-create@example.com");

        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Set Collection",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        var col = await colResponse.Content.ReadFromJsonAsync<CollectionResult>();

        await client.PostAsJsonAsync($"/api/collections/{col!.Id}/sets", new
        {
            Name = "Audit Set"
        });

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Create" && a.TargetType == "Set");
        Assert.NotNull(log);
        Assert.Contains("Audit Set", log.Details!);
    }

    [Fact]
    public async Task DeleteSet_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-set-delete@example.com");

        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Set Del Collection",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        var col = await colResponse.Content.ReadFromJsonAsync<CollectionResult>();

        var setResponse = await client.PostAsJsonAsync($"/api/collections/{col!.Id}/sets", new
        {
            Name = "Delete Set"
        });
        var set = await setResponse.Content.ReadFromJsonAsync<SetResult>();

        await client.DeleteAsync($"/api/collections/{col.Id}/sets/{set!.Id}");

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Delete" && a.TargetType == "Set");
        Assert.NotNull(log);
    }

    [Fact]
    public async Task CreateWishlistItem_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-wish-create@example.com");

        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Wish Collection",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        var col = await colResponse.Content.ReadFromJsonAsync<CollectionResult>();

        await client.PostAsJsonAsync($"/api/collections/{col!.Id}/wishlist", new
        {
            Name = "Audit Wish",
            Priority = 1
        });

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Create" && a.TargetType == "WishlistItem");
        Assert.NotNull(log);
        Assert.Contains("Audit Wish", log.Details!);
    }

    [Fact]
    public async Task DeleteWishlistItem_CreatesAuditLog()
    {
        var (client, userId, typeId) = await CreateAuthenticatedClientAsync("audit-wish-delete@example.com");

        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Wish Del Collection",
            CollectionTypeId = typeId,
            Visibility = "Private"
        });
        var col = await colResponse.Content.ReadFromJsonAsync<CollectionResult>();

        var wishResponse = await client.PostAsJsonAsync($"/api/collections/{col!.Id}/wishlist", new
        {
            Name = "Delete Wish",
            Priority = 2
        });
        var wish = await wishResponse.Content.ReadFromJsonAsync<WishlistResult>();

        await client.DeleteAsync($"/api/collections/{col.Id}/wishlist/{wish!.Id}");

        var db = GetDbContext();
        var log = await db.AuditLogs.FirstOrDefaultAsync(a =>
            a.UserId == userId && a.Action == "Delete" && a.TargetType == "WishlistItem");
        Assert.NotNull(log);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record CollectionTypeResult(int Id, string Name);
    private record CollectionResult(int Id, string Name);
    private record CatalogItemResult(int Id, string Name);
    private record OwnedCopyResult(int Id, int CatalogItemId, string Condition);
    private record SetResult(int Id, string Name);
    private record WishlistResult(int Id, string Name);
}
