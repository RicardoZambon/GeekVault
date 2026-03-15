using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace GeekVault.Api.Tests;

public class CatalogItemEndpointsTests : IClassFixture<TestFactory<CatalogItemEndpointsTests>>
{
    private readonly TestFactory<CatalogItemEndpointsTests> _factory;

    public CatalogItemEndpointsTests(TestFactory<CatalogItemEndpointsTests> factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, int CollectionId)> CreateAuthenticatedClientWithCollectionAsync(
        string email, bool withCustomFields = false)
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
        object ctPayload = withCustomFields
            ? new
            {
                Name = "Cards",
                CustomFields = new[]
                {
                    new { Name = "Condition", Type = "enum", Required = true, Options = new[] { "Mint", "Good" } },
                    new { Name = "Year", Type = "number", Required = false, Options = (string[]?)null }
                }
            }
            : (object)new { Name = "General" };

        var ctResponse = await client.PostAsJsonAsync("/api/collection-types", ctPayload);
        ctResponse.EnsureSuccessStatusCode();
        var ct = await ctResponse.Content.ReadFromJsonAsync<CollectionTypeResult>();

        // Create collection
        var colResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Test Collection",
            CollectionTypeId = ct!.Id
        });
        colResponse.EnsureSuccessStatusCode();
        var col = await colResponse.Content.ReadFromJsonAsync<CollectionResult>();

        return (client, col!.Id);
    }

    [Fact]
    public async Task ListCatalogItems_Empty_ReturnsEmptyList()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-list@example.com");
        var response = await client.GetAsync($"/api/collections/{colId}/items");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        Assert.Empty(result.Items);
    }

    [Fact]
    public async Task CreateCatalogItem_WithValidData_ReturnsCreated()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-create@example.com");
        var response = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new
        {
            Identifier = "CARD-001",
            Name = "Blue Eyes White Dragon",
            Description = "Rare card",
            Rarity = "Ultra Rare"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CatalogItemResult>();
        Assert.NotNull(item);
        Assert.Equal("Blue Eyes White Dragon", item.Name);
        Assert.Equal("CARD-001", item.Identifier);
        Assert.Equal(colId, item.CollectionId);
        Assert.True(item.Id > 0);
    }

    [Fact]
    public async Task CreateCatalogItem_WithCustomFields_ReturnsCreated()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-custom@example.com", withCustomFields: true);
        var response = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new
        {
            Identifier = "CARD-002",
            Name = "Dark Magician",
            CustomFieldValues = new[]
            {
                new { Name = "Condition", Value = "Mint" },
                new { Name = "Year", Value = "1999" }
            }
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CatalogItemResult>();
        Assert.NotNull(item);
        Assert.Equal(2, item.CustomFieldValues.Count);
    }

    [Fact]
    public async Task CreateCatalogItem_UnknownCustomField_ReturnsBadRequest()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-badfield@example.com", withCustomFields: true);
        var response = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new
        {
            Identifier = "CARD-003",
            Name = "Test",
            CustomFieldValues = new[]
            {
                new { Name = "NonExistent", Value = "value" }
            }
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateCatalogItem_MissingRequiredCustomField_ReturnsBadRequest()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-reqfield@example.com", withCustomFields: true);
        var response = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new
        {
            Identifier = "CARD-004",
            Name = "Test",
            CustomFieldValues = new[]
            {
                new { Name = "Year", Value = "2000" }
            }
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetCatalogItem_ReturnsItemWithOwnedCopies()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-get@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new
        {
            Identifier = "CARD-005",
            Name = "Red Eyes",
            Description = "Dragon card"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        var response = await client.GetAsync($"/api/collections/{colId}/items/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CatalogItemResult>();
        Assert.Equal("Red Eyes", item!.Name);
        Assert.NotNull(item.OwnedCopies);
        Assert.Empty(item.OwnedCopies);
    }

    [Fact]
    public async Task UpdateCatalogItem_UpdatesFields()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-update@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new
        {
            Identifier = "CARD-006",
            Name = "Original"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        var response = await client.PutAsJsonAsync($"/api/collections/{colId}/items/{created!.Id}", new
        {
            Name = "Updated",
            Description = "Updated description",
            Rarity = "Common"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CatalogItemResult>();
        Assert.Equal("Updated", item!.Name);
        Assert.Equal("Common", item.Rarity);
    }

    [Fact]
    public async Task DeleteCatalogItem_ReturnsNoContent()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-delete@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new
        {
            Identifier = "CARD-007",
            Name = "ToDelete"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        var response = await client.DeleteAsync($"/api/collections/{colId}/items/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getResponse = await client.GetAsync($"/api/collections/{colId}/items/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task CatalogItem_RequiresAuth()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/collections/1/items");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CatalogItem_WrongCollection_ReturnsNotFound()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-wrongcol@example.com");
        var response = await client.GetAsync("/api/collections/99999/items");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UploadImage_ReturnsImageUrl()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-upload@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new
        {
            Identifier = "IMG-001",
            Name = "Item With Image"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "image", "photo.png");

        var response = await client.PostAsync($"/api/collections/{colId}/items/{created!.Id}/image", content);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ImageUploadResult>();
        Assert.NotNull(result?.ImageUrl);
        Assert.Contains("/uploads/", result.ImageUrl);
    }

    [Fact]
    public async Task UploadImage_ThenGetItem_ShowsImage()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-img-persist@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new
        {
            Identifier = "IMG-002",
            Name = "Persist Image"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "image", "photo.png");
        await client.PostAsync($"/api/collections/{colId}/items/{created!.Id}/image", content);

        var response = await client.GetAsync($"/api/collections/{colId}/items/{created.Id}");
        var item = await response.Content.ReadFromJsonAsync<CatalogItemResult>();
        Assert.NotNull(item);
        Assert.NotNull(item.Image);
        Assert.Contains("/uploads/", item.Image);
    }

    [Fact]
    public async Task UploadImage_NoFile_ReturnsBadRequest()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-noimg@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new
        {
            Identifier = "IMG-003",
            Name = "No Image"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(Array.Empty<byte>());
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "image", "empty.png");
        var response = await client.PostAsync($"/api/collections/{colId}/items/{created!.Id}/image", content);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UploadImage_WrongItemId_ReturnsNotFound()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-wrongimg@example.com");

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "image", "photo.png");

        var response = await client.PostAsync($"/api/collections/{colId}/items/99999/image", content);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ReorderItems_UpdatesSortOrder()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-reorder@example.com");

        // Create 3 items
        var r1 = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new { Identifier = "R-001", Name = "Item A" });
        var item1 = await r1.Content.ReadFromJsonAsync<CatalogItemResult>();
        var r2 = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new { Identifier = "R-002", Name = "Item B" });
        var item2 = await r2.Content.ReadFromJsonAsync<CatalogItemResult>();
        var r3 = await client.PostAsJsonAsync($"/api/collections/{colId}/items", new { Identifier = "R-003", Name = "Item C" });
        var item3 = await r3.Content.ReadFromJsonAsync<CatalogItemResult>();

        // Reorder: C, A, B
        var reorderResponse = await client.PostAsJsonAsync($"/api/collections/{colId}/items/reorder", new
        {
            ItemIds = new[] { item3!.Id, item1!.Id, item2!.Id }
        });
        Assert.Equal(HttpStatusCode.NoContent, reorderResponse.StatusCode);

        // Verify order: first item should be C
        var listResponse = await client.GetAsync($"/api/collections/{colId}/items");
        var result = await listResponse.Content.ReadFromJsonAsync<PaginatedResult<CatalogItemResult>>();
        Assert.NotNull(result);
        Assert.Equal(3, result.Items.Count);
        Assert.Equal("Item C", result.Items[0].Name);
        Assert.Equal("Item A", result.Items[1].Name);
        Assert.Equal("Item B", result.Items[2].Name);
    }

    [Fact]
    public async Task ReorderItems_WrongCollection_ReturnsNotFound()
    {
        var (client, _) = await CreateAuthenticatedClientWithCollectionAsync("ci-reorder-404@example.com");
        var response = await client.PostAsJsonAsync("/api/collections/99999/items/reorder", new
        {
            ItemIds = new[] { 1, 2, 3 }
        });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ReorderItems_InvalidItemIds_ReturnsBadRequest()
    {
        var (client, colId) = await CreateAuthenticatedClientWithCollectionAsync("ci-reorder-bad@example.com");
        var response = await client.PostAsJsonAsync($"/api/collections/{colId}/items/reorder", new
        {
            ItemIds = new[] { 99998, 99999 }
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ReorderItems_RequiresAuth()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/collections/1/items/reorder", new
        {
            ItemIds = new[] { 1, 2 }
        });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record CollectionTypeResult(int Id, string Name);
    private record CollectionResult(int Id, string Name);
    private record CustomFieldValueResult(string Name, string Value);
    private record OwnedCopyResult(int Id, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes);
    private record CatalogItemResult(int Id, int CollectionId, string Identifier, string Name, string? Description, DateTime? ReleaseDate, string? Manufacturer, string? ReferenceCode, string? Image, string? Rarity, List<CustomFieldValueResult> CustomFieldValues, List<OwnedCopyResult>? OwnedCopies);
    private record PaginatedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);
    private record ImageUploadResult(string ImageUrl);
}
