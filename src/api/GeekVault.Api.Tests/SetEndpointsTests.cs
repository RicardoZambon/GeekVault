using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace GeekVault.Api.Tests;

public class SetEndpointsTests : IClassFixture<TestFactory<SetEndpointsTests>>
{
    private readonly TestFactory<SetEndpointsTests> _factory;

    public SetEndpointsTests(TestFactory<SetEndpointsTests> factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, int CollectionId, int CatalogItemId)> CreateAuthenticatedClientWithCollectionAsync(string email)
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = email,
            Password = "Test@123456",
            DisplayName = "Test User"
        });
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResult>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        // Create collection type
        var ctResponse = await client.PostAsJsonAsync("/api/collection-types", new { Name = "General" });
        ctResponse.EnsureSuccessStatusCode();
        var ct = await ctResponse.Content.ReadFromJsonAsync<IdResult>();

        // Create collection
        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Test Collection",
            CollectionTypeId = ct!.Id
        });
        colResponse.EnsureSuccessStatusCode();
        var col = await colResponse.Content.ReadFromJsonAsync<IdResult>();

        // Create catalog item
        var itemResponse = await client.PostAsJsonAsync($"/api/collections/{col!.Id}/items", new
        {
            Identifier = "ITEM-001",
            Name = "Test Item"
        });
        itemResponse.EnsureSuccessStatusCode();
        var item = await itemResponse.Content.ReadFromJsonAsync<IdResult>();

        return (client, col.Id, item!.Id);
    }

    [Fact]
    public async Task ListSets_Empty_ReturnsEmptyList()
    {
        var (client, collectionId, _) = await CreateAuthenticatedClientWithCollectionAsync("set-list@example.com");
        var response = await client.GetAsync($"/api/collections/{collectionId}/sets");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var sets = await response.Content.ReadFromJsonAsync<List<SetResult>>();
        Assert.NotNull(sets);
        Assert.Empty(sets);
    }

    [Fact]
    public async Task CreateSet_ReturnsCreated()
    {
        var (client, collectionId, _) = await CreateAuthenticatedClientWithCollectionAsync("set-create@example.com");
        var response = await client.PostAsJsonAsync($"/api/collections/{collectionId}/sets", new
        {
            Name = "Series 1",
            ExpectedItemCount = 10
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var set = await response.Content.ReadFromJsonAsync<SetResult>();
        Assert.NotNull(set);
        Assert.Equal("Series 1", set.Name);
        Assert.Equal(10, set.ExpectedItemCount);
        Assert.True(set.Id > 0);
    }

    [Fact]
    public async Task GetSet_ReturnsSetWithItemsAndCompletion()
    {
        var (client, collectionId, catalogItemId) = await CreateAuthenticatedClientWithCollectionAsync("set-get@example.com");

        // Create set
        var createResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/sets", new
        {
            Name = "Complete Set",
            ExpectedItemCount = 2
        });
        var created = await createResponse.Content.ReadFromJsonAsync<SetResult>();

        // Add items to set
        await client.PostAsJsonAsync($"/api/collections/{collectionId}/sets/{created!.Id}/items", new[]
        {
            new { Name = "Item A", CatalogItemId = (int?)catalogItemId, SortOrder = (int?)1 },
            new { Name = "Item B", CatalogItemId = (int?)null, SortOrder = (int?)2 }
        });

        var response = await client.GetAsync($"/api/collections/{collectionId}/sets/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var set = await response.Content.ReadFromJsonAsync<SetResult>();
        Assert.NotNull(set);
        Assert.Equal("Complete Set", set.Name);
        Assert.NotNull(set.Items);
        Assert.Equal(2, set.Items.Count);
        Assert.Equal(0, set.CompletedCount); // No owned copies yet
        Assert.Equal(0, set.CompletionPercentage);
    }

    [Fact]
    public async Task GetSet_WithOwnedCopy_ShowsCompletion()
    {
        var (client, collectionId, catalogItemId) = await CreateAuthenticatedClientWithCollectionAsync("set-completion@example.com");

        // Create set with expected count of 2
        var createResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/sets", new
        {
            Name = "Completion Test",
            ExpectedItemCount = 2
        });
        var created = await createResponse.Content.ReadFromJsonAsync<SetResult>();

        // Add item linked to catalog item
        await client.PostAsJsonAsync($"/api/collections/{collectionId}/sets/{created!.Id}/items", new[]
        {
            new { Name = "Linked Item", CatalogItemId = catalogItemId, SortOrder = 1 }
        });

        // Add owned copy for the catalog item
        await client.PostAsJsonAsync($"/api/items/{catalogItemId}/copies", new { Condition = "Mint" });

        var response = await client.GetAsync($"/api/collections/{collectionId}/sets/{created.Id}");
        var set = await response.Content.ReadFromJsonAsync<SetResult>();

        Assert.Equal(1, set!.CompletedCount);
        Assert.Equal(50, set.CompletionPercentage);
    }

    [Fact]
    public async Task UpdateSet_UpdatesFields()
    {
        var (client, collectionId, _) = await CreateAuthenticatedClientWithCollectionAsync("set-update@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/sets", new
        {
            Name = "Old Name",
            ExpectedItemCount = 5
        });
        var created = await createResponse.Content.ReadFromJsonAsync<SetResult>();

        var response = await client.PutAsJsonAsync($"/api/collections/{collectionId}/sets/{created!.Id}", new
        {
            Name = "New Name",
            ExpectedItemCount = 10
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var set = await response.Content.ReadFromJsonAsync<SetResult>();
        Assert.Equal("New Name", set!.Name);
        Assert.Equal(10, set.ExpectedItemCount);
    }

    [Fact]
    public async Task DeleteSet_ReturnsNoContent()
    {
        var (client, collectionId, _) = await CreateAuthenticatedClientWithCollectionAsync("set-delete@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/sets", new
        {
            Name = "To Delete",
            ExpectedItemCount = 3
        });
        var created = await createResponse.Content.ReadFromJsonAsync<SetResult>();

        var response = await client.DeleteAsync($"/api/collections/{collectionId}/sets/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listResponse = await client.GetAsync($"/api/collections/{collectionId}/sets");
        var sets = await listResponse.Content.ReadFromJsonAsync<List<SetResult>>();
        Assert.Empty(sets!);
    }

    [Fact]
    public async Task AddSetItems_BulkAdd_ReturnsCreated()
    {
        var (client, collectionId, catalogItemId) = await CreateAuthenticatedClientWithCollectionAsync("set-bulkadd@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/sets", new
        {
            Name = "Bulk Set",
            ExpectedItemCount = 3
        });
        var created = await createResponse.Content.ReadFromJsonAsync<SetResult>();

        var response = await client.PostAsJsonAsync($"/api/collections/{collectionId}/sets/{created!.Id}/items", new[]
        {
            new { Name = "Item 1", CatalogItemId = (int?)catalogItemId, SortOrder = (int?)1 },
            new { Name = "Item 2", CatalogItemId = (int?)null, SortOrder = (int?)2 },
            new { Name = "Item 3", CatalogItemId = (int?)null, SortOrder = (int?)3 }
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<List<SetItemResult>>();
        Assert.NotNull(items);
        Assert.Equal(3, items!.Count);
    }

    [Fact]
    public async Task Sets_RequiresAuth()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/collections/1/sets");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Sets_WrongCollection_ReturnsNotFound()
    {
        var (client, _, _) = await CreateAuthenticatedClientWithCollectionAsync("set-wrongcol@example.com");
        var response = await client.GetAsync("/api/collections/99999/sets");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record IdResult(int Id);
    private record SetResult(int Id, int CollectionId, string Name, int ExpectedItemCount, List<SetItemResult>? Items, int? CompletedCount, double? CompletionPercentage);
    private record SetItemResult(int Id, int SetId, int? CatalogItemId, string Name, int SortOrder);
}
