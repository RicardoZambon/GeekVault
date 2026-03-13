using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace GeekVault.Api.Tests;

public class CatalogItemSearchTests : IClassFixture<TestFactory<CatalogItemSearchTests>>
{
    private readonly TestFactory<CatalogItemSearchTests> _factory;

    public CatalogItemSearchTests(TestFactory<CatalogItemSearchTests> factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, int CollectionId)> CreateClientWithItemsAsync(string email)
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

        var ctResponse = await client.PostAsJsonAsync("/api/collection-types", new { Name = "Cards" });
        ctResponse.EnsureSuccessStatusCode();
        var ct = await ctResponse.Content.ReadFromJsonAsync<CollectionTypeResult>();

        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Test Collection",
            CollectionTypeId = ct!.Id
        });
        colResponse.EnsureSuccessStatusCode();
        var col = await colResponse.Content.ReadFromJsonAsync<CollectionResult>();
        var colId = col!.Id;

        // Create 5 items
        var items = new[]
        {
            new { Identifier = "C-001", Name = "Alpha Card", Description = "First card", Rarity = "Common", ReleaseDate = "2020-01-01" },
            new { Identifier = "C-002", Name = "Beta Card", Description = "Second card", Rarity = "Rare", ReleaseDate = "2021-06-15" },
            new { Identifier = "C-003", Name = "Gamma Card", Description = "A powerful item", Rarity = "Ultra Rare", ReleaseDate = "2019-03-20" },
            new { Identifier = "C-004", Name = "Delta Card", Description = "Another alpha variant", Rarity = "Common", ReleaseDate = "2022-12-01" },
            new { Identifier = "C-005", Name = "Epsilon Card", Description = "The rarest find", Rarity = "Legendary", ReleaseDate = "2023-07-04" },
        };

        foreach (var item in items)
        {
            var r = await client.PostAsJsonAsync($"/api/collections/{colId}/items", item);
            r.EnsureSuccessStatusCode();
        }

        return (client, colId);
    }

    [Fact]
    public async Task Search_ByName_ReturnsMatchingItems()
    {
        var (client, colId) = await CreateClientWithItemsAsync("search-name@example.com");
        var response = await client.GetAsync($"/api/collections/{colId}/items?search=Beta");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
        Assert.Equal("Beta Card", result.Items[0].Name);
    }

    [Fact]
    public async Task Search_ByDescription_ReturnsMatchingItems()
    {
        var (client, colId) = await CreateClientWithItemsAsync("search-desc@example.com");
        var response = await client.GetAsync($"/api/collections/{colId}/items?search=alpha");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        // "Alpha Card" (name) + "Delta Card" (description contains "alpha")
        Assert.Equal(2, result.TotalCount);
    }

    [Fact]
    public async Task Filter_ByOwnedStatus_Owned_ReturnsOnlyOwned()
    {
        var (client, colId) = await CreateClientWithItemsAsync("filter-owned@example.com");

        // Get items to find an ID
        var listResp = await client.GetAsync($"/api/collections/{colId}/items");
        var list = await listResp.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        var firstItemId = list!.Items[0].Id;

        // Add an owned copy for the first item
        await client.PostAsJsonAsync($"/api/items/{firstItemId}/copies", new
        {
            Condition = "Mint"
        });

        var response = await client.GetAsync($"/api/collections/{colId}/items?ownedStatus=owned");
        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
    }

    [Fact]
    public async Task Filter_ByOwnedStatus_Unowned_ExcludesOwned()
    {
        var (client, colId) = await CreateClientWithItemsAsync("filter-unowned@example.com");

        var listResp = await client.GetAsync($"/api/collections/{colId}/items");
        var list = await listResp.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        var firstItemId = list!.Items[0].Id;

        await client.PostAsJsonAsync($"/api/items/{firstItemId}/copies", new { Condition = "Good" });

        var response = await client.GetAsync($"/api/collections/{colId}/items?ownedStatus=unowned");
        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        Assert.Equal(4, result.TotalCount);
    }

    [Fact]
    public async Task Filter_ByCondition_ReturnsItemsWithMatchingCopies()
    {
        var (client, colId) = await CreateClientWithItemsAsync("filter-condition@example.com");

        var listResp = await client.GetAsync($"/api/collections/{colId}/items");
        var list = await listResp.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        var itemId1 = list!.Items[0].Id;
        var itemId2 = list.Items[1].Id;

        await client.PostAsJsonAsync($"/api/items/{itemId1}/copies", new { Condition = "Mint" });
        await client.PostAsJsonAsync($"/api/items/{itemId2}/copies", new { Condition = "Good" });

        var response = await client.GetAsync($"/api/collections/{colId}/items?condition=Mint");
        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
    }

    [Fact]
    public async Task Sort_ByName_Ascending()
    {
        var (client, colId) = await CreateClientWithItemsAsync("sort-name-asc@example.com");
        var response = await client.GetAsync($"/api/collections/{colId}/items?sortBy=name&sortDir=asc");

        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        Assert.Equal(5, result.Items.Count);
        Assert.Equal("Alpha Card", result.Items[0].Name);
        Assert.Equal("Gamma Card", result.Items[4].Name);
    }

    [Fact]
    public async Task Sort_ByName_Descending()
    {
        var (client, colId) = await CreateClientWithItemsAsync("sort-name-desc@example.com");
        var response = await client.GetAsync($"/api/collections/{colId}/items?sortBy=name&sortDir=desc");

        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        Assert.Equal("Gamma Card", result.Items[0].Name);
        Assert.Equal("Alpha Card", result.Items[4].Name);
    }

    [Fact]
    public async Task Pagination_ReturnsCorrectPage()
    {
        var (client, colId) = await CreateClientWithItemsAsync("pagination@example.com");
        var response = await client.GetAsync($"/api/collections/{colId}/items?page=2&pageSize=2&sortBy=name&sortDir=asc");

        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(2, result.Page);
        Assert.Equal(2, result.PageSize);
        Assert.Equal(2, result.Items.Count);
        // Page 2 with sort by name asc, pageSize=2: Alpha, Beta | Delta, Epsilon | Gamma
        Assert.Equal("Delta Card", result.Items[0].Name);
        Assert.Equal("Epsilon Card", result.Items[1].Name);
    }

    [Fact]
    public async Task Pagination_DefaultValues()
    {
        var (client, colId) = await CreateClientWithItemsAsync("pagination-default@example.com");
        var response = await client.GetAsync($"/api/collections/{colId}/items");

        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.Equal(20, result.PageSize);
        Assert.Equal(5, result.Items.Count);
    }

    [Fact]
    public async Task Requires_Authentication()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/collections/1/items?search=test");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record CollectionTypeResult(int Id, string Name);
    private record CollectionResult(int Id, string Name);
    private record CatalogItemResult(int Id, int CollectionId, string Identifier, string Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity);
    private record PaginatedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);
}
