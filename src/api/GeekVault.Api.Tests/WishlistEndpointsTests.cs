using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace GeekVault.Api.Tests;

public class WishlistEndpointsTests : IClassFixture<TestFactory<WishlistEndpointsTests>>
{
    private readonly TestFactory<WishlistEndpointsTests> _factory;

    public WishlistEndpointsTests(TestFactory<WishlistEndpointsTests> factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, int CollectionId)> CreateAuthenticatedClientWithCollectionAsync(string email)
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

        return (client, col!.Id);
    }

    [Fact]
    public async Task ListWishlist_Empty_ReturnsEmptyList()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("wishlist-list@example.com");
        var response = await client.GetAsync($"/api/collections/{collectionId}/wishlist");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<List<WishlistResult>>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    [Fact]
    public async Task CreateWishlistItem_ReturnsCreated()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("wishlist-create@example.com");
        var response = await client.PostAsJsonAsync($"/api/collections/{collectionId}/wishlist", new
        {
            Name = "Rare Card",
            Priority = 1,
            TargetPrice = 29.99m,
            Notes = "Limited edition"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<WishlistResult>();
        Assert.NotNull(item);
        Assert.Equal("Rare Card", item.Name);
        Assert.Equal(1, item.Priority);
        Assert.Equal(29.99m, item.TargetPrice);
        Assert.Equal("Limited edition", item.Notes);
    }

    [Fact]
    public async Task ListWishlist_OrderedByPriority()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("wishlist-order@example.com");

        await client.PostAsJsonAsync($"/api/collections/{collectionId}/wishlist", new { Name = "Low Priority", Priority = 3 });
        await client.PostAsJsonAsync($"/api/collections/{collectionId}/wishlist", new { Name = "High Priority", Priority = 1 });
        await client.PostAsJsonAsync($"/api/collections/{collectionId}/wishlist", new { Name = "Mid Priority", Priority = 2 });

        var response = await client.GetAsync($"/api/collections/{collectionId}/wishlist");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<List<WishlistResult>>();
        Assert.NotNull(items);
        Assert.Equal(3, items.Count);
        Assert.Equal("High Priority", items[0].Name);
        Assert.Equal("Mid Priority", items[1].Name);
        Assert.Equal("Low Priority", items[2].Name);
    }

    [Fact]
    public async Task UpdateWishlistItem_ReturnsOk()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("wishlist-update@example.com");
        var createResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/wishlist", new
        {
            Name = "Original",
            Priority = 1
        });
        var created = await createResponse.Content.ReadFromJsonAsync<WishlistResult>();

        var response = await client.PutAsJsonAsync($"/api/collections/{collectionId}/wishlist/{created!.Id}", new
        {
            Name = "Updated",
            Priority = 5,
            TargetPrice = 50.00m,
            Notes = "Updated notes"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<WishlistResult>();
        Assert.NotNull(item);
        Assert.Equal("Updated", item.Name);
        Assert.Equal(5, item.Priority);
        Assert.Equal(50.00m, item.TargetPrice);
    }

    [Fact]
    public async Task DeleteWishlistItem_ReturnsNoContent()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("wishlist-delete@example.com");
        var createResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/wishlist", new
        {
            Name = "To Delete",
            Priority = 1
        });
        var created = await createResponse.Content.ReadFromJsonAsync<WishlistResult>();

        var response = await client.DeleteAsync($"/api/collections/{collectionId}/wishlist/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify deleted
        var listResponse = await client.GetAsync($"/api/collections/{collectionId}/wishlist");
        var items = await listResponse.Content.ReadFromJsonAsync<List<WishlistResult>>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    [Fact]
    public async Task WishlistEndpoints_RequireAuth()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/collections/1/wishlist");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task WishlistEndpoints_WrongCollection_ReturnsNotFound()
    {
        var (client, _) = await CreateAuthenticatedClientWithCollectionAsync("wishlist-wrong@example.com");
        var response = await client.GetAsync("/api/collections/99999/wishlist");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task WishlistEndpoints_OwnershipCheck()
    {
        var (client1, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("wishlist-owner1@example.com");
        await client1.PostAsJsonAsync($"/api/collections/{collectionId}/wishlist", new { Name = "Secret Item", Priority = 1 });

        // Register a second user
        var client2 = _factory.CreateClient();
        var regResponse = await client2.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "wishlist-owner2@example.com",
            Password = "Test@123456",
            DisplayName = "User 2"
        });
        var auth2 = await regResponse.Content.ReadFromJsonAsync<AuthResult>();
        client2.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth2!.Token);

        // User2 should not see User1's collection wishlist
        var response = await client2.GetAsync($"/api/collections/{collectionId}/wishlist");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record IdResult(int Id);
    private record WishlistResult(int Id, int CollectionId, int? CatalogItemId, string Name, int Priority, decimal? TargetPrice, string? Notes);
}
