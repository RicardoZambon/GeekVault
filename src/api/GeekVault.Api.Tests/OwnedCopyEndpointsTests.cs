using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace GeekVault.Api.Tests;

public class OwnedCopyEndpointsTests : IClassFixture<TestFactory<OwnedCopyEndpointsTests>>
{
    private readonly TestFactory<OwnedCopyEndpointsTests> _factory;

    public OwnedCopyEndpointsTests(TestFactory<OwnedCopyEndpointsTests> factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, int CatalogItemId)> CreateAuthenticatedClientWithItemAsync(string email)
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

        return (client, item!.Id);
    }

    [Fact]
    public async Task ListOwnedCopies_Empty_ReturnsEmptyList()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-list@example.com");
        var response = await client.GetAsync($"/api/items/{itemId}/copies");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var copies = await response.Content.ReadFromJsonAsync<List<OwnedCopyResult>>();
        Assert.NotNull(copies);
        Assert.Empty(copies);
    }

    [Fact]
    public async Task CreateOwnedCopy_WithValidData_ReturnsCreated()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-create@example.com");
        var response = await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new
        {
            Condition = "Mint",
            PurchasePrice = 29.99m,
            EstimatedValue = 50.00m,
            AcquisitionSource = "eBay",
            Notes = "Great condition"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var copy = await response.Content.ReadFromJsonAsync<OwnedCopyResult>();
        Assert.NotNull(copy);
        Assert.Equal("Mint", copy.Condition);
        Assert.Equal(29.99m, copy.PurchasePrice);
        Assert.Equal(itemId, copy.CatalogItemId);
        Assert.True(copy.Id > 0);
    }

    [Fact]
    public async Task CreateOwnedCopy_InvalidCondition_ReturnsBadRequest()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-badcond@example.com");
        var response = await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new
        {
            Condition = "InvalidCondition"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateOwnedCopy_MultipleCopies_Allowed()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-multi@example.com");

        await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new { Condition = "Mint" });
        await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new { Condition = "Good" });
        await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new { Condition = "Fair" });

        var response = await client.GetAsync($"/api/items/{itemId}/copies");
        var copies = await response.Content.ReadFromJsonAsync<List<OwnedCopyResult>>();
        Assert.Equal(3, copies!.Count);
    }

    [Fact]
    public async Task UpdateOwnedCopy_UpdatesFields()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-update@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new
        {
            Condition = "Good",
            PurchasePrice = 10.00m
        });
        var created = await createResponse.Content.ReadFromJsonAsync<OwnedCopyResult>();

        var response = await client.PutAsJsonAsync($"/api/items/{itemId}/copies/{created!.Id}", new
        {
            Condition = "Mint",
            PurchasePrice = 10.00m,
            EstimatedValue = 100.00m,
            Notes = "Upgraded condition"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var copy = await response.Content.ReadFromJsonAsync<OwnedCopyResult>();
        Assert.Equal("Mint", copy!.Condition);
        Assert.Equal(100.00m, copy.EstimatedValue);
        Assert.Equal("Upgraded condition", copy.Notes);
    }

    [Fact]
    public async Task DeleteOwnedCopy_ReturnsNoContent()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-delete@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new { Condition = "Fair" });
        var created = await createResponse.Content.ReadFromJsonAsync<OwnedCopyResult>();

        var response = await client.DeleteAsync($"/api/items/{itemId}/copies/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listResponse = await client.GetAsync($"/api/items/{itemId}/copies");
        var copies = await listResponse.Content.ReadFromJsonAsync<List<OwnedCopyResult>>();
        Assert.Empty(copies!);
    }

    [Fact]
    public async Task OwnedCopy_RequiresAuth()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/items/1/copies");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task OwnedCopy_WrongItem_ReturnsNotFound()
    {
        var (client, _) = await CreateAuthenticatedClientWithItemAsync("oc-wrongitem@example.com");
        var response = await client.GetAsync("/api/items/99999/copies");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UploadImage_ReturnsOkWithImageUrl()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-upload@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new { Condition = "Mint" });
        var created = await createResponse.Content.ReadFromJsonAsync<OwnedCopyResult>();

        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "image", "photo.png");

        var response = await client.PostAsync($"/api/items/{itemId}/copies/{created!.Id}/images", content);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<OwnedCopyResult>();
        Assert.NotNull(result);
        Assert.Single(result.Images);
        Assert.Contains("/uploads/", result.Images[0]);
    }

    [Fact]
    public async Task UploadImage_MultipleImages_AllPersist()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-multi-img@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new { Condition = "Good" });
        var created = await createResponse.Content.ReadFromJsonAsync<OwnedCopyResult>();

        for (var i = 0; i < 3; i++)
        {
            using var content = new MultipartFormDataContent();
            var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
            content.Add(fileContent, "image", $"photo{i}.png");
            await client.PostAsync($"/api/items/{itemId}/copies/{created!.Id}/images", content);
        }

        var listResponse = await client.GetAsync($"/api/items/{itemId}/copies");
        var copies = await listResponse.Content.ReadFromJsonAsync<List<OwnedCopyResult>>();
        Assert.Equal(3, copies![0].Images.Count);
    }

    [Fact]
    public async Task UploadImage_NoFile_ReturnsBadRequest()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-nofile@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new { Condition = "Mint" });
        var created = await createResponse.Content.ReadFromJsonAsync<OwnedCopyResult>();

        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(Array.Empty<byte>());
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "image", "empty.png");
        var response = await client.PostAsync($"/api/items/{itemId}/copies/{created!.Id}/images", content);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UploadImage_WrongCopyId_ReturnsNotFound()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-wrongcopy@example.com");

        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "image", "photo.png");

        var response = await client.PostAsync($"/api/items/{itemId}/copies/99999/images", content);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UploadImage_ThenFetchCopies_ShowsImages()
    {
        var (client, itemId) = await CreateAuthenticatedClientWithItemAsync("oc-persist-img@example.com");

        var createResponse = await client.PostAsJsonAsync($"/api/items/{itemId}/copies", new { Condition = "Mint" });
        var created = await createResponse.Content.ReadFromJsonAsync<OwnedCopyResult>();

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "image", "photo.png");
        await client.PostAsync($"/api/items/{itemId}/copies/{created!.Id}/images", content);

        var listResponse = await client.GetAsync($"/api/items/{itemId}/copies");
        var copies = await listResponse.Content.ReadFromJsonAsync<List<OwnedCopyResult>>();
        Assert.NotNull(copies);
        Assert.Single(copies);
        Assert.Single(copies[0].Images);
        Assert.Contains("/uploads/", copies[0].Images[0]);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record IdResult(int Id);
    private record OwnedCopyResult(int Id, int CatalogItemId, string Condition, decimal? PurchasePrice, decimal? EstimatedValue, DateTime? AcquisitionDate, string? AcquisitionSource, string? Notes, List<string> Images);
}
