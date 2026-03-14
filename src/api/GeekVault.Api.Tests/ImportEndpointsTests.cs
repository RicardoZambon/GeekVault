using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace GeekVault.Api.Tests;

public class ImportEndpointsTests : IClassFixture<TestFactory<ImportEndpointsTests>>
{
    private readonly TestFactory<ImportEndpointsTests> _factory;

    public ImportEndpointsTests(TestFactory<ImportEndpointsTests> factory)
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

    private async Task<(HttpClient Client, int CollectionId)> CreateAuthenticatedClientWithCollectionAsync(
        string email, bool withRequiredField = false)
    {
        var client = await CreateAuthenticatedClientAsync(email);

        var customFields = withRequiredField
            ? new object[]
            {
                new { Name = "Color", Type = "text", Required = true },
                new { Name = "Year", Type = "number", Required = false }
            }
            : new object[]
            {
                new { Name = "Color", Type = "text", Required = false }
            };

        var ctResponse = await client.PostAsJsonAsync("/api/collection-types", new
        {
            Name = "General",
            CustomFields = customFields
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

    private static MultipartFormDataContent CreateCsvContent(string csvText)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes(csvText));
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        content.Add(fileContent, "file", "import.csv");
        return content;
    }

    [Fact]
    public async Task Import_RequiresAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var csv = CreateCsvContent("Identifier,Name\nITEM1,Test");
        var response = await client.PostAsync("/api/collections/1/import", csv);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Import_NonExistentCollection_Returns404()
    {
        var client = await CreateAuthenticatedClientAsync("import-notfound@example.com");
        var csv = CreateCsvContent("Identifier,Name\nITEM1,Test");
        var response = await client.PostAsync("/api/collections/99999/import", csv);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Import_OtherUsersCollection_Returns404()
    {
        var (client1, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("import-owner@example.com");
        var client2 = await CreateAuthenticatedClientAsync("import-other@example.com");

        var csv = CreateCsvContent("Identifier,Name\nITEM1,Test");
        var response = await client2.PostAsync($"/api/collections/{collectionId}/import", csv);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Import_NoFile_Returns400()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("import-nofile@example.com");
        var content = new MultipartFormDataContent();
        var response = await client.PostAsync($"/api/collections/{collectionId}/import", content);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Import_ValidCsv_ImportsItems()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("import-valid@example.com");
        var csvText = "Identifier,Name,Description,Color\nITEM1,Widget A,A nice widget,Red\nITEM2,Widget B,Another widget,Blue";
        var csv = CreateCsvContent(csvText);

        var response = await client.PostAsync($"/api/collections/{collectionId}/import", csv);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, result.GetProperty("importedCount").GetInt32());
        Assert.Equal(0, result.GetProperty("errorCount").GetInt32());

        // Verify items were created
        var itemsResponse = await client.GetFromJsonAsync<PaginatedResult<JsonElement>>($"/api/collections/{collectionId}/items");
        Assert.Equal(2, itemsResponse!.TotalCount);
    }

    [Fact]
    public async Task Import_RowWithMissingRequiredFields_ReportsErrors()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("import-errors@example.com");
        var csvText = "Identifier,Name,Description\nITEM1,Widget A,Good\n,Missing Identifier,Bad\nITEM3,,Also bad";
        var csv = CreateCsvContent(csvText);

        var response = await client.PostAsync($"/api/collections/{collectionId}/import", csv);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, result.GetProperty("importedCount").GetInt32());
        Assert.Equal(2, result.GetProperty("errorCount").GetInt32());
    }

    [Fact]
    public async Task Preview_ReturnsParsedRowsWithValidation()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync(
            "import-preview@example.com", withRequiredField: true);
        var csvText = "Identifier,Name,Color,Year\nITEM1,Widget A,Red,2024\n,Missing ID,Blue,abc";
        var csv = CreateCsvContent(csvText);

        var response = await client.PostAsync($"/api/collections/{collectionId}/import/preview", csv);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(result.GetProperty("hasErrors").GetBoolean());
        Assert.Equal(2, result.GetProperty("totalRows").GetInt32());
        Assert.Equal(1, result.GetProperty("validRows").GetInt32());
        Assert.Equal(1, result.GetProperty("errorRows").GetInt32());
        Assert.NotNull(result.GetProperty("previewId").GetString());

        // Verify row details
        var rows = result.GetProperty("rows");
        Assert.Equal(2, rows.GetArrayLength());
    }

    [Fact]
    public async Task Preview_ThenConfirm_SavesValidRows()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("import-confirm@example.com");
        var csvText = "Identifier,Name,Description,Color\nITEM1,Widget A,Good,Red\n,Bad Row,,";
        var csv = CreateCsvContent(csvText);

        // Preview
        var previewResponse = await client.PostAsync($"/api/collections/{collectionId}/import/preview", csv);
        previewResponse.EnsureSuccessStatusCode();
        var preview = await previewResponse.Content.ReadFromJsonAsync<JsonElement>();
        var previewId = preview.GetProperty("previewId").GetString()!;

        // Confirm
        var confirmResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/import/confirm", new { PreviewId = previewId });
        confirmResponse.EnsureSuccessStatusCode();
        var confirm = await confirmResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, confirm.GetProperty("importedCount").GetInt32());
        Assert.Equal(1, confirm.GetProperty("skippedCount").GetInt32());

        // Verify item was created
        var itemsResponse = await client.GetFromJsonAsync<PaginatedResult<JsonElement>>($"/api/collections/{collectionId}/items");
        Assert.Equal(1, itemsResponse!.TotalCount);
    }

    [Fact]
    public async Task Confirm_InvalidPreviewId_Returns400()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("import-badpreview@example.com");
        var confirmResponse = await client.PostAsJsonAsync($"/api/collections/{collectionId}/import/confirm", new { PreviewId = "nonexistent" });
        Assert.Equal(HttpStatusCode.BadRequest, confirmResponse.StatusCode);
    }

    [Fact]
    public async Task Import_ValidatesCustomFieldTypes()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync(
            "import-customfield@example.com", withRequiredField: true);
        // Color is required text, Year is optional number
        var csvText = "Identifier,Name,Color,Year\nITEM1,Widget A,Red,2024\nITEM2,Widget B,,notanumber";
        var csv = CreateCsvContent(csvText);

        var response = await client.PostAsync($"/api/collections/{collectionId}/import", csv);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        // ITEM1 is valid, ITEM2 has errors (Color required, Year not a number)
        Assert.Equal(1, result.GetProperty("importedCount").GetInt32());
        Assert.Equal(1, result.GetProperty("errorCount").GetInt32());
    }

    [Fact]
    public async Task Import_CsvWithQuotedFields_ParsesCorrectly()
    {
        var (client, collectionId) = await CreateAuthenticatedClientWithCollectionAsync("import-quoted@example.com");
        var csvText = "Identifier,Name,Description,Color\nITEM1,\"Widget, A\",\"A \"\"nice\"\" widget\",Red";
        var csv = CreateCsvContent(csvText);

        var response = await client.PostAsync($"/api/collections/{collectionId}/import", csv);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, result.GetProperty("importedCount").GetInt32());

        // Verify the name was parsed correctly with comma
        var itemsResponse = await client.GetFromJsonAsync<PaginatedResult<JsonElement>>($"/api/collections/{collectionId}/items");
        var items = itemsResponse!.Items;
        Assert.Single(items);
        Assert.Equal("Widget, A", items[0].GetProperty("name").GetString());
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record IdResult(int Id);
    private record PaginatedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);
}
