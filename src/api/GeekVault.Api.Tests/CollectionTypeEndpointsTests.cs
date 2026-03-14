using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace GeekVault.Api.Tests;

public class CollectionTypeEndpointsTests : IClassFixture<TestFactory<CollectionTypeEndpointsTests>>
{
    private readonly TestFactory<CollectionTypeEndpointsTests> _factory;

    public CollectionTypeEndpointsTests(TestFactory<CollectionTypeEndpointsTests> factory)
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
        var result = await response.Content.ReadFromJsonAsync<AuthResult>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", result!.Token);
        return client;
    }

    [Fact]
    public async Task ListCollectionTypes_Empty_ReturnsEmptyList()
    {
        var client = await CreateAuthenticatedClientAsync("ct-list@example.com");
        var response = await client.GetAsync("/api/collection-types");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var types = await response.Content.ReadFromJsonAsync<List<CollectionTypeResult>>();
        Assert.NotNull(types);
        Assert.Empty(types);
    }

    [Fact]
    public async Task CreateCollectionType_WithValidData_ReturnsCreated()
    {
        var client = await CreateAuthenticatedClientAsync("ct-create@example.com");
        var response = await client.PostAsJsonAsync("/api/collection-types", new
        {
            Name = "Trading Cards",
            Description = "Card collection",
            Icon = "cards",
            CustomFields = new[]
            {
                new { Name = "Condition", Type = "enum", Required = true, Options = new[] { "Mint", "Good", "Fair" } },
                new { Name = "Year", Type = "number", Required = false, Options = (string[]?)null }
            }
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var ct = await response.Content.ReadFromJsonAsync<CollectionTypeResult>();
        Assert.NotNull(ct);
        Assert.Equal("Trading Cards", ct.Name);
        Assert.Equal(2, ct.CustomFields.Count);
        Assert.True(ct.Id > 0);
    }

    [Fact]
    public async Task CreateCollectionType_TooManyFields_ReturnsBadRequest()
    {
        var client = await CreateAuthenticatedClientAsync("ct-toomany@example.com");
        var fields = Enumerable.Range(1, 11).Select(i => new { Name = $"Field{i}", Type = "text", Required = false, Options = (string[]?)null }).ToArray();

        var response = await client.PostAsJsonAsync("/api/collection-types", new
        {
            Name = "Too Many Fields",
            CustomFields = fields
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateCollectionType_InvalidFieldType_ReturnsBadRequest()
    {
        var client = await CreateAuthenticatedClientAsync("ct-badtype@example.com");
        var response = await client.PostAsJsonAsync("/api/collection-types", new
        {
            Name = "Bad Type",
            CustomFields = new[] { new { Name = "Field1", Type = "invalid_type", Required = false, Options = (string[]?)null } }
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetCollectionType_ReturnsCorrectType()
    {
        var client = await CreateAuthenticatedClientAsync("ct-get@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collection-types", new
        {
            Name = "Comics",
            Description = "Comic books"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionTypeResult>();

        var response = await client.GetAsync($"/api/collection-types/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var ct = await response.Content.ReadFromJsonAsync<CollectionTypeResult>();
        Assert.Equal("Comics", ct!.Name);
    }

    [Fact]
    public async Task UpdateCollectionType_UpdatesFields()
    {
        var client = await CreateAuthenticatedClientAsync("ct-update@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collection-types", new { Name = "Original" });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionTypeResult>();

        var response = await client.PutAsJsonAsync($"/api/collection-types/{created!.Id}", new
        {
            Name = "Updated",
            Description = "Updated description",
            CustomFields = new[] { new { Name = "Rating", Type = "number", Required = true, Options = (string[]?)null } }
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var ct = await response.Content.ReadFromJsonAsync<CollectionTypeResult>();
        Assert.Equal("Updated", ct!.Name);
        Assert.Single(ct.CustomFields);
    }

    [Fact]
    public async Task DeleteCollectionType_ReturnsNoContent()
    {
        var client = await CreateAuthenticatedClientAsync("ct-delete@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/collection-types", new { Name = "ToDelete" });
        var created = await createResponse.Content.ReadFromJsonAsync<CollectionTypeResult>();

        var response = await client.DeleteAsync($"/api/collection-types/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getResponse = await client.GetAsync($"/api/collection-types/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task CollectionType_RequiresAuth()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/collection-types");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record CustomFieldResult(string Name, string Type, bool Required, List<string>? Options);
    private record CollectionTypeResult(int Id, string Name, string? Description, string? Icon, List<CustomFieldResult> CustomFields);
}
