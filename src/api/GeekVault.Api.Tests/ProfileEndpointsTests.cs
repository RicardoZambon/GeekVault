using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace GeekVault.Api.Tests;

public class ProfileEndpointsTests : IClassFixture<TestFactory<ProfileEndpointsTests>>
{
    private readonly TestFactory<ProfileEndpointsTests> _factory;

    public ProfileEndpointsTests(TestFactory<ProfileEndpointsTests> factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, string Token)> CreateAuthenticatedClientAsync(string email)
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
        return (client, result.Token);
    }

    [Fact]
    public async Task GetProfile_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/profile");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetProfile_WithAuth_ReturnsProfile()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("profile-get@example.com");

        var response = await client.GetAsync("/api/profile");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var profile = await response.Content.ReadFromJsonAsync<ProfileResult>();
        Assert.NotNull(profile);
        Assert.Equal("profile-get@example.com", profile.Email);
        Assert.Equal("Test User", profile.DisplayName);
    }

    [Fact]
    public async Task UpdateProfile_UpdatesFields()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("profile-update@example.com");

        var response = await client.PutAsJsonAsync("/api/profile", new
        {
            DisplayName = "Updated Name",
            Bio = "My bio",
            PreferredLanguage = "pt",
            PreferredCurrency = "BRL"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var profile = await response.Content.ReadFromJsonAsync<ProfileResult>();
        Assert.NotNull(profile);
        Assert.Equal("Updated Name", profile.DisplayName);
        Assert.Equal("My bio", profile.Bio);
        Assert.Equal("pt", profile.PreferredLanguage);
        Assert.Equal("BRL", profile.PreferredCurrency);
    }

    [Fact]
    public async Task UpdateProfile_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.PutAsJsonAsync("/api/profile", new
        {
            DisplayName = "Hacker"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UploadAvatar_WithFile_ReturnsAvatarUrl()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("profile-avatar@example.com");

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 }); // PNG magic bytes
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "avatar", "avatar.png");

        var response = await client.PostAsync("/api/profile/avatar", content);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<AvatarResult>();
        Assert.NotNull(result);
        Assert.Contains("/uploads/", result.AvatarUrl);
        Assert.EndsWith(".png", result.AvatarUrl);
    }

    [Fact]
    public async Task UploadAvatar_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        using var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent(new byte[] { 1 }), "avatar", "test.png");

        var response = await client.PostAsync("/api/profile/avatar", content);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UploadAvatar_ThenGetProfile_ShowsAvatarUrl()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("profile-avatar-check@example.com");

        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "avatar", "photo.png");

        await client.PostAsync("/api/profile/avatar", content);

        var response = await client.GetAsync("/api/profile");
        var profile = await response.Content.ReadFromJsonAsync<ProfileResult>();
        Assert.NotNull(profile);
        Assert.NotNull(profile.Avatar);
        Assert.Contains("/uploads/", profile.Avatar);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record ProfileResult(string Id, string Email, string? DisplayName, string? Avatar, string? Bio, string? PreferredLanguage, string? PreferredCurrency);
    private record AvatarResult(string AvatarUrl);
}
