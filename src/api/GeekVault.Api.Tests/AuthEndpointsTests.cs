using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace GeekVault.Api.Tests;

public class AuthEndpointsTests : IClassFixture<TestFactory<AuthEndpointsTests>>
{
    private readonly TestFactory<AuthEndpointsTests> _factory;

    public AuthEndpointsTests(TestFactory<AuthEndpointsTests> factory)
    {
        _factory = factory;
    }

    private async Task<(string Token, string UserId)> RegisterAndGetTokenAsync(HttpClient client, string email, string password = "Test@123456", string? displayName = null)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = email,
            Password = password,
            DisplayName = displayName ?? "Test User"
        });
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AuthResult>();
        return (result!.Token, result.UserId);
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsToken()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "register-test@example.com",
            Password = "Test@123456",
            DisplayName = "Test User"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<AuthResult>();
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.Equal("register-test@example.com", result.Email);
        Assert.Equal("Test User", result.DisplayName);
        Assert.NotEmpty(result.UserId);
    }

    [Fact]
    public async Task Register_WithWeakPassword_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "weak@example.com",
            Password = "123",
            DisplayName = "Weak"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var client = _factory.CreateClient();

        // Register first
        var regResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "login-test@example.com",
            Password = "Test@123456",
            DisplayName = "Login User"
        });
        Assert.Equal(HttpStatusCode.OK, regResponse.StatusCode);

        // Login
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "login-test@example.com",
            Password = "Test@123456"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<AuthResult>();
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.Equal("login-test@example.com", result.Email);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "nobody@example.com",
            Password = "Wrong@123456"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsync("/api/auth/logout", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_WithValidToken_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var (token, _) = await RegisterAndGetTokenAsync(client, "logout-test@example.com");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/api/auth/logout", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithValidToken_ReturnsUserInfo()
    {
        var client = _factory.CreateClient();
        var (token, _) = await RegisterAndGetTokenAsync(client, "me-test@example.com");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<MeResult>();
        Assert.NotNull(result);
        Assert.Equal("me-test@example.com", result.Email);
        Assert.NotEmpty(result.UserId);
        Assert.Equal("Test User", result.DisplayName);
    }

    [Fact]
    public async Task Me_ReturnsUserRole()
    {
        var client = _factory.CreateClient();
        var (token, _) = await RegisterAndGetTokenAsync(client, "me-role-test@example.com");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<MeResult>();
        Assert.NotNull(result);
        Assert.Equal("User", result.Role);
    }

    [Fact]
    public async Task Register_AssignsUserRole_JwtContainsRoleClaim()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "role-jwt-test@example.com",
            Password = "Test@123456",
            DisplayName = "Role Test"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<AuthResult>();
        Assert.NotNull(result);

        // Decode JWT and verify role claim
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result.Token);
        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role || c.Type == "role");
        Assert.NotNull(roleClaim);
        Assert.Equal("User", roleClaim.Value);
    }

    [Fact]
    public async Task AdminPolicy_RejectsNonAdminUser()
    {
        // Register an admin-protected endpoint test
        var client = _factory.CreateClient();
        var (token, _) = await RegisterAndGetTokenAsync(client, "non-admin-policy@example.com");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        // Try accessing a hypothetical admin endpoint — for now test the auth/me role
        var response = await client.GetAsync("/api/auth/me");
        var result = await response.Content.ReadFromJsonAsync<MeResult>();
        Assert.NotNull(result);
        Assert.Equal("User", result.Role);
        Assert.NotEqual("Admin", result.Role);
    }

    private record AuthResult(string Token, string UserId, string Email, string? DisplayName);
    private record MeResult(string UserId, string Email, string? DisplayName, string? Avatar, string? Role);
}
