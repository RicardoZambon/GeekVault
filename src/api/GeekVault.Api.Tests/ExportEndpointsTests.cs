using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace GeekVault.Api.Tests;

public class ExportEndpointsTests : IClassFixture<TestFactory<ExportEndpointsTests>>
{
    private readonly TestFactory<ExportEndpointsTests> _factory;

    public ExportEndpointsTests(TestFactory<ExportEndpointsTests> factory)
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

        var ctResponse = await client.PostAsJsonAsync("/api/collection-types", new
        {
            Name = "General",
            CustomFields = new[]
            {
                new { Name = "Color", Type = "text", Required = false }
            }
        });
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
    public async Task Export_RequiresAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/collections/1/export?format=json");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Export_NonExistentCollection_Returns404()
    {
        var client = await CreateAuthenticatedClientAsync("export-notfound@example.com");
        var response = await client.GetAsync("/api/collections/99999/export?format=json");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Export_OtherUsersCollection_Returns404()
    {
        var (client1, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("export-owner@example.com");
        var client2 = await CreateAuthenticatedClientAsync("export-other@example.com");

        var response = await client2.GetAsync($"/api/collections/{collectionId}/export?format=json");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Export_InvalidFormat_Returns400()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("export-badformat@example.com");
        var response = await client.GetAsync($"/api/collections/{collectionId}/export?format=xml");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ExportJson_EmptyCollection_ReturnsEmptyArray()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("export-empty-json@example.com");
        var response = await client.GetAsync($"/api/collections/{collectionId}/export?format=json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        var items = JsonSerializer.Deserialize<List<JsonElement>>(content);
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    [Fact]
    public async Task ExportJson_WithItemsAndCopies_ReturnsFullData()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("export-json-full@example.com");

        // Create catalog item with custom fields
        var itemResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/items", new
        {
            Identifier = "EXP-001",
            Name = "Export Item",
            Description = "Test export",
            Manufacturer = "TestCorp",
            Rarity = "Rare",
            CustomFieldValues = new[] { new { Name = "Color", Value = "Red" } }
        });
        itemResponse.EnsureSuccessStatusCode();
        var item = await itemResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        // Create owned copy
        await client.PostAsJsonAsync($"/api/items/{item!.Id}/copies", new
        {
            Condition = "Mint",
            PurchasePrice = 25.50m,
            EstimatedValue = 50.00m,
            AcquisitionDate = "2026-01-15",
            AcquisitionSource = "Store",
            Notes = "Great condition"
        });

        var response = await client.GetAsync($"/api/collections/{collectionId}/export?format=json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var items = JsonSerializer.Deserialize<List<JsonElement>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(items);
        Assert.Single(items);

        var exported = items[0];
        Assert.Equal("EXP-001", exported.GetProperty("identifier").GetString());
        Assert.Equal("Export Item", exported.GetProperty("name").GetString());
        Assert.Equal("Test export", exported.GetProperty("description").GetString());
        Assert.Equal("Rare", exported.GetProperty("rarity").GetString());

        var customFields = exported.GetProperty("customFields");
        Assert.Equal(1, customFields.GetArrayLength());
        Assert.Equal("Color", customFields[0].GetProperty("name").GetString());
        Assert.Equal("Red", customFields[0].GetProperty("value").GetString());

        var copies = exported.GetProperty("ownedCopies");
        Assert.Equal(1, copies.GetArrayLength());
        Assert.Equal("Mint", copies[0].GetProperty("condition").GetString());
        Assert.Equal(25.50m, copies[0].GetProperty("purchasePrice").GetDecimal());
    }

    [Fact]
    public async Task ExportCsv_WithItemsAndCopies_ReturnsCsvWithHeaders()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("export-csv-full@example.com");

        // Create catalog item
        var itemResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/items", new
        {
            Identifier = "CSV-001",
            Name = "CSV Item",
            Description = "CSV test",
            CustomFieldValues = new[] { new { Name = "Color", Value = "Blue" } }
        });
        itemResponse.EnsureSuccessStatusCode();
        var item = await itemResponse.Content.ReadFromJsonAsync<CatalogItemResult>();

        // Create owned copy
        await client.PostAsJsonAsync($"/api/items/{item!.Id}/copies", new
        {
            Condition = "Good",
            PurchasePrice = 10.00m
        });

        var response = await client.GetAsync($"/api/collections/{collectionId}/export?format=csv");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/csv", response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        // Header row
        Assert.StartsWith("Id,Identifier,Name,Description,ReleaseDate,Manufacturer,ReferenceCode,Image,Rarity,CustomFields,CopyId,Condition,PurchasePrice,EstimatedValue,AcquisitionDate,AcquisitionSource,Notes", lines[0]);

        // Data row
        Assert.Contains("CSV-001", lines[1]);
        Assert.Contains("CSV Item", lines[1]);
        Assert.Contains("Good", lines[1]);
        Assert.Contains("Color=Blue", lines[1]);
    }

    [Fact]
    public async Task ExportCsv_ItemWithoutCopies_ReturnsRowWithEmptyCopyFields()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("export-csv-nocopy@example.com");

        await client.PostAsJsonAsync($"/api/collections/{collectionId}/items", new
        {
            Identifier = "NOCP-001",
            Name = "No Copy Item",
            CustomFieldValues = Array.Empty<object>()
        });

        var response = await client.GetAsync($"/api/collections/{collectionId}/export?format=csv");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        Assert.Equal(2, lines.Length); // header + 1 data row
        Assert.Contains("NOCP-001", lines[1]);
        Assert.Contains("No Copy Item", lines[1]);
    }

    [Fact]
    public async Task ExportJson_DefaultsToJson_WhenNoFormatSpecified()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("export-default@example.com");
        var response = await client.GetAsync($"/api/collections/{collectionId}/export");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record IdResult(int Id);
    private record CatalogItemResult(int Id, int CollectionId, string Identifier, string Name);
}
