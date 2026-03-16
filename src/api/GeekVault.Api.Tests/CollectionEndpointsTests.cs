using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace GeekVault.Api.Tests;

public class CollectionEndpointsTests : IClassFixture<TestFactory<CollectionEndpointsTests>>
{
    private readonly TestFactory<CollectionEndpointsTests> _factory;

    public CollectionEndpointsTests(TestFactory<CollectionEndpointsTests> factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, int CollectionTypeId)> CreateAuthenticatedClientWithTypeAsync(string email)
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

        // Create a collection type for the user
        var ctResponse = await client.PostAsJsonAsync("/api/collection-types", new
        {
            Name = "Test Type",
            Description = "For testing"
        });
        ctResponse.EnsureSuccessStatusCode();
        var ct = await ctResponse.Content.ReadFromJsonAsync<CollectionTypeResult>();

        return (client, ct!.Id);
    }

    [Fact]
    public async Task ListCollections_Empty_ReturnsEmptyList()
    {
        var (client, _) = await CreateAuthenticatedClientWithTypeAsync("col-list@example.com");
        var response = await client.GetAsync("/api/collections");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var collections = await response.Content.ReadFromJsonAsync<List<CollectionResult>>();
        Assert.NotNull(collections);
        Assert.Empty(collections);
    }

    [Fact]
    public async Task CreateCollection_WithValidData_ReturnsCreated()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-create@example.com");
        var response = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "My Cards",
            Description = "Card collection",
            CollectionTypeId = typeId,
            Visibility = "Public"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var col = await response.Content.ReadFromJsonAsync<CollectionResult>();
        Assert.NotNull(col);
        Assert.Equal("My Cards", col.Name);
        Assert.Equal("Public", col.Visibility);
        Assert.Equal(typeId, col.CollectionTypeId);
        Assert.Equal("Test Type", col.CollectionTypeName);
        Assert.Equal(0, col.ItemCount);
        Assert.True(col.Id > 0);
        Assert.True(col.CreatedAt > DateTime.MinValue);
        Assert.Null(col.UpdatedAt);
    }

    [Fact]
    public async Task GetCollection_ReturnsCorrectCollection()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-get@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Comics",
            Description = "My comics",
            CollectionTypeId = typeId
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        var response = await client.GetAsync($"/api/collections/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var col = await response.Content.ReadFromJsonAsync<CollectionResult>();
        Assert.Equal("Comics", col!.Name);
        Assert.Equal(0, col.ItemCount);
    }

    [Fact]
    public async Task GetCollection_NotOwned_ReturnsNotFound()
    {
        var (client1, typeId1) = await CreateAuthenticatedClientWithTypeAsync("col-owner@example.com");
        var createResponse = await client1.PostAsJsonAsync("/api/collections", new
        {
            Name = "Private Collection",
            CollectionTypeId = typeId1
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        // Second user tries to access
        var (client2, _) = await CreateAuthenticatedClientWithTypeAsync("col-other@example.com");
        var response = await client2.GetAsync($"/api/collections/{created!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCollection_UpdatesFields()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-update@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Original",
            CollectionTypeId = typeId
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        var response = await client.PutAsJsonAsync($"/api/collections/{created!.Id}", new
        {
            Name = "Updated",
            Description = "Updated description",
            Visibility = "Public"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var col = await response.Content.ReadFromJsonAsync<CollectionResult>();
        Assert.Equal("Updated", col!.Name);
        Assert.Equal("Updated description", col.Description);
        Assert.Equal("Public", col.Visibility);
        Assert.NotNull(col.UpdatedAt);
    }

    [Fact]
    public async Task DeleteCollection_ReturnsNoContent()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-delete@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "ToDelete",
            CollectionTypeId = typeId
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        var response = await client.DeleteAsync($"/api/collections/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getResponse = await client.GetAsync($"/api/collections/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task UploadCover_ReturnsCoverUrl()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-cover@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "With Cover",
            CollectionTypeId = typeId
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 }); // PNG header bytes
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "cover", "cover.png");

        var response = await client.PostAsync($"/api/collections/{created!.Id}/cover", content);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<CoverResult>();
        Assert.NotNull(result?.CoverUrl);
        Assert.Contains("/uploads/", result.CoverUrl);
    }

    [Fact]
    public async Task UploadCover_ThenGetCollection_ShowsCoverImage()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-cover-persist@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Cover Persist",
            CollectionTypeId = typeId
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "cover", "cover.png");

        await client.PostAsync($"/api/collections/{created!.Id}/cover", content);

        var response = await client.GetAsync($"/api/collections/{created.Id}");
        var col = await response.Content.ReadFromJsonAsync<CollectionResult>();
        Assert.NotNull(col);
        Assert.NotNull(col.CoverImage);
        Assert.Contains("/uploads/", col.CoverImage);
    }

    [Fact]
    public async Task ListCollections_SortByNameAsc_ReturnsSortedByName()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-sort-name@example.com");

        await client.PostAsJsonAsync("/api/collections", new { Name = "Zebra", CollectionTypeId = typeId });
        await client.PostAsJsonAsync("/api/collections", new { Name = "Alpha", CollectionTypeId = typeId });
        await client.PostAsJsonAsync("/api/collections", new { Name = "Middle", CollectionTypeId = typeId });

        var response = await client.GetAsync("/api/collections?sortBy=name&sortDir=asc");
        var collections = await response.Content.ReadFromJsonAsync<List<CollectionResult>>();

        Assert.Equal(3, collections!.Count);
        Assert.Equal("Alpha", collections[0].Name);
        Assert.Equal("Middle", collections[1].Name);
        Assert.Equal("Zebra", collections[2].Name);
    }

    [Fact]
    public async Task ListCollections_SortByNameDesc_ReturnsSortedByNameDescending()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-sort-name-desc@example.com");

        await client.PostAsJsonAsync("/api/collections", new { Name = "Zebra", CollectionTypeId = typeId });
        await client.PostAsJsonAsync("/api/collections", new { Name = "Alpha", CollectionTypeId = typeId });
        await client.PostAsJsonAsync("/api/collections", new { Name = "Middle", CollectionTypeId = typeId });

        var response = await client.GetAsync("/api/collections?sortBy=name&sortDir=desc");
        var collections = await response.Content.ReadFromJsonAsync<List<CollectionResult>>();

        Assert.Equal(3, collections!.Count);
        Assert.Equal("Zebra", collections[0].Name);
        Assert.Equal("Middle", collections[1].Name);
        Assert.Equal("Alpha", collections[2].Name);
    }

    [Fact]
    public async Task ListCollections_SortByCreatedAt_ReturnsSortedByCreationDate()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-sort-created@example.com");

        await client.PostAsJsonAsync("/api/collections", new { Name = "First", CollectionTypeId = typeId });
        await client.PostAsJsonAsync("/api/collections", new { Name = "Second", CollectionTypeId = typeId });
        await client.PostAsJsonAsync("/api/collections", new { Name = "Third", CollectionTypeId = typeId });

        var response = await client.GetAsync("/api/collections?sortBy=createdAt&sortDir=desc");
        var collections = await response.Content.ReadFromJsonAsync<List<CollectionResult>>();

        Assert.Equal(3, collections!.Count);
        Assert.Equal("Third", collections[0].Name);
        Assert.Equal("Second", collections[1].Name);
        Assert.Equal("First", collections[2].Name);
    }

    [Fact]
    public async Task ListCollections_SortByUpdatedAt_ReturnsSortedByLastUpdate()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-sort-updated@example.com");

        var r1 = await client.PostAsJsonAsync("/api/collections", new { Name = "NoUpdate", CollectionTypeId = typeId });
        var c1 = await r1.Content.ReadFromJsonAsync<CollectionResult>();

        var r2 = await client.PostAsJsonAsync("/api/collections", new { Name = "Updated", CollectionTypeId = typeId });
        var c2 = await r2.Content.ReadFromJsonAsync<CollectionResult>();

        // Update the second collection so its UpdatedAt is set
        await client.PutAsJsonAsync($"/api/collections/{c2!.Id}", new { Name = "Updated" });

        var response = await client.GetAsync("/api/collections?sortBy=updatedAt&sortDir=desc");
        var collections = await response.Content.ReadFromJsonAsync<List<CollectionResult>>();

        Assert.Equal(2, collections!.Count);
        Assert.Equal("Updated", collections[0].Name);
    }

    [Fact]
    public async Task ListCollections_SortByItemCount_ReturnsSortedByItemCount()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-sort-items@example.com");

        var r1 = await client.PostAsJsonAsync("/api/collections", new { Name = "Empty", CollectionTypeId = typeId });
        var c1 = await r1.Content.ReadFromJsonAsync<CollectionResult>();

        var r2 = await client.PostAsJsonAsync("/api/collections", new { Name = "HasItems", CollectionTypeId = typeId });
        var c2 = await r2.Content.ReadFromJsonAsync<CollectionResult>();

        // Add items to the second collection
        await client.PostAsJsonAsync($"/api/collections/{c2!.Id}/items", new { Identifier = "ITEM-1", Name = "Item1" });
        await client.PostAsJsonAsync($"/api/collections/{c2.Id}/items", new { Identifier = "ITEM-2", Name = "Item2" });

        var response = await client.GetAsync("/api/collections?sortBy=itemCount&sortDir=desc");
        var collections = await response.Content.ReadFromJsonAsync<List<CollectionResult>>();

        Assert.Equal(2, collections!.Count);
        Assert.Equal("HasItems", collections[0].Name);
        Assert.Equal("Empty", collections[1].Name);
    }

    [Fact]
    public async Task ListCollections_DefaultSort_ReturnsSortedBySortOrder()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-sort-default@example.com");

        var r1 = await client.PostAsJsonAsync("/api/collections", new { Name = "Alpha", CollectionTypeId = typeId });
        var c1 = await r1.Content.ReadFromJsonAsync<CollectionResult>();
        var r2 = await client.PostAsJsonAsync("/api/collections", new { Name = "Beta", CollectionTypeId = typeId });
        var c2 = await r2.Content.ReadFromJsonAsync<CollectionResult>();
        var r3 = await client.PostAsJsonAsync("/api/collections", new { Name = "Gamma", CollectionTypeId = typeId });
        var c3 = await r3.Content.ReadFromJsonAsync<CollectionResult>();

        // Reorder all 3 in reverse-alphabetical order: Gamma, Beta, Alpha
        await client.PostAsJsonAsync("/api/collections/reorder", new
        {
            CollectionIds = new[] { c3!.Id, c2!.Id, c1!.Id }
        });

        // Default sort (no sortBy) should return by sortOrder, NOT alphabetical
        var response = await client.GetAsync("/api/collections");
        var collections = await response.Content.ReadFromJsonAsync<List<CollectionResult>>();

        Assert.Equal(3, collections!.Count);
        Assert.Equal("Gamma", collections[0].Name);
        Assert.Equal("Beta", collections[1].Name);
        Assert.Equal("Alpha", collections[2].Name);
    }

    [Fact]
    public async Task GetCollection_ReturnsCompletionPercentage()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-completion@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Completion Test",
            CollectionTypeId = typeId
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        // New collection should have 0 items, 0 owned, 0% completion
        Assert.Equal(0, created!.ItemCount);
        Assert.Equal(0, created.OwnedCount);
        Assert.Equal(0, created.CompletionPercentage);

        // Add 2 catalog items
        var item1Resp = await client.PostAsJsonAsync($"/api/collections/{created.Id}/items", new { Identifier = "COMP-1", Name = "Item1" });
        var item1 = await item1Resp.Content.ReadFromJsonAsync<CatalogItemResult>();
        await client.PostAsJsonAsync($"/api/collections/{created.Id}/items", new { Identifier = "COMP-2", Name = "Item2" });

        // Add 1 owned copy for item1
        await client.PostAsJsonAsync($"/api/items/{item1!.Id}/copies", new { Condition = "Mint" });

        // Get collection — should show 2 items, 1 owned, 50% completion
        var response = await client.GetAsync($"/api/collections/{created.Id}");
        var col = await response.Content.ReadFromJsonAsync<CollectionResult>();
        Assert.Equal(2, col!.ItemCount);
        Assert.Equal(1, col.OwnedCount);
        Assert.Equal(50, col.CompletionPercentage);
    }

    [Fact]
    public async Task ListCollections_ReturnsCompletionPercentage()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-completion-list@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Completion List Test",
            CollectionTypeId = typeId
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        // Add 3 items, own 1
        var item1Resp = await client.PostAsJsonAsync($"/api/collections/{created!.Id}/items", new { Identifier = "CL-1", Name = "Item1" });
        var item1 = await item1Resp.Content.ReadFromJsonAsync<CatalogItemResult>();
        await client.PostAsJsonAsync($"/api/collections/{created.Id}/items", new { Identifier = "CL-2", Name = "Item2" });
        await client.PostAsJsonAsync($"/api/collections/{created.Id}/items", new { Identifier = "CL-3", Name = "Item3" });

        await client.PostAsJsonAsync($"/api/items/{item1!.Id}/copies", new { Condition = "Mint" });

        var response = await client.GetAsync("/api/collections");
        var collections = await response.Content.ReadFromJsonAsync<List<CollectionResult>>();
        var col = collections!.First(c => c.Name == "Completion List Test");
        Assert.Equal(3, col.ItemCount);
        Assert.Equal(1, col.OwnedCount);
        Assert.Equal(33.3, col.CompletionPercentage);
    }

    [Fact]
    public async Task CoverFromItem_HappyPath_CopiesItemImageAsCollectionCover()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-cover-item@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "Cover From Item",
            CollectionTypeId = typeId
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        // Add a catalog item
        var itemResp = await client.PostAsJsonAsync($"/api/collections/{created!.Id}/items", new { Identifier = "CFI-1", Name = "Item1" });
        var item = await itemResp.Content.ReadFromJsonAsync<CatalogItemResult>();

        // Upload an image to the catalog item
        var imgContent = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        imgContent.Add(fileContent, "image", "item.png");
        var imgResp = await client.PostAsync($"/api/collections/{created.Id}/items/{item!.Id}/image", imgContent);
        imgResp.EnsureSuccessStatusCode();

        // Use item image as collection cover
        var response = await client.PostAsync($"/api/collections/{created.Id}/cover-from-item/{item.Id}", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<CoverResult>();
        Assert.NotNull(result?.CoverUrl);
        Assert.Contains("/uploads/", result.CoverUrl);

        // Verify the collection now has the cover
        var getResp = await client.GetAsync($"/api/collections/{created.Id}");
        var col = await getResp.Content.ReadFromJsonAsync<CollectionResult>();
        Assert.NotNull(col?.CoverImage);
        Assert.Contains("/uploads/", col.CoverImage);
    }

    [Fact]
    public async Task CoverFromItem_ItemNotInCollection_ReturnsNotFound()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-cover-item-notfound@example.com");

        var col1Resp = await client.PostAsJsonAsync("/api/collections", new { Name = "Col1", CollectionTypeId = typeId });
        var col1 = await col1Resp.Content.ReadFromJsonAsync<CollectionResult>();

        var col2Resp = await client.PostAsJsonAsync("/api/collections", new { Name = "Col2", CollectionTypeId = typeId });
        var col2 = await col2Resp.Content.ReadFromJsonAsync<CollectionResult>();

        // Add item to col2
        var itemResp = await client.PostAsJsonAsync($"/api/collections/{col2!.Id}/items", new { Identifier = "CFI-2", Name = "Item2" });
        var item = await itemResp.Content.ReadFromJsonAsync<CatalogItemResult>();

        // Try to use col2's item as col1's cover
        var response = await client.PostAsync($"/api/collections/{col1!.Id}/cover-from-item/{item!.Id}", null);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CoverFromItem_ItemHasNoImage_ReturnsNotFound()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-cover-item-noimg@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collections", new
        {
            Name = "No Image Test",
            CollectionTypeId = typeId
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionResult>();

        // Add item without uploading an image
        var itemResp = await client.PostAsJsonAsync($"/api/collections/{created!.Id}/items", new { Identifier = "CFI-3", Name = "NoImage" });
        var item = await itemResp.Content.ReadFromJsonAsync<CatalogItemResult>();

        var response = await client.PostAsync($"/api/collections/{created.Id}/cover-from-item/{item!.Id}", null);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ReorderCollections_UpdatesSortOrder()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-reorder@example.com");

        var r1 = await client.PostAsJsonAsync("/api/collections", new { Name = "First", CollectionTypeId = typeId });
        var c1 = await r1.Content.ReadFromJsonAsync<CollectionResult>();
        var r2 = await client.PostAsJsonAsync("/api/collections", new { Name = "Second", CollectionTypeId = typeId });
        var c2 = await r2.Content.ReadFromJsonAsync<CollectionResult>();
        var r3 = await client.PostAsJsonAsync("/api/collections", new { Name = "Third", CollectionTypeId = typeId });
        var c3 = await r3.Content.ReadFromJsonAsync<CollectionResult>();

        // Reorder: Third, First, Second
        var reorderResponse = await client.PostAsJsonAsync("/api/collections/reorder", new
        {
            CollectionIds = new[] { c3!.Id, c1!.Id, c2!.Id }
        });
        Assert.Equal(HttpStatusCode.NoContent, reorderResponse.StatusCode);

        // Default sort should now return in sortOrder: Third, First, Second
        var listResponse = await client.GetAsync("/api/collections");
        var collections = await listResponse.Content.ReadFromJsonAsync<List<CollectionResult>>();

        Assert.Equal(3, collections!.Count);
        Assert.Equal("Third", collections[0].Name);
        Assert.Equal("First", collections[1].Name);
        Assert.Equal("Second", collections[2].Name);
    }

    [Fact]
    public async Task ReorderCollections_DuplicateIds_ReturnsBadRequest()
    {
        var (client, typeId) = await CreateAuthenticatedClientWithTypeAsync("col-reorder-dup@example.com");

        var r1 = await client.PostAsJsonAsync("/api/collections", new { Name = "Col1", CollectionTypeId = typeId });
        var c1 = await r1.Content.ReadFromJsonAsync<CollectionResult>();

        var response = await client.PostAsJsonAsync("/api/collections/reorder", new
        {
            CollectionIds = new[] { c1!.Id, c1.Id }
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Collection_RequiresAuth()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/collections");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record CollectionTypeResult(int Id, string Name, string? Description, string? Icon);
    private record CollectionResult(int Id, string Name, string? Description, string? CoverImage, string Visibility, int CollectionTypeId, string CollectionTypeName, int ItemCount, int OwnedCount, double CompletionPercentage, DateTime CreatedAt, DateTime? UpdatedAt);
    private record CatalogItemResult(int Id, string Name, string? Identifier);
    private record CoverResult(string CoverUrl);
}
