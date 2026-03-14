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
        Assert.Equal(0, col.ItemCount);
        Assert.True(col.Id > 0);
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
    public async Task Collection_RequiresAuth()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/collections");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record CollectionTypeResult(int Id, string Name, string? Description, string? Icon);
    private record CollectionResult(int Id, string Name, string? Description, string? CoverImage, string Visibility, int CollectionTypeId, int ItemCount);
    private record CoverResult(string CoverUrl);
}
