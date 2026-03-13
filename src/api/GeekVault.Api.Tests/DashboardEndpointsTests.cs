using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace GeekVault.Api.Tests;

public class DashboardEndpointsTests : IClassFixture<TestFactory<DashboardEndpointsTests>>
{
    private readonly TestFactory<DashboardEndpointsTests> _factory;

    public DashboardEndpointsTests(TestFactory<DashboardEndpointsTests> factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string email)
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
        return client;
    }

    private async Task<(HttpClient Client, int CollectionId)> CreateAuthenticatedClientWithCollectionAsync(string email)
    {
        var client = await CreateAuthenticatedClientAsync(email);

        var ctResponse = await client.PostAsJsonAsync("/api/collection-types", new { Name = "General" });
        ctResponse.EnsureSuccessStatusCode();
        var ct = await ctResponse.Content.ReadFromJsonAsync<IdResult>();

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
    public async Task Dashboard_RequiresAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/dashboard");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Dashboard_EmptyUser_ReturnsZeros()
    {
        var client = await CreateAuthenticatedClientAsync("dash-empty@example.com");
        var response = await client.GetAsync("/api/dashboard");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dashboard = await response.Content.ReadFromJsonAsync<DashboardResult>();
        Assert.NotNull(dashboard);
        Assert.Equal(0, dashboard.TotalCollections);
        Assert.Equal(0, dashboard.TotalItems);
        Assert.Equal(0, dashboard.TotalOwnedCopies);
        Assert.Equal(0m, dashboard.TotalEstimatedValue);
        Assert.Equal(0m, dashboard.TotalInvested);
        Assert.Empty(dashboard.ItemsByCondition);
        Assert.Empty(dashboard.CollectionSummaries);
        Assert.Empty(dashboard.RecentAcquisitions);
    }

    [Fact]
    public async Task Dashboard_WithData_ReturnsCorrectTotals()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("dash-totals@example.com");

        // Create catalog item
        var itemResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/items", new
        {
            Identifier = "ITEM-001",
            Name = "Test Item",
            CustomFieldValues = Array.Empty<object>()
        });
        itemResponse.EnsureSuccessStatusCode();
        var item = await itemResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        // Create owned copy
        var copyResponse = await client.PostAsJsonAsync($"/api/items/{item!.Id}/copies", new
        {
            Condition = "Mint",
            PurchasePrice = 25.00m,
            EstimatedValue = 50.00m,
            AcquisitionDate = "2026-01-15",
            AcquisitionSource = "Store"
        });
        copyResponse.EnsureSuccessStatusCode();

        var response = await client.GetAsync("/api/dashboard");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dashboard = await response.Content.ReadFromJsonAsync<DashboardResult>();

        Assert.NotNull(dashboard);
        Assert.Equal(1, dashboard.TotalCollections);
        Assert.Equal(1, dashboard.TotalItems);
        Assert.Equal(1, dashboard.TotalOwnedCopies);
        Assert.Equal(50.00m, dashboard.TotalEstimatedValue);
        Assert.Equal(25.00m, dashboard.TotalInvested);
    }

    [Fact]
    public async Task Dashboard_ItemsByCondition_ReturnsBreakdown()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("dash-condition@example.com");

        // Create two catalog items with different conditions
        var item1Response = await client.PostAsJsonAsync($"/api/collections/{collectionId}/items", new
        {
            Identifier = "ITEM-001", Name = "Item 1", CustomFieldValues = Array.Empty<object>()
        });
        var item1 = await item1Response.Content.ReadFromJsonAsync<CatalogItemResult>();

        var item2Response = await client.PostAsJsonAsync($"/api/collections/{collectionId}/items", new
        {
            Identifier = "ITEM-002", Name = "Item 2", CustomFieldValues = Array.Empty<object>()
        });
        var item2 = await item2Response.Content.ReadFromJsonAsync<CatalogItemResult>();

        await client.PostAsJsonAsync($"/api/items/{item1!.Id}/copies", new { Condition = "Mint" });
        await client.PostAsJsonAsync($"/api/items/{item1.Id}/copies", new { Condition = "Mint" });
        await client.PostAsJsonAsync($"/api/items/{item2!.Id}/copies", new { Condition = "Good" });

        var response = await client.GetAsync("/api/dashboard");
        var dashboard = await response.Content.ReadFromJsonAsync<DashboardResult>();

        Assert.NotNull(dashboard);
        Assert.Equal(3, dashboard.TotalOwnedCopies);
        Assert.Contains(dashboard.ItemsByCondition, c => c.Condition == "Mint" && c.Count == 2);
        Assert.Contains(dashboard.ItemsByCondition, c => c.Condition == "Good" && c.Count == 1);
    }

    [Fact]
    public async Task Dashboard_CollectionSummaries_ReturnsPerCollection()
    {
        var client = await CreateAuthenticatedClientAsync("dash-summaries@example.com");

        var ctResponse = await client.PostAsJsonAsync("/api/collection-types", new { Name = "Type1" });
        var ct = await ctResponse.Content.ReadFromJsonAsync<IdResult>();

        // Create two collections
        var col1Response = await client.PostAsJsonAsync("/api/collections", new { Name = "Collection A", CollectionTypeId = ct!.Id });
        var col1 = await col1Response.Content.ReadFromJsonAsync<IdResult>();

        var col2Response = await client.PostAsJsonAsync("/api/collections", new { Name = "Collection B", CollectionTypeId = ct.Id });
        var col2 = await col2Response.Content.ReadFromJsonAsync<IdResult>();

        // Add item to collection A
        var itemResponse = await client.PostAsJsonAsync($"/api/collections/{col1!.Id}/items", new
        {
            Identifier = "A-001", Name = "Item A", CustomFieldValues = Array.Empty<object>()
        });
        var item = await itemResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        await client.PostAsJsonAsync($"/api/items/{item!.Id}/copies", new
        {
            Condition = "Excellent",
            EstimatedValue = 100.00m
        });

        var response = await client.GetAsync("/api/dashboard");
        var dashboard = await response.Content.ReadFromJsonAsync<DashboardResult>();

        Assert.NotNull(dashboard);
        Assert.Equal(2, dashboard.TotalCollections);
        Assert.Equal(2, dashboard.CollectionSummaries.Count);

        var colA = dashboard.CollectionSummaries.First(s => s.Name == "Collection A");
        Assert.Equal(1, colA.ItemCount);
        Assert.Equal(1, colA.OwnedCount);
        Assert.Equal(100.00m, colA.Value);

        var colB = dashboard.CollectionSummaries.First(s => s.Name == "Collection B");
        Assert.Equal(0, colB.ItemCount);
        Assert.Equal(0, colB.OwnedCount);
        Assert.Equal(0m, colB.Value);
    }

    [Fact]
    public async Task Dashboard_RecentAcquisitions_ReturnsLast10()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("dash-recent@example.com");

        // Create 12 items with owned copies
        for (int i = 1; i <= 12; i++)
        {
            var itemResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/items", new
            {
                Identifier = $"R-{i:D3}", Name = $"Recent Item {i}", CustomFieldValues = Array.Empty<object>()
            });
            var item = await itemResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

            await client.PostAsJsonAsync($"/api/items/{item!.Id}/copies", new
            {
                Condition = "Good",
                AcquisitionDate = $"2026-01-{i:D2}"
            });
        }

        var response = await client.GetAsync("/api/dashboard");
        var dashboard = await response.Content.ReadFromJsonAsync<DashboardResult>();

        Assert.NotNull(dashboard);
        Assert.Equal(10, dashboard.RecentAcquisitions.Count);
        // Most recent first
        Assert.Equal("Recent Item 12", dashboard.RecentAcquisitions[0].ItemName);
        Assert.Equal("Recent Item 3", dashboard.RecentAcquisitions[9].ItemName);
    }

    [Fact]
    public async Task Dashboard_DoesNotIncludeOtherUsersData()
    {
        // User 1 creates data
        var (client1, collectionId1) = await CreateAuthenticatedClientWithCollectionAsync("dash-user1@example.com");
        var itemResponse = await client1.PostAsJsonAsync($"/api/collections/{collectionId1}/items", new
        {
            Identifier = "U1-001", Name = "User1 Item", CustomFieldValues = Array.Empty<object>()
        });
        var item = await itemResponse.Content.ReadFromJsonAsync<CatalogItemResult>();
        await client1.PostAsJsonAsync($"/api/items/{item!.Id}/copies", new { Condition = "Mint", EstimatedValue = 999.00m });

        // User 2 checks dashboard
        var client2 = await CreateAuthenticatedClientAsync("dash-user2@example.com");
        var response = await client2.GetAsync("/api/dashboard");
        var dashboard = await response.Content.ReadFromJsonAsync<DashboardResult>();

        Assert.NotNull(dashboard);
        Assert.Equal(0, dashboard.TotalCollections);
        Assert.Equal(0, dashboard.TotalItems);
        Assert.Equal(0, dashboard.TotalOwnedCopies);
        Assert.Equal(0m, dashboard.TotalEstimatedValue);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record IdResult(int Id);
    private record CatalogItemResult(int Id, int CollectionId, string Identifier, string Name);
    private record DashboardResult(
        int TotalCollections, int TotalItems, int TotalOwnedCopies,
        decimal TotalEstimatedValue, decimal TotalInvested,
        List<ConditionCountResult> ItemsByCondition,
        List<CollectionSummaryResult> CollectionSummaries,
        List<RecentAcquisitionResult> RecentAcquisitions);
    private record ConditionCountResult(string Condition, int Count);
    private record CollectionSummaryResult(int Id, string Name, int ItemCount, int OwnedCount, decimal Value);
    private record RecentAcquisitionResult(int Id, string ItemName, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource);
}
